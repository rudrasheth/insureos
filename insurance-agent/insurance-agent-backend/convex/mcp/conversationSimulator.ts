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

    // Fetch saved chat history from database (last 20 messages for context)
    const { data: savedHistory } = await supabase
      .from("chat_history")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Combine saved history with current conversation (reverse to chronological order)
    const dbHistory = (savedHistory || [])
      .reverse()
      .map((m: any) => ({ role: m.role, content: m.content }));

    const fullHistory = [...dbHistory, ...(conversationHistory || [])];

    // Filter emails to prioritize policies/premiums and exclude generic tips
    const relevantEmails = emails?.filter((e: any) => {
      const subject = (e.subject || "").toLowerCase();
      const isImportant =
        subject.includes("policy") ||
        subject.includes("premium") ||
        subject.includes("renewal") ||
        subject.includes("receipt") ||
        subject.includes("statement") ||
        subject.includes("schedule") ||
        subject.includes("cover");

      const isGeneric =
        subject.includes("tips") ||
        subject.includes("newsletter") ||
        subject.includes("stay safe") ||
        subject.includes("guide") ||
        subject.includes("fraud") ||
        subject.includes("cyber") ||
        subject.includes("alert") ||
        subject.includes("security");

      return isImportant && !isGeneric;
    });

    const userContext = relevantEmails
      ?.map((e: any) => `Subject: ${e.subject}\nBody: ${e.body || ''}\nSnippet: ${e.raw_snippet}`)
      .join("\n\n") || "No specific policy documents found.";

    const conversationContext =
      fullHistory.length > 0
        ? fullHistory.map((m) => `${m.role}: ${m.content}`).join("\n")
        : "Start of conversation";

    const personaContext = persona
      ? `\n\nUser Profile:\n- Risk Profile: ${persona.risk_profile}\n- Key Concerns: ${persona.key_concerns?.join(", ")}\n- Insurance Types: ${persona.insurance_types?.join(", ")}`
      : "";

    const prompt = `You are a helpful insurance agent assistant. Respond to the user's message with empathy and expertise.
    
CRITICAL INSTRUCTION: 
1. Focus ONLY on the user's actual insurance policies, premiums, and coverage details found in the "User's Insurance Context". 
2. DO NOT mention generic emails, safety tips, fraud alerts, or newsletters. 
3. If an email seems to be about "cyber safety" or "fraud prevention", IGNORE IT completely. It is NOT a policy.
4. If the user asks about policies, list ONLY the policies (e.g. Mediclaim, Life Insurance) and their amounts.

User's Insurance Context (Real Policies):
${userContext}${personaContext}

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
            model: "llama-3.3-70b-versatile",
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

      const agentResponse = result.agent_response || "I'm here to help with your insurance questions.";

      // Async save chat history (fire and forget pattern for speed, or await if strict)
      await Promise.all([
        supabase.from("chat_history").insert({ user_id: userId, role: "user", content: userMessage }),
        supabase.from("chat_history").insert({ user_id: userId, role: "agent", content: agentResponse })
      ]);

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
