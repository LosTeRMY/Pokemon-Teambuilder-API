import type { cookies } from "next/headers";

/* Shared by the app/api/auth/* route handlers — the only code allowed to
 * touch this cookie (see root CLAUDE.md "Auth Architecture"). Plain client
 * code must go through useAuth/the proxy routes instead. */

export const SESSION_COOKIE = "pb_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // matches the 7-day JWT expiry set in authService.login()

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function setSessionCookie(store: CookieStore, token: string) {
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(store: CookieStore) {
  store.delete(SESSION_COOKIE);
}
