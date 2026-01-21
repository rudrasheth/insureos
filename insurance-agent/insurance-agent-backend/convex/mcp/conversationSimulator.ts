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

    // Fetch ALL user insurance data for context
    const { data: emails, error: emailError } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", userId)
      .eq("is_insurance_related", true)
      .order("received_at", { ascending: false });

    if (emailError) {
      throw new Error(`Failed to fetch user context: ${emailError.message}`);
    }

    const userContext = emails
      ?.map((e: any) => `- ${e.category}: ${e.subject}\nBody: ${e.body || ''}\nSnippet: ${e.raw_snippet}`)
      .join("\n") || "No insurance context";

    const conversationContext =
      conversationHistory
        ?.map((m) => `${m.role}: ${m.content}`)
        .join("\n") || "Start of conversation";

    const prompt = `You are a helpful insurance agent assistant. Respond to the user's message with empathy and expertise.

User's Insurance Context:
${userContext}

Conversation History:
${conversationContext}

Current User Message: "${userMessage}"

Respond ONLY with valid JSON in this exact format:
{
  "agent_response": "string",
  "suggested_actions": ["action1", "action2"],
  "sentiment_detected": "neutral",
  "requires_escalation": false,
  "confidence_score": 0.8
}`;

    try {
      // Call Groq API
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              { role: "system", content: "You are a helpful insurance agent assistant. Output strictly valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5
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

      return {
        status: "success",
        agent_response: result.agent_response || "I'm here to help with your insurance questions.",
        suggested_actions: result.suggested_actions || [],
        sentiment: result.sentiment_detected || "neutral",
      };
    } catch (error) {
      throw new Error(`Conversation simulation failed: ${String(error)}`);
    }
  },
});
