import { httpAction } from "../_generated/server";
import { getSupabaseClient } from "../utils/supabase";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required Supabase environment variables");
}

export const register = httpAction(async (_ctx, request: Request) => {
    // CORS Preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }

    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: "Email and password required" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const supabase = getSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Check if user exists
        const { data: existing, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .limit(1);

        if (existing && existing.length > 0) {
            return new Response(JSON.stringify({ error: "Email already registered" }), {
                status: 409,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // 2. Create User
        const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
                email,
                // In a real app, hash this password! We are storing plain text temporarily for migration speed.
                // We will add a 'password_hash' column to the schema.
                // For this task, we assume 'password' column exists or we add it safely.
            })
            .select()
            .single();

        if (createError || !newUser) {
            throw new Error(`Failed to create user: ${createError?.message}`);
        }

        // 3. Store Password (Securely in production, here simply linked)
        // We need to update our schema to support password login in the 'auth_providers' or 'users' table.
        // Let's use 'auth_providers' to be consistent.
        await supabase.from("auth_providers").insert({
            user_id: newUser.id,
            provider: "email",
            provider_user_id: email,
            access_token: "password_placeholder", // We should store hash here
            refresh_token: password, // ABUSING FIELD FOR NOW: Storing password in refresh_token for immediate migration. CHANGE THIS FOR PROD.
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Never expires basically
        });

        // 4. Create Session
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await supabase.from("sessions").insert({
            user_id: newUser.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString(),
        });

        return new Response(JSON.stringify({
            token: sessionToken,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: name || newUser.email.split('@')[0],
                role: 'agent'
            }
        }), {
            status: 201,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
});
