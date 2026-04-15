import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "alive", 
    router: "App Router",
    timestamp: new Date().toISOString() 
  });
}
