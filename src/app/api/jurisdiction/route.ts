import { NextResponse } from "next/server";
import { getJurisdiction, listJurisdictions } from "@/data/jurisdictions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("list") === "true") {
    return NextResponse.json({ jurisdictions: listJurisdictions() });
  }

  const state = searchParams.get("state");
  if (!state) {
    return NextResponse.json(
      { error: "Provide ?state=XX or ?list=true" },
      { status: 400 }
    );
  }

  const j = getJurisdiction(state);
  if (!j) {
    return NextResponse.json(
      { error: `Jurisdiction not found: ${state}`, available: listJurisdictions().map(x => x.code) },
      { status: 404 }
    );
  }

  return NextResponse.json(j);
}
