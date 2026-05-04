import { createHash } from "node:crypto";

import { auth } from "../../../../auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyVerifyFlow(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyVerifyFlow(request, context);
}

async function proxyVerifyFlow(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const email = session?.user?.email;

  if (typeof email !== "string" || email.trim() === "") {
    return NextResponse.json({ error: { code: "unauthenticated", message: "Sign in is required." } }, { status: 401 });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_VERIFYFLOW_API_BASE_URL;
  const apiToken = process.env.VERIFYFLOW_WEB_API_TOKEN;

  if (apiBaseUrl === undefined || apiToken === undefined) {
    return NextResponse.json({ error: { code: "server_config_error", message: "VerifyFlow API configuration is missing." } }, { status: 500 });
  }

  const { path } = await context.params;
  const url = new URL(path.join("/"), apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);
  url.search = request.nextUrl.search;

  const headers = new Headers({
    "Accept": "application/json",
    "Authorization": `Bearer ${apiToken}`,
    "X-VerifyFlow-User-Id": userIdFromEmail(email),
    "X-VerifyFlow-User-Email": email
  });

  const contentType = request.headers.get("content-type");
  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey !== null) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const requestInit: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (request.method !== "GET") {
    requestInit.body = await request.text();
  }

  const upstream = await fetch(url, requestInit);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json"
    }
  });
}

function userIdFromEmail(email: string): string {
  return `vf_${createHash("sha256").update(email.toLowerCase(), "utf8").digest("hex").slice(0, 24)}`;
}
