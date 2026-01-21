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

        const prompt = `Analyze these emails and extract loan repayment information.
Look for:
- Loan Account Statements
- EMI Due Reminders
- Repayment Confirmations
- Home/Car/Personal Loan details

IMPORTANT:
1. Extract DATA even if the email is forwarded or sent by a personal name (e.g. "Ishita Sheth").
2. Ignore purely promotional "Pre-approved Offers" unless they contain existing loan details.
3. If outstanding balance or EMI is mentioned, capture it.

Emails:
${emailContext}

For each loan found, extract:
{
  "loans": [
    {
      "loan_type": "home|personal|car|education|other",
      "lender_name": "string",
      "principal_amount": number or null,
      "interest_rate": number or null,
      "emi_amount": number or null,
      "tenure_months": number or null,
      "remaining_tenure_months": number or null,
      "outstanding_balance": number or null
    }
  ]
}

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

            const loans = result.loans || [];

            // Save loans to database
            if (loans.length > 0) {
                const loansToInsert = loans.map((loan: any) => ({
                    user_id: userId,
                    email_id: emailId || emails[0].id,
                    loan_type: loan.loan_type,
                    lender_name: loan.lender_name,
                    principal_amount: loan.principal_amount,
                    interest_rate: loan.interest_rate,
                    emi_amount: loan.emi_amount,
                    tenure_months: loan.tenure_months,
                    remaining_tenure_months: loan.remaining_tenure_months,
                    outstanding_balance: loan.outstanding_balance,
                }));

                const { error: insertError } = await supabase
                    .from("loans")
                    .insert(loansToInsert);

                if (insertError) {
                    console.error("Failed to save loans:", insertError);
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
