"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { getSupabaseClient } from "../utils/supabase";

/**
 * MCP Prompt 5: Conversation Simulator
 * Simulates AI customer service conversations about insurance
 */
export const conversationSimulatorAction = internalAction({
  args: {
    userId: v.string(),
    userMessage: v.string(),
    conversationHistory: v.optional(v.array(v.object({ role: v.string(), content: v.string() })))
  },
  handler: async (_ctx, { userId, userMessage, conversationHistory }) => {
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

    // Fetch saved persona for context
    const { data: personaData } = await supabase
      .from("personas")
      .select("persona_data")
      .eq("user_id", userId)
      .single();

    const persona = personaData?.persona_data || null;

    // Fetch user insurance data - OPTIMIZED to prevent Rate Limits
    const { data: emails, error: emailError } = await supabase
      .from("emails")
      .select("subject, body, sender, raw_snippet, received_at") // Select only needed fields
      .eq("user_id", userId)
      .eq("is_insurance_related", true)
      .order("received_at", { ascending: false })
      .limit(3); // STRICT LIMIT: Top 3 emails only

    if (emailError) {
      throw new Error(`Failed to fetch user context: ${emailError.message}`);
    }

    // Fetch saved chat history from database (last 6 messages for context)
    const { data: savedHistory } = await supabase
      .from("chat_history")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6); // Reduce history to 6

    // Combine saved history with current conversation (reverse to chronological order)
    const dbHistory = (savedHistory || [])
      .reverse()
      .map((m: any) => ({ role: m.role, content: m.content }));

    const fullHistory = [...dbHistory, ...(conversationHistory || [])];

    const relevantEmails = emails || [];

    const userContext = relevantEmails
      .map((e: any) => {
        // Truncate body strongly (1000 chars)
        const bodyPreview = (e.body || "").substring(0, 1000);
        return `Subject: ${e.subject}\nBody: ${bodyPreview}\nSnippet: ${e.raw_snippet}`;
      })
      .join("\n\n") || "No specific policy documents found.";

    const conversationContext =
      fullHistory.length > 0
        ? fullHistory.map((m) => `${m.role}: ${m.content}`).join("\n")
        : "Start of conversation";

    const personaContext = persona
      ? `\n\nUser Profile:\n- Risk Profile: ${persona.risk_profile}\n- Key Concerns: ${persona.key_concerns?.join(", ")}\n- Insurance Types: ${persona.insurance_types?.join(", ")}`
      : "";

    const systemPrompt = `You are InsureOS, an intelligent insurance assistant. 
    Use the provided user context (emails, persona) to answer questions accurately.

    User Persona: ${JSON.stringify(persona)}
    
    Relevant Policy Documents:
    ${userContext}

    Conversation History:
    ${conversationContext}
    
    Guidelines:
    - Be helpful, professional, and concise.
    - If specific policy details are missing, say so politely.
    - Provide financial advice based on the persona's risk profile.
    - CRITICAL: Do NOT list "Loans" or "Debts" as Insurance Policies. If the user asks for "Policies", "Insurance", or "Coverage", ONLY mention Insurance products (Health, Life, Car, etc.). Ignore Home Loans, Personal Loans, etc. unless explicitly asked about debt.
    - Output strictly valid JSON.
    `;

    try {
      // Call Groq API (Switch to Llama 3 8B for speed and rate limits)
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", // Use 8b-instant for Chat (Faster, Higher Limits)
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 800
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Groq API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const content = data.choices[0].message.content;

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch (e) {
        // Fallback if not JSON
        parsedResponse = {
          agent_response: content,
          suggested_actions: [],
          sentiment_detected: "neutral",
          requires_escalation: false,
          confidence_score: 0.5
        };
      }

      // Save new message to history
      await supabase.from("chat_history").insert([
        { user_id: userId, role: "user", content: userMessage },
        { user_id: userId, role: "assistant", content: parsedResponse.agent_response }
      ]);

      return parsedResponse;

    } catch (error) {
      console.error("Conversation simulation failed:", error);
      throw error;
    }
  }
});
