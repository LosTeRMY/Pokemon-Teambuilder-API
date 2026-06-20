/* api.ts — fetch helper for the Express API. Routed through
 * app/api/proxy/[...path]/ rather than NEXT_PUBLIC_API_URL directly: the
 * session JWT lives in an httpOnly cookie client JS can't read, so only a
 * server-side route handler can attach it as the Authorization header
 * Express actually checks — see root CLAUDE.md "Auth Architecture". */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* Route handlers report errors two ways: AppError-driven ones as
 * `{ error: "some string" }`, Zod validation failures as
 * `{ error: { field: ["message", ...] } }` (the .flatten().fieldErrors
 * shape) — flatten both into one readable line instead of losing the detail
 * behind a generic "Request failed with 400". */
function describeError(body: unknown, status: number): string {
  const err = (body as { error?: unknown } | null)?.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const parts = Object.entries(err as Record<string, unknown>).flatMap(([field, messages]) =>
      Array.isArray(messages) ? messages.map((m) => `${field}: ${m}`) : [`${field}: ${String(messages)}`],
    );
    if (parts.length) return parts.join("; ");
  }
  return `Request failed with ${status}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, describeError(body, res.status));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
