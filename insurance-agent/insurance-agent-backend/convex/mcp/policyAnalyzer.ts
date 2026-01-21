"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { getSupabaseClient } from "../utils/supabase";

/**
 * MCP Prompt 2: Insurance Policy Analyzer
 * Deep analysis of policy documents and terms
 */
export const policyAnalyzerAction = internalAction({
  args: { userId: v.string(), emailId: v.optional(v.string()) },
  handler: async (_ctx, { userId, emailId }) => {
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

    // Fetch ALL policy-related emails
    let query = supabase
      .from("emails")
      .select("*")
      .eq("user_id", userId)
      .eq("is_insurance_related", true)
      .in("category", ["insurance"])
      .order("received_at", { ascending: false });

    if (emailId) {
      query = query.eq("id", emailId);
    }

    const { data: emails, error: emailError } = await query;

    if (emailError) {
      throw new Error(`Failed to fetch emails: ${emailError.message}`);
    }

    if (!emails || emails.length === 0) {
      return {
        status: "success",
        policies: [],
        compliance_score: 0,
        recommendations: ["No policy documents found. Please add insurance policies for analysis."],
      };
    }

    // Strict Filter
    const relevantEmails = emails.filter((e: any) => {
      const subject = (e.subject || "").toLowerCase();
      const isImportant =
        subject.includes("policy") ||
        subject.includes("premium") ||
        subject.includes("renewal") ||
        subject.includes("receipt") ||
        subject.includes("statement") ||
        subject.includes("schedule") ||
        subject.includes("insurance") ||
        subject.includes("cover");

      const isGeneric =
        subject.includes("tips") ||
        subject.includes("newsletter") ||
        subject.includes("guide") ||
        subject.includes("credit for") ||
        subject.includes("subscription");

      return isImportant && !isGeneric;
    });

    const emailSummary = relevantEmails
      .map((e: any) => `Date: ${e.received_at}\nSubject: ${e.subject}\nBody: ${e.body || ''}\nContent: ${e.raw_snippet}`)
      .join("\n---\n");

    const prompt = `Analyze the following insurance policy communications and extract key policy details.

Documents:
${emailSummary}

Respond with JSON:
{
  "policies": [
    {
      "policy_number": "string or null",
      "type": "string (e.g., Life, Health, Auto)",
      "provider": "string",
      "coverage_amount": "string or null",
      "renewal_date": "date or null",
      "status": "active|expired|pending"
    }
  ],
  "compliance_score": "number 0-100 (coverage adequacy)",
  "recommendations": ["list of actionable recommendations"],
  "risk_gaps": ["identified coverage gaps"]
}`;

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
              { role: "system", content: "You are an AI policy analyzer. Output strictly valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Groq API error: ${res.status} - ${JSON.stringify(errorData)}`);
      }

      const data = (await res.json()) as any;
      const text = data.choices[0].message.content || "{}";
      const result = JSON.parse(text);

      return {
        status: "success",
        policies: result.policies || [],
        compliance_score: result.compliance_score || 0,
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      throw new Error(`Policy analysis failed: ${String(error)}`);
    }
  },
});
