import { NextRequest, NextResponse } from "next/server";

import dispatcher from "@/server/legacy-api/lib/dispatcher";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

type LegacyHandlerResult = {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
};

type LegacyEvent = {
  httpMethod: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string>;
  body: string | null;
  path: string;
  rawUrl: string;
  isBase64Encoded: false;
};

type LegacyHandler = (event: LegacyEvent) => Promise<LegacyHandlerResult>;
type LegacyModule = {
  default?: LegacyHandler | { handler?: LegacyHandler };
  handler?: LegacyHandler;
};

export const runtime = "nodejs";

function resolveTarget(pathSegments: string[]) {
  if (pathSegments.length === 0) {
    return { targetFunc: "", remainingSegments: [] };
  }

  if (pathSegments[0] === "v1" && pathSegments.length >= 2) {
    return {
      targetFunc: `${pathSegments[0]}-${pathSegments[1]}`,
      remainingSegments: pathSegments.slice(2),
    };
  }

  return {
    targetFunc: pathSegments[0],
    remainingSegments: pathSegments.slice(1),
  };
}

function resolveLegacyHandler(module: LegacyModule): LegacyHandler | undefined {
  const entry = module.default ?? module;
  return typeof entry === "function" ? entry : entry.handler;
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const { targetFunc, remainingSegments } = resolveTarget(path);
  const importFn = (dispatcher as Record<string, () => Promise<LegacyModule>>)[targetFunc];

  if (!importFn) {
    return NextResponse.json(
      { error: "Handler not found", target: targetFunc },
      { status: 404 },
    );
  }

  try {
    const legacyModule = await importFn();
    const legacyHandler = resolveLegacyHandler(legacyModule);

    if (!legacyHandler) {
      return NextResponse.json(
        { error: "Handler not exported", target: targetFunc },
        { status: 500 },
      );
    }

    const suffix = remainingSegments.length ? `/${remainingSegments.join("/")}` : "";
    const event: LegacyEvent = {
      httpMethod: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      queryStringParameters: Object.fromEntries(request.nextUrl.searchParams.entries()),
      body:
        request.method === "GET" || request.method === "HEAD"
          ? null
          : await request.text(),
      path: `/.netlify/functions/${targetFunc}${suffix}`,
      rawUrl: request.url,
      isBase64Encoded: false,
    };

    const result = await legacyHandler(event);

    return new NextResponse(result.body ?? "", {
      status: result.statusCode ?? 200,
      headers: result.headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
