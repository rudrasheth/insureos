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

        const { data: allEmails, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch emails: ${error.message}`);
        }

        if (!allEmails || allEmails.length === 0) {
            return {
                status: "success",
                loans: [],
                message: "No emails found to analyze",
            };
        }

        // Filter to ONLY loan-related emails
        const emails = (allEmails as any[]).filter((e: any) => {
            const subject = (e.subject || "").toLowerCase();
            return subject.includes("loan") ||
                subject.includes("emi") ||
                subject.includes("mortgage");
        });

        if (emails.length === 0) {
            return {
                status: "success",
                loans: [],
                message: "No loan-related emails found",
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

        const prompt = `You are a loan data extraction expert. Extract loan details from these emails.

Emails:
${emailContext}

EXTRACTION RULES:
1. Look for lines like "EMI Amount: Rs. 89,500" → Extract "89500" or "Rs. 89,500"
2. Look for lines like "Interest Rate: 8.40% per annum" → Extract "8.40" or "8.40%"
3. Look for lines like "Principal Outstanding: Rs. 95,00,000" → Extract "9500000" or "Rs. 95,00,000"
4. Look for lines like "Remaining Tenure: 156 months" → Extract 156

Return JSON in this EXACT format:
{
  "loans": [
    {
      "loan_type": "home",
      "lender_name": "HDFC Bank",
      "principal_amount": "9500000",
      "interest_rate": "8.40",
      "emi_amount": "89500",
      "tenure_months": 240,
      "remaining_tenure_months": 156,
      "outstanding_balance": "9500000"
    }
  ]
}

CRITICAL: DO NOT return null for any field if the value exists in the email. Extract the raw text if needed.
If no loans found, return {"loans": []}`;

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
