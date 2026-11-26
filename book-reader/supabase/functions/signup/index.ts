import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Creates a Book Reader account that can sign in straight away (no confirmation email).
// The app then signs in with the same email and password. Deployed with verify_jwt = false.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "method" }, 405);
  let body: { email?: unknown; password?: unknown };
  try { body = await req.json(); } catch { return reply({ error: "bad_request" }, 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "email" }, 400);
  if (password.length < 8 || password.length > 72) return reply({ error: "password" }, 400);
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    const code = (error as { code?: string }).code || "";
    if (code === "email_exists" || /already/i.test(error.message)) return reply({ error: "exists" }, 409);
    if (code === "weak_password") return reply({ error: "password" }, 400);
    console.error("signup failed", code, error.message);
    return reply({ error: "server" }, 500);
  }
  return reply({ ok: true });
});
