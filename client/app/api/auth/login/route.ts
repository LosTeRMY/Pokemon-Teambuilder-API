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
    const apiRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await apiRes.json();
    if (!apiRes.ok) return NextResponse.json(data, { status: apiRes.status });

    setSessionCookie(await cookies(), data.token);
    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ error: "Upstream request failed or timed out" }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
