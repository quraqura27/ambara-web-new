import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ tonsShipped: 121, onTimeRate: 99.2, countriesServed: 52 });
}
