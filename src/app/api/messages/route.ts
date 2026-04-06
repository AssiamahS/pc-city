import { NextResponse } from "next/server";

export interface CityMessage {
  id: string;
  from: string;
  to: string;
  fromRole: string;
  toRole: string;
  body: string;
  priority: "normal" | "priority" | "urgent";
  timestamp: string;
  buildingId?: string;
}

// In-memory store (replace with DB later)
const messages: CityMessage[] = [];

export async function GET() {
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const msg: CityMessage = await req.json();
  msg.id = msg.id || crypto.randomUUID();
  msg.timestamp = msg.timestamp || new Date().toISOString();
  messages.push(msg);
  // Keep last 200
  if (messages.length > 200) messages.splice(0, messages.length - 200);
  return NextResponse.json({ ok: true, message: msg }, { status: 201 });
}
