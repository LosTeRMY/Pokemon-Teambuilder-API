import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("Missing required env var: NEXT_PUBLIC_API_URL");
}

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const apiRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!apiRes.ok) return NextResponse.json({ user: null });

    const data = await apiRes.json();
    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
