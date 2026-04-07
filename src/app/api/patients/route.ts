import { NextResponse } from "next/server";
import { patients } from "../data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ patient });
  }

  return NextResponse.json({ patients });
}
