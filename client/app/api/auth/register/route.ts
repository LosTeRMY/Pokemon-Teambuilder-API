import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setSessionCookie } from "@/lib/sessionCookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("Missing required env var: NEXT_PUBLIC_API_URL");
}

export async function POST(req: Request) {
  const body = await req.json();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  try {
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) return NextResponse.json(registerData, { status: registerRes.status });

    // Auto-login right after signup so the user lands in a session, not back
    // at a login form — register() doesn't issue a token itself (see
    // server/src/services/authService.ts), so this second call is required.
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      signal: controller.signal,
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) return NextResponse.json(loginData, { status: loginRes.status });

    setSessionCookie(await cookies(), loginData.token);
    return NextResponse.json({ user: loginData.user });
  } catch {
    return NextResponse.json({ error: "Upstream request failed or timed out" }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
