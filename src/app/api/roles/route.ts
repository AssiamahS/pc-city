import { NextResponse } from "next/server";
import { roles } from "../data";

export async function GET() {
  return NextResponse.json({ roles });
}

export async function PUT(req: Request) {
  const { id, onDuty } = await req.json();
  const role = roles.find((r) => r.id === id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  role.onDuty = onDuty;
  return NextResponse.json({ ok: true, role });
}
