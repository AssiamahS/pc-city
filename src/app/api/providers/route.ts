import { NextResponse } from "next/server";
import type { CityProvider } from "@/lib/types";

// In-memory store — replace with DB later
const providers: Map<number, CityProvider> = new Map();

// Seed a few demo providers so the city isn't empty
const SEED: CityProvider[] = [
  {
    npi: 1234567890,
    name: "Dr. Amara Patel, MD",
    credential: "MD",
    specialty: "Family Medicine",
    type: "doctor",
    address: { street: "100 Main St", city: "Springfield", state: "IL", zip: "62701", phone: "217-555-0100" },
    building: { color: "#3b82f6", height: 3, tagline: "Your family doctor" },
    optedIn: true,
    claimedAt: "2026-04-07T00:00:00Z",
    position: [-7, 0, -2],
  },
  {
    npi: 1234567891,
    name: "City Pharmacy",
    credential: "RPh",
    specialty: "Community/Retail Pharmacy",
    type: "pharmacy",
    address: { street: "200 Oak Ave", city: "Springfield", state: "IL", zip: "62701", phone: "217-555-0200" },
    building: { color: "#22c55e", height: 2, tagline: "Fast fills, fair prices" },
    optedIn: true,
    claimedAt: "2026-04-07T00:00:00Z",
    position: [7, 0, -2],
  },
  {
    npi: 1234567892,
    name: "Springfield General Hospital",
    credential: "",
    specialty: "General Acute Care Hospital",
    type: "hospital",
    address: { street: "1 Hospital Dr", city: "Springfield", state: "IL", zip: "62702", phone: "217-555-0300" },
    building: { color: "#ef4444", height: 5, tagline: "Level II Trauma Center" },
    optedIn: true,
    claimedAt: "2026-04-07T00:00:00Z",
    position: [0, 0, -8],
  },
  {
    npi: 1234567893,
    name: "Midwest Radiology Lab",
    credential: "",
    specialty: "Diagnostic Radiology",
    type: "lab",
    address: { street: "50 Science Blvd", city: "Springfield", state: "IL", zip: "62703", phone: "217-555-0400" },
    building: { color: "#a855f7", height: 2, tagline: "Results in 24 hours" },
    optedIn: true,
    claimedAt: "2026-04-07T00:00:00Z",
    position: [-7, 0, 6],
  },
  {
    npi: 1234567894,
    name: "Dr. Marcus Lee, DO",
    credential: "DO",
    specialty: "Orthopedic Surgery",
    type: "doctor",
    address: { street: "300 Pine Rd", city: "Springfield", state: "IL", zip: "62701", phone: "217-555-0500" },
    building: { color: "#0ea5e9", height: 3, tagline: "Bones & joints specialist" },
    optedIn: true,
    claimedAt: "2026-04-07T00:00:00Z",
    position: [0, 0, 3],
  },
];

for (const p of SEED) providers.set(p.npi, p);

// GET — list opted-in providers (the city's buildings)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // filter by type
  const npi = searchParams.get("npi");   // get single

  if (npi) {
    const p = providers.get(Number(npi));
    return p
      ? NextResponse.json({ provider: p })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let list = Array.from(providers.values()).filter((p) => p.optedIn);
  if (type) list = list.filter((p) => p.type === type);

  return NextResponse.json({ providers: list, total: list.length });
}

// POST — provider opts in / claims their building
export async function POST(req: Request) {
  const body = await req.json();
  const { npi, name, credential, specialty, type, address, building } = body;

  if (!npi || !name) {
    return NextResponse.json({ error: "npi and name required" }, { status: 400 });
  }

  // Assign position in a grid
  const count = providers.size;
  const col = (count % 5) - 2; // -2 to 2
  const row = Math.floor(count / 5);
  const position: [number, number, number] = [col * 5, 0, -8 + row * 5];

  const provider: CityProvider = {
    npi,
    name,
    credential: credential || "",
    specialty: specialty || "",
    type: type || "doctor",
    address: address || {},
    building: {
      color: building?.color || "#3b82f6",
      height: building?.height || 3,
      logo: building?.logo,
      tagline: building?.tagline,
    },
    optedIn: true,
    claimedAt: new Date().toISOString(),
    position,
  };

  providers.set(npi, provider);
  return NextResponse.json({ ok: true, provider }, { status: 201 });
}

// PATCH — update building customization (the "shop")
export async function PATCH(req: Request) {
  const body = await req.json();
  const { npi, building } = body;

  const existing = providers.get(Number(npi));
  if (!existing) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  if (building) {
    if (building.color) existing.building.color = building.color;
    if (building.height) existing.building.height = building.height;
    if (building.logo !== undefined) existing.building.logo = building.logo;
    if (building.tagline !== undefined) existing.building.tagline = building.tagline;
  }

  providers.set(existing.npi, existing);
  return NextResponse.json({ ok: true, provider: existing });
}
