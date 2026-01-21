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

        const prompt = `Extract loan data from these emails. Find ANY numbers related to loans.

${emailContext}

Find and extract:
- EMI or Monthly Payment amount (look for "EMI", "monthly", "installment", "payment")
- Interest Rate (look for "rate", "interest", "ROI", "%")  
- Tenure in months (look for "tenure", "months", "term", "period")
- Principal or Loan Amount (look for "principal", "amount", "loan amount", "outstanding")

Return JSON with extracted numbers (remove Rs, ₹, %, commas):
{
  "loans": [{
    "loan_type": "home",
    "lender_name": "extract bank name",
    "emi_amount": "extract number or null",
    "interest_rate": "extract number or null",
    "tenure_months": "extract number or null",
    "principal_amount": "extract number or null",
    "outstanding_balance": "extract number or null"
  }]
}

Return {"loans": []} if no loan data found.`;

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
            console.log(`[LoanExtractor] AI returned: ${text}`);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("[LoanExtractor] Failed to parse AI JSON, retrying with regex cleanup");
                // Try to sanitize JSON
                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                try {
                    result = JSON.parse(cleanText);
                } catch (e2) {
                    result = { loans: [] }; // Fallback to empty if even cleanup fails
                }
            }

            const aiLoans = result.loans || [];

            // Regex Fallback Helpers
            const extractRegex = (text: string, patterns: RegExp[]): number | null => {
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        const num = parseNum(match[1]);
                        if (num) return num;
                    }
                }
                return null;
            };

            const processedLoans = aiLoans.map((l: any) => {
                // If AI missed fields, try regex on the full email context
                const emi = parseNum(l.emi_amount) || extractRegex(emailContext, [/EMI.*?:?\s*Rs\.?\s*([\d,]+)/i, /Installment.*?:?\s*Rs\.?\s*([\d,]+)/i, /Payment.*?:?\s*Rs\.?\s*([\d,]+)/i]);
                const rate = parseNum(l.interest_rate) || extractRegex(emailContext, [/Interest Rate.*?:?\s*([\d.]+)/i, /Rate.*?:?\s*([\d.]+)%/i, /ROI.*?:?\s*([\d.]+)%/i]);
                const tenure = parseNum(l.tenure_months) || extractRegex(emailContext, [/Tenure.*?:?\s*(\d+)\s*months/i, /Term.*?:?\s*(\d+)\s*months/i]);
                const principal = parseNum(l.principal_amount) || parseNum(l.outstanding_balance) || extractRegex(emailContext, [/Principal.*?:?\s*Rs\.?\s*([\d,]+)/i, /Outstanding.*?:?\s*Rs\.?\s*([\d,]+)/i]);

                return {
                    user_id: userId,
                    email_id: emailId || (emails[0] as any).id,
                    loan_type: (l.loan_type || "other").toLowerCase(),
                    lender_name: l.lender_name || "Unknown Lender",
                    principal_amount: principal,
                    interest_rate: rate,
                    emi_amount: emi,
                    tenure_months: tenure,
                    remaining_tenure_months: l.remaining_tenure_months ? parseNum(l.remaining_tenure_months) : null,
                    outstanding_balance: parseNum(l.outstanding_balance) || principal,
                };
            });

            console.log("[LoanExtractor] Processed loans with fallback:", JSON.stringify(processedLoans, null, 2));

            if (processedLoans.length > 0) {
                // Fetch existing loans to de-duplicate
                const { data: existingLoans } = await supabase
                    .from("loans")
                    .select("lender_name, loan_type, emi_amount")
                    .eq("user_id", userId);

                const loansToInsert = processedLoans.filter((newLoan: any) => {
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
                loans: processedLoans,
                count: processedLoans.length,
                debug_analyzed_subjects: emails.map((e: any) => e.subject),
            };

        } catch (error) {
            throw new Error(`Loan extraction failed: ${String(error)}`);
        }
    }
);
