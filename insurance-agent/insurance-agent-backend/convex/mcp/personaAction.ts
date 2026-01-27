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

    // Fetch recent emails
    const { data: emails } = await supabase
      .from("emails")
      .select("subject, body, sender, received_at, is_insurance_related")
      .eq("user_id", userId)
      .order("received_at", { ascending: false })
      .limit(50); // Analyze last 50 emails

    // Fetch extracted loans - Include loan data in Persona
    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("user_id", userId);

    // Filter for important emails
    const importantEmails = (emails || []).filter((e: any) => {
      const subject = (e.subject || "").toLowerCase();
      const sender = (e.sender || "").toLowerCase();

      const keywords = ["insurance", "policy", "premium", "coverage", "renewal", "life", "health", "term", "vehicle", "car", "bike"];

      const isImportant =
        e.is_insurance_related ||
        keywords.some(k => subject.includes(k) || sender.includes(k));

      const isGeneric =
        subject.includes("tips") ||
        subject.includes("newsletter") ||
        subject.includes("stay safe") ||
        subject.includes("guide") ||
        subject.includes("fraud") ||
        subject.includes("cyber") ||
        subject.includes("alert") ||
        subject.includes("security") ||
        subject.includes("credit for") ||
        subject.includes("subscription") ||
        subject.includes("verify") ||
        subject.includes("onboarding");

      // STRICT Filtering: Must be Important AND Not Generic
      return isImportant && !isGeneric;
    });

    const hasLoans = loans && loans.length > 0;

    if (importantEmails.length === 0 && !hasLoans) {
      console.log("No important emails OR loans found for persona generation.");
      return { message: "No relevant data", persona: null };
    }

    // Construct Context
    let promptContext = "Here is the user's data from emails and loan statements:\n\n";

    if (importantEmails.length > 0) {
      promptContext += "--- RECENT INSURANCE EMAILS ---\n";
      promptContext += importantEmails.map((e: any) =>
        `- Date: ${e.received_at}\n  From: ${e.sender}\n  Subject: ${e.subject}\n  Snippet: ${(e.body || "").substring(0, 300)}...`
      ).join("\n\n");
      promptContext += "\n\n";
    }

    if (hasLoans) {
      promptContext += "--- EXTRACTED LOAN/DEBT DATA ---\n";
      promptContext += loans.map((l: any) =>
        `- Lender: ${l.lender_name}\n  Type: ${l.loan_type}\n  Principal: ${l.principal_amount}\n  Outstanding: ${l.outstanding_balance}\n  EMI: ${l.emi_amount}\n  Rate: ${l.interest_rate}%`
      ).join("\n\n");
      promptContext += "\n\n";
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      throw new Error("Groq API key not configured");
    }

    const prompt = `Analyze this user's insurance and financial history and generate a detailed financial persona.
    
    Data:
    ${promptContext}
    
    Respond with JSON:
    {
      "profile_name": "string (e.g., 'Under-insured Parent', 'Debt-Heavy Professional')",
      "insurance_types": ["list of inferred insurance types"],
      "has_life_insurance": boolean,
      "has_health_insurance": boolean,
      "has_loans": boolean,
      "total_life_coverage": number (Sum Assured in currency, estimate if needed, 0 if none),
      "total_health_coverage": number (Sum Assured in currency, estimate if needed, 0 if none),
      "total_debt": number (Total outstanding loans),
      "monthly_emi_outflow": number (Total monthly EMI),
      "risk_profile": "conservative|moderate|aggressive",
      "key_concerns": ["list of inferred concerns e.g. 'High Debt', 'Low Cover'"],
      "gap_analysis": "string (brief sentence on what is critical e.g. 'High debt with low life cover is risky')",
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
            { role: "system", content: "You are an AI financial analyst. Output strictly valid JSON." },
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
    // Handle potential duplicates gracefully
    const { data: existingRows, error: fetchError } = await supabase
      .from("personas")
      .select("id")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Failed to fetch existing persona:", fetchError);
    }

    if (existingRows && existingRows.length > 0) {
      // Update the first one
      const targetId = existingRows[0].id;

      const { error: updateError } = await supabase
        .from("personas")
        .update({ persona_data: persona, updated_at: new Date().toISOString() })
        .eq("id", targetId);

      if (updateError) {
        console.error("Failed to update persona:", updateError);
      } else {
        console.log(`[Persona] Updated persona ${targetId}`);
      }

      // Clean up duplicates if any
      if (existingRows.length > 1) {
        console.warn(`[Persona] Found ${existingRows.length} duplicates for user ${userId}. Cleaning up...`);
        const idsToDelete = existingRows.slice(1).map((r: any) => r.id);
        await supabase.from("personas").delete().in("id", idsToDelete);
      }

    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from("personas")
        .insert({ user_id: userId, persona_data: persona });

      if (insertError) {
        console.error("Failed to insert persona:", insertError);
      } else {
        console.log(`[Persona] Inserted new persona for user ${userId}`);
      }
    }

    return {
      status: "success",
      persona,
      reasoning: `Generated from ${importantEmails.length} insurance emails and ${loans?.length || 0} loans`,
      sources: {
        emails: importantEmails.map((e: any) => ({
          subject: e.subject,
          sender: e.sender,
          date: e.received_at
        })),
        loans: loans?.map((l: any) => ({
          lender: l.lender_name,
          type: l.loan_type,
          outstanding: l.outstanding_balance
        })) || []
      }
    };
  }
);
