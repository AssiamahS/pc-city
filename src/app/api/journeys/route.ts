import { NextResponse } from "next/server";
import { journeys } from "../data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (patientId) {
    const filtered = journeys.filter((j) => j.patientId === patientId);
    return NextResponse.json({ journeys: filtered });
  }

  return NextResponse.json({ journeys });
}
