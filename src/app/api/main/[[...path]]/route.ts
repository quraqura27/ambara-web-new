import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - Importing legacy JS logic into TS
const dispatcher = require("@/server/legacy-api/lib/dispatcher");
// @ts-ignore
const adapter = require("@/server/legacy-api/lib/adapter");

/**
 * APP ROUTER UNIVERSAL GATEWAY
 * Matches: /api/main/[[...path]]
 * This catch-all route dispatches traffic to legacy handlers.
 */
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await params;
  
  // Extract the function name from the last segment of the path
  const lastSegment = pathSegments && pathSegments.length > 0 
    ? pathSegments[pathSegments.length - 1] 
    : "";

  console.log(`[App Gateway] Incoming request for: ${lastSegment}`);

  // Check query params if path is missing in URL segments
  const searchParams = request.nextUrl.searchParams;
  const targetFunc = lastSegment || searchParams.get("path") || "";

  const legacyHandler = dispatcher[targetFunc];

  if (!legacyHandler) {
    console.warn(`[App Gateway] Handler not found for: ${targetFunc}`);
    return NextResponse.json({ 
      error: "Handler not found", 
      target: targetFunc,
      available_endpoints: Object.keys(dispatcher) 
    }, { status: 404 });
  }

  try {
    // 1. Prepare Next.js 15+ compatible Request spoof
    // We need to convert NextRequest back to something the legacy adapter understands
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    
    // Spoof a 'req' and 'res' object for the adapter
    const reqProxy = {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      query: { ...query, path: targetFunc },
      url: request.url,
      // Handle json/body if it exists
      body: request.method !== 'GET' ? await request.json().catch(() => null) : null
    };

    // We use a promise to capture the res.send/json output from the legacy code
    return new Promise((resolve) => {
      const resProxy = {
        status: (code: number) => {
          resProxy.statusCode = code;
          return resProxy;
        },
        statusCode: 200,
        setHeader: (key: string, value: string) => {
          resProxy.headers.set(key, value);
        },
        headers: new Headers(),
        send: (body: any) => {
          resolve(new NextResponse(body, { 
            status: resProxy.statusCode, 
            headers: resProxy.headers 
          }));
        },
        json: (body: any) => {
          resolve(NextResponse.json(body, { 
            status: resProxy.statusCode, 
            headers: resProxy.headers 
          }));
        }
      };

      // Execution
      const wrapped = adapter.wrap(legacyHandler.handler || legacyHandler, targetFunc);
      wrapped(reqProxy, resProxy);
    });
  } catch (error: any) {
    console.error(`[App Gateway Error] ${targetFunc}:`, error);
    return NextResponse.json({ 
      error: "Internal Gateway Error", 
      message: error.message 
    }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
export const PUT = handle;
export const DELETE = handle;
