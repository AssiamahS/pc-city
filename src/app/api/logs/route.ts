import { NextResponse } from "next/server";
import { logs, type LogEntry } from "../data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const source = searchParams.get("source");
  const limit = parseInt(searchParams.get("limit") || "50");

  let filtered = logs;
  if (level) filtered = filtered.filter((l) => l.level === level);
  if (source) filtered = filtered.filter((l) => l.source === source);

  return NextResponse.json({ logs: filtered.slice(-limit) });
}

export async function POST(req: Request) {
  const entry: LogEntry = await req.json();
  entry.id = entry.id || crypto.randomUUID();
  entry.timestamp = entry.timestamp || new Date().toISOString();
  logs.push(entry);
  if (logs.length > 1000) logs.splice(0, logs.length - 1000);
  return NextResponse.json({ ok: true, log: entry }, { status: 201 });
}
