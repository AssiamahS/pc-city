import { NextResponse } from "next/server";
import { messages, type CityMessage } from "../data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const buildingId = searchParams.get("buildingId");

  let filtered = messages;
  if (patientId) filtered = filtered.filter((m) => m.patientId === patientId);
  if (buildingId) filtered = filtered.filter((m) => m.buildingId === buildingId);

  return NextResponse.json({ messages: filtered });
}

export async function POST(req: Request) {
  const msg: CityMessage = await req.json();
  msg.id = msg.id || crypto.randomUUID();
  msg.timestamp = msg.timestamp || new Date().toISOString();
  messages.push(msg);
  if (messages.length > 500) messages.splice(0, messages.length - 500);
  return NextResponse.json({ ok: true, message: msg }, { status: 201 });
}
