import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setSessionCookie } from "@/lib/sessionCookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  const body = await req.json();
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const registerData = await registerRes.json();
  if (!registerRes.ok) return NextResponse.json(registerData, { status: registerRes.status });

  // Auto-login right after signup so the user lands in a session, not back at a login form.
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) return NextResponse.json(loginData, { status: loginRes.status });

  setSessionCookie(await cookies(), loginData.token);
  return NextResponse.json({ user: loginData.user });
}
