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

    // Filter emails to prioritize policies/premiums and exclude generic tips
    const relevantEmails = (emails as any[]).filter((e: any) => {
      const subject = (e.subject || "").toLowerCase();
      const isImportant =
        subject.includes("policy") ||
        subject.includes("premium") ||
        subject.includes("renewal") ||
        subject.includes("receipt") ||
        subject.includes("statement") ||
        subject.includes("schedule") ||
        subject.includes("loan") || // Added loan
        subject.includes("insurance") || // Added insurance
        subject.includes("cover");

      const isGeneric =
        subject.includes("tips") ||
        subject.includes("newsletter") ||
        subject.includes("stay safe") ||
        subject.includes("guide") ||
        subject.includes("fraud") ||
        subject.includes("cyber") ||
        subject.includes("alert") ||
        subject.includes("security") ||
        subject.includes("credit for") || // Exclude "Premium Requests credit"
        subject.includes("subscription") ||
        subject.includes("verify") ||
        subject.includes("onboarding");

      // STRICT Filtering: Must be Important AND Not Generic
      return isImportant && !isGeneric;
    });

    // Build context from filtered emails
    const emailSummary = relevantEmails
      .map((e: any) => `Subject: ${e.subject}\nBody: ${e.body || ''}\nSnippet: ${e.raw_snippet}`)
      .join("\n\n");


    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      throw new Error("Groq API key not configured");
    }

    const prompt = `Analyze this user's insurance email history and generate a detailed financial persona.
    
    Email History:
    ${emailSummary}
    
    Respond with JSON:
    {
      "profile_name": "string (e.g., 'Under-insured Parent', 'Well-covered Professional')",
      "insurance_types": ["list of inferred insurance types"],
      "has_life_insurance": boolean,
      "has_health_insurance": boolean,
      "total_life_coverage": number (Sum Assured in currency, estimate if needed, 0 if none),
      "total_health_coverage": number (Sum Assured in currency, estimate if needed, 0 if none),
      "risk_profile": "conservative|moderate|aggressive",
      "key_concerns": ["list of inferred concerns"],
      "gap_analysis": "string (brief sentence on what is missing e.g. 'Low health cover')",
      "estimated_annual_premium": "number or null"
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

    // Persist Persona to Supabase
    const { error: upsertError } = await supabase
      .from("personas")
      .upsert(
        { user_id: userId, persona_data: persona },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Failed to save persona:", upsertError);
    }

    return {
      status: "success",
      persona,
      reasoning: `Generated from ${relevantEmails.length} insurance emails`,
      sources: relevantEmails.map((e: any) => ({
        subject: e.subject,
        sender: e.sender,
        date: e.received_at
      })),
    };
  }
);
