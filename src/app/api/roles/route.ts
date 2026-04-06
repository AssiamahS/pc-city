import { NextResponse } from "next/server";

export interface Role {
  id: string;
  title: string;
  assignee: string;
  credential: string;
  buildingId: string;
  onDuty: boolean;
}

const roles: Role[] = [
  { id: "r1", title: "Emergency Department MD", assignee: "Alexandria Brooks, MD", credential: "MD", buildingId: "hospital", onDuty: true },
  { id: "r2", title: "Hospitalist", assignee: "Alexandria Brooks, MD", credential: "MD", buildingId: "hospital", onDuty: false },
  { id: "r3", title: "House Supervisor", assignee: "Will Rosenblom, MD", credential: "MD", buildingId: "hospital", onDuty: false },
  { id: "r4", title: "On-Call Cardiologist", assignee: "Will Rosenblom, MD", credential: "MD", buildingId: "doctor", onDuty: false },
  { id: "r5", title: "On-Call Pediatrician", assignee: "T.J. Whitmore, MD", credential: "MD", buildingId: "doctor", onDuty: false },
  { id: "r6", title: "On-Call Radiologist", assignee: "Alice Stevens, MD", credential: "MD", buildingId: "lab", onDuty: false },
  { id: "r7", title: "Pharmacist", assignee: "Deborah Wilson, CPhT", credential: "CPhT", buildingId: "pharmacy", onDuty: false },
];

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
