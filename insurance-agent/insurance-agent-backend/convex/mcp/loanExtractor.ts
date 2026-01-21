"use node";

import { internalAction } from "../_generated/server";
import { getSupabaseClient } from "../utils/supabase";

/**
 * Loan Extractor Action
 * Analyzes loan repayment emails and extracts structured loan data
 */
export const loanExtractorAction = internalAction(
    async (ctx, args: { userId: string; emailId?: string }) => {
        const userId = args.userId;
        const emailId = args.emailId;

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Supabase not configured");
        }

        if (!GROQ_API_KEY) {
            throw new Error("Groq API key not configured");
        }

        const supabase = getSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Fetch ALL emails (not just insurance category)
        let query = supabase
            .from("emails")
            .select("*")
            .eq("user_id", userId)
            .order("received_at", { ascending: false });

        if (emailId) {
            query = query.eq("id", emailId).limit(1);
        } else {
            query = query.limit(50); // Analyze recent 50 emails
        }

        const { data: emails, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch emails: ${error.message}`);
        }

        if (!emails || emails.length === 0) {
            return {
                status: "success",
                loans: [],
                message: "No emails found to analyze",
            };
        }

        console.log(`[LoanExtractor] Analyzing ${emails.length} emails:`, emails.map((e: any) => e.subject));

        // Build email context
        const emailContext = (emails as any[])
            .map((e: any) => `Subject: ${e.subject}\nBody: ${e.body || ''}\nSnippet: ${e.raw_snippet}`)
            .join("\n\n");

        console.log("[LoanExtractor] Email context being sent to AI:", emailContext.substring(0, 500));

        // Helper to clean numbers
        const parseNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                // Remove currency symbols, commas, percent
                // e.g. "Rs. 1,00,000" -> "100000"
                const cleaned = val.replace(/,/g, '').replace(/[^0-9.]/g, '');
                const num = parseFloat(cleaned);
                return isNaN(num) ? null : num;
            }
            return null;
        };

        const prompt = `Analyze these emails and extract loan repayment information.
Look for:
- Loan Account Statements
- EMI Due Reminders
- Repayment Confirmations
- Home/Car/Personal Loan details

IMPORTANT:
1. Extract DATA even if the email is forwarded or sent by a personal name.
2. EXTRACT NUMBERS aggressively. If formatting is messy (e.g. "Rs 10,000"), return it as a STRING.
3. If outstanding balance or EMI is mentioned, capture it.

Emails:
${emailContext}

For each loan found, extract:
{
  "loans": [
    {
      "loan_type": "home|personal|car|education|other",
      "lender_name": "string",
      "principal_amount": "Rs. 95,00,000" OR 9500000 OR null,
      "interest_rate": "8.40% per annum" OR "8.40" OR 8.4 OR null,
      "emi_amount": "Rs. 89,500" OR 89500 OR null,
      "tenure_months": 156 OR "156 months" OR null,
      "remaining_tenure_months": 156 OR "156 months" OR null,
      "outstanding_balance": "Rs. 95,00,000" OR 9500000 OR null
    }
  ]
}

CRITICAL: If you see "EMI Amount: Rs. 89,500", extract it as "Rs. 89,500" or "89500" - DO NOT return null!
CRITICAL: If you see "Interest Rate: 8.40% per annum", extract it as "8.40" or "8.40%" - DO NOT return null!

If no loan repayment information found, return empty array.`;

        try {
            const res = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: "You are a financial data extraction AI. Output strictly valid JSON." },
                            { role: "user", content: prompt }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.1
                    }),
                }
            );

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`Groq API error: ${res.status} - ${errorBody}`);
            }

            const data = (await res.json()) as any;
            const text = data.choices[0].message.content || "{}";
            const result = JSON.parse(text);

            console.log("[LoanExtractor] AI returned:", JSON.stringify(result, null, 2));

            const loans = result.loans || [];

            // Save loans to database with Deduplication
            if (loans.length > 0) {
                // Fetch existing loans to de-duplicate
                const { data: existingLoans } = await supabase
                    .from("loans")
                    .select("lender_name, loan_type, emi_amount")
                    .eq("user_id", userId);

                const loansToInsert = loans
                    .map((loan: any) => ({
                        user_id: userId,
                        email_id: emailId || emails[0].id,
                        loan_type: (loan.loan_type || 'other').toLowerCase(),
                        lender_name: loan.lender_name || 'Unknown Lender',
                        principal_amount: parseNum(loan.principal_amount),
                        interest_rate: parseNum(loan.interest_rate),
                        emi_amount: parseNum(loan.emi_amount),
                        tenure_months: parseNum(loan.tenure_months),
                        remaining_tenure_months: parseNum(loan.remaining_tenure_months),
                        outstanding_balance: parseNum(loan.outstanding_balance),
                    }))
                    .filter((newLoan: any) => {
                        // Check if duplicate
                        const isDuplicate = existingLoans?.some((existing: any) =>
                            existing.lender_name === newLoan.lender_name &&
                            existing.loan_type === newLoan.loan_type &&
                            // If EMI matches or is very close, assume duplicate
                            (Math.abs((existing.emi_amount || 0) - (newLoan.emi_amount || 0)) < 10)
                        );
                        return !isDuplicate;
                    });

                if (loansToInsert.length > 0) {
                    const { error: insertError } = await supabase
                        .from("loans")
                        .insert(loansToInsert);

                    if (insertError) {
                        console.error("Failed to save loans:", insertError);
                    }
                }
            }

            return {
                status: "success",
                loans,
                count: loans.length,
                debug_analyzed_subjects: emails.map((e: any) => e.subject),
            };
        } catch (error) {
            throw new Error(`Loan extraction failed: ${String(error)}`);
        }
    }
);
