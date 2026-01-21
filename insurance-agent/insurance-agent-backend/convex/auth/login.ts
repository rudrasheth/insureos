import { httpAction } from "../_generated/server";
import { getSupabaseClient } from "../utils/supabase";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required Supabase environment variables");
}

export const login = httpAction(async (_ctx, request: Request) => {
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
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: "Email and password required" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const supabase = getSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Fetch user by email
        const { data: users, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .limit(1);

        if (userError || !users || users.length === 0) {
            // Security: Don't reveal if user exists
            return new Response(JSON.stringify({ error: "Invalid credentials" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const user = users[0];

        // 2. Verify Password
        // Fetch auth provider entry where we stored the password
        const { data: authProvider, error: authError } = await supabase
            .from("auth_providers")
            .select("refresh_token")
            .eq("user_id", user.id)
            .eq("provider", "email")
            .single();

        if (authError || !authProvider || authProvider.refresh_token !== password) {
            return new Response(JSON.stringify({ error: "Invalid credentials" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // 3. Create Session

        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await supabase.from("sessions").insert({
            user_id: user.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString(),
        });

        return new Response(JSON.stringify({
            token: sessionToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.email.split('@')[0], // Fallback name
                role: 'agent'
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
});
