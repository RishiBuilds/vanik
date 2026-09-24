import { NextResponse, type NextRequest } from "next/server";
import { getSuggestions } from "@/lib/queries/catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const data = await getSuggestions(q.slice(0, 80));
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
}
