import { NextResponse } from "next/server";
import { searchModels, type SearchScope } from "@/lib/search";

function getSafeScope(value: string | null): SearchScope {
  return value === "listed" ? "listed" : "catalog";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const scope = getSafeScope(searchParams.get("scope"));

  const result = await searchModels(q, scope);

  return NextResponse.json(result);
}