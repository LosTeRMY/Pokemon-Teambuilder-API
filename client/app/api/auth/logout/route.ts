import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/sessionCookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("Missing required env var: NEXT_PUBLIC_API_URL");
}

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  // Revoke server-side first (bumps token_version — see server/CLAUDE.md
  // "Security" — kills this token on every device, not just this browser),
  // then clear the local cookie either way. Best-effort: a dead/expired
  // token or a network hiccup here shouldn't block logging out locally.
  if (token) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      await fetch(`${API_URL}/auth/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch {
      // ignore — fall through to clearing the cookie regardless
    } finally {
      clearTimeout(timeoutId);
    }
  }

  clearSessionCookie(store);
  return NextResponse.json({ ok: true });
}
