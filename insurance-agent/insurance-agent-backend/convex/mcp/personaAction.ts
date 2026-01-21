"use node";

import { internalAction } from "../_generated/server";
import { getSupabaseClient } from "../utils/supabase";

/**
 * Internal action for persona generation
 * Fetches emails from Supabase and calls Gemini to generate persona
 */
export const personaGeneratorAction = internalAction(
  async (ctx, args: { userId: string }) => {
    const userId = args.userId;

    // Create Supabase client
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase not configured");
    }

    const supabase = getSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch ALL insurance emails from Supabase
    const { data: emails, error } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", userId)
      .eq("is_insurance_related", true)
      .order("received_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }

    if (!emails || emails.length === 0) {
      return {
        status: "success",
        persona: {
          profile_name: "New User",
          insurance_types: [],
          risk_profile: "unknown",
          engagement_level: "low",
        },
        reasoning: "No insurance emails found. User is new or inactive.",
      };
    }

    // Build context from emails
    const emailSummary = (emails as any[])
      .map((e: any) => `Subject: ${e.subject}\nBody: ${e.body || ''}\nSnippet: ${e.raw_snippet}`)
      .join("\n\n");


    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      throw new Error("Groq API key not configured");
    }

    const prompt = `Analyze this user's insurance email history and generate a detailed persona profile.

Email History:
${emailSummary}

Respond with JSON:
{
  "profile_name": "string (e.g., 'Conservative Investor', 'Active Manager')",
  "insurance_types": ["list of inferred insurance types"],
  "estimated_age_group": "string",
  "risk_profile": "conservative|moderate|aggressive",
  "engagement_level": "low|medium|high",
  "key_concerns": ["list of inferred concerns"],
  "estimated_annual_premium": "number or null",
  "policy_count": "estimated count"
}`;

    // Call Groq API (Llama 3 70B)
    const groqResponse = await fetch(
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
            { role: "system", content: "You are an AI insurance analyst. Output strictly valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }, // Groq supports JSON mode
          temperature: 0.2
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Groq API error: ${groqResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const data = (await groqResponse.json()) as any;
    const text = data.choices[0].message.content || "{}";
    const persona = JSON.parse(text);

    return {
      status: "success",
      persona,
      reasoning: `Generated from ${emails.length} insurance emails`,
    };
  }
);
