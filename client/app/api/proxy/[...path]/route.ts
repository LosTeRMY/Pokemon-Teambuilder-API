import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

/* Generic passthrough to the Express API. Exists because the session JWT
 * lives in an httpOnly cookie scoped to this Next.js origin — client JS can't
 * read it to attach an Authorization header on a direct browser->Express
 * call, and Express only ever checks that header, never cookies. Routing
 * everything through here lets a server-side route handler read the cookie
 * and forward it as Bearer for every /teams call, not just the obviously
 * "authenticated" ones — see root CLAUDE.md "Auth Architecture". */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function forward(req: NextRequest, path: string[]) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const url = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) init.body = body;
  }

  const apiRes = await fetch(url, init);
  const text = await apiRes.text();
  return new NextResponse(apiRes.status === 204 ? null : text, {
    status: apiRes.status,
    headers: { "Content-Type": apiRes.headers.get("Content-Type") ?? "application/json" },
  });
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  return forward(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: RouteParams) {
  return forward(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return forward(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return forward(req, (await params).path);
}
