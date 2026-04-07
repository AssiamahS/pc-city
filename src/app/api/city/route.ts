import { NextResponse } from "next/server";
import { taxonomyToType, formatProviderName, type NPIResult } from "@/lib/types";

const NPI_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1";

// Grid positions for buildings — spread out, no overlap
const GRID: [number, number, number][] = [
  [0, 0, -10],    // hospital center-back
  [-8, 0, -4],   // doctor 1
  [8, 0, -4],    // pharmacy
  [-8, 0, 4],    // lab
  [8, 0, 4],     // insurance placeholder
  [-4, 0, 0],    // doctor 2
  [4, 0, 0],     // doctor 3
  [0, 0, -4],    // specialist
  [-4, 0, 8],    // extra
  [4, 0, 8],     // extra
];

const TYPE_COLORS: Record<string, string> = {
  hospital: "#ef4444",
  doctor: "#3b82f6",
  pharmacy: "#22c55e",
  lab: "#a855f7",
  insurance: "#f59e0b",
};

interface CityBuilding {
  id: string;
  npi: number;
  name: string;
  credential: string;
  specialty: string;
  type: string;
  position: [number, number, number];
  color: string;
  address: { street: string; city: string; state: string; zip: string; phone?: string };
  height: number;
}

// GET /api/city?city=CHICAGO&state=IL
// Searches NPI for a mix of providers in that area, returns ready-to-render buildings
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.toUpperCase();
  const state = searchParams.get("state")?.toUpperCase();
  const zip = searchParams.get("zip");

  if (!state && !zip) {
    return NextResponse.json({ error: "state or zip required" }, { status: 400 });
  }

  // Search for a mix of provider types
  const searches = [
    { taxonomy_description: "General Acute Care Hospital", enumeration_type: "NPI-2", limit: 1 },
    { taxonomy_description: "Family Medicine", enumeration_type: "NPI-1", limit: 2 },
    { taxonomy_description: "Pharmacy", enumeration_type: "NPI-2", limit: 1 },
    { taxonomy_description: "Diagnostic Radiology", enumeration_type: "NPI-2", limit: 1 },
    { taxonomy_description: "Internal Medicine", enumeration_type: "NPI-1", limit: 1 },
    { taxonomy_description: "Orthopedic", enumeration_type: "NPI-1", limit: 1 },
    { taxonomy_description: "Pharmacist", enumeration_type: "NPI-1", limit: 1 },
  ];

  const allResults: NPIResult[] = [];

  for (const s of searches) {
    const params = new URLSearchParams({
      version: "2.1",
      taxonomy_description: s.taxonomy_description,
      enumeration_type: s.enumeration_type,
      limit: String(s.limit),
    });
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (zip) params.set("postal_code", zip);

    try {
      const res = await fetch(`${NPI_API}&${params.toString()}`);
      const data = await res.json();
      if (data.results) allResults.push(...data.results);
    } catch {
      // skip failed searches
    }
  }

  // Dedupe by NPI
  const seen = new Set<number>();
  const unique = allResults.filter((r) => {
    if (seen.has(r.number)) return false;
    seen.add(r.number);
    return true;
  });

  // Convert to buildings
  const buildings: CityBuilding[] = unique.slice(0, GRID.length).map((r, i) => {
    const type = taxonomyToType(r.taxonomies?.[0]?.desc || "");
    const addr = r.addresses?.[0];
    return {
      id: `npi-${r.number}`,
      npi: r.number,
      name: formatProviderName(r),
      credential: r.basic.credential || "",
      specialty: r.taxonomies?.[0]?.desc || "",
      type,
      position: GRID[i],
      color: TYPE_COLORS[type] || "#3b82f6",
      address: {
        street: addr?.address_1 || "",
        city: addr?.city || "",
        state: addr?.state || "",
        zip: addr?.postal_code || "",
        phone: addr?.telephone_number,
      },
      height: type === "hospital" ? 5 : type === "insurance" ? 4 : 3,
    };
  });

  const locationLabel = [city, state].filter(Boolean).join(", ");

  return NextResponse.json({
    location: locationLabel,
    buildings,
    total: buildings.length,
    scenarios: generateScenarios(buildings),
  });
}

// Auto-generate scenarios based on what providers we found
function generateScenarios(buildings: CityBuilding[]) {
  const hospital = buildings.find((b) => b.type === "hospital");
  const pcp = buildings.find((b) => b.type === "doctor");
  const pharmacy = buildings.find((b) => b.type === "pharmacy");
  const lab = buildings.find((b) => b.type === "lab");
  const specialist = buildings.find((b) => b.type === "doctor" && b !== pcp);

  const scenarios: any[] = [];

  // Scenario 1: ER visit (if hospital + lab exist)
  if (hospital && lab) {
    const steps: any[] = [
      { id: "a1", from: "patient", to: hospital.id, label: "ER Visit", narration: `Ms. Jones goes to ${hospital.name} emergency department with severe pain.`, color: "#ef4444", duration: 4 },
      { id: "a2", from: hospital.id, to: lab.id, label: "Lab Order", narration: `The ER doctor orders imaging from ${lab.name}.`, color: "#a855f7", duration: 3 },
      { id: "a3", from: lab.id, to: hospital.id, label: "Results", narration: `${lab.name} sends back the results — fracture confirmed.`, color: "#a855f7", duration: 3 },
    ];
    if (pharmacy) {
      steps.push({ id: "a4", from: hospital.id, to: pharmacy.id, label: "Discharge Rx", narration: `The ER sends prescriptions to ${pharmacy.name}.`, color: "#22c55e", duration: 3 });
      steps.push({ id: "a5", from: pharmacy.id, to: "patient", label: "Rx Ready", narration: `${pharmacy.name} fills the prescriptions. Ms. Jones picks them up.`, color: "#06b6d4", duration: 3 });
    }
    if (pcp) {
      steps.push({ id: "a6", from: hospital.id, to: pcp.id, label: "Discharge Summary", narration: `The ER sends discharge notes to ${pcp.name} for follow-up.`, color: "#3b82f6", duration: 3 });
      steps.push({ id: "a7", from: pcp.id, to: "patient", label: "Follow-Up", narration: `${pcp.name} calls Ms. Jones to schedule a follow-up appointment.`, color: "#06b6d4", duration: 3 });
    }
    scenarios.push({ id: "er-visit", title: "ER Visit", patient: "Gloria Jones, 58", summary: `Ms. Jones has an emergency and goes to ${hospital.name}. Watch the care coordination.`, steps });
  }

  // Scenario 2: Prescription refill (if PCP + pharmacy exist)
  if (pcp && pharmacy) {
    scenarios.push({
      id: "refill",
      title: "Prescription Refill",
      patient: "Gloria Jones, 58",
      summary: `Ms. Jones needs her medication refilled through ${pcp.name} and ${pharmacy.name}.`,
      steps: [
        { id: "b1", from: "patient", to: pharmacy.id, label: "Refill Request", narration: `Ms. Jones calls ${pharmacy.name} to refill her metformin. The prescription has expired.`, color: "#06b6d4", duration: 3 },
        { id: "b2", from: pharmacy.id, to: pcp.id, label: "Auth Needed", narration: `${pharmacy.name} contacts ${pcp.name} requesting a new prescription.`, color: "#3b82f6", duration: 3 },
        { id: "b3", from: pcp.id, to: pharmacy.id, label: "New Rx", narration: `${pcp.name} reviews the chart and sends a new e-prescription.`, color: "#22c55e", duration: 3 },
        { id: "b4", from: pharmacy.id, to: "patient", label: "Rx Ready", narration: `${pharmacy.name} fills the prescription. Ms. Jones picks it up — $5 copay.`, color: "#06b6d4", duration: 3 },
      ],
    });
  }

  // Scenario 3: Specialist referral (if PCP + specialist exist)
  if (pcp && specialist) {
    scenarios.push({
      id: "referral",
      title: "Specialist Referral",
      patient: "Gloria Jones, 58",
      summary: `${pcp.name} refers Ms. Jones to ${specialist.name} for specialized care.`,
      steps: [
        { id: "c1", from: "patient", to: pcp.id, label: "Check-Up", narration: `Ms. Jones visits ${pcp.name} for a routine check-up. The doctor notices something that needs a specialist.`, color: "#3b82f6", duration: 3 },
        { id: "c2", from: pcp.id, to: specialist.id, label: "Referral", narration: `${pcp.name} sends a referral to ${specialist.name} with clinical notes.`, color: "#0ea5e9", duration: 3 },
        { id: "c3", from: "patient", to: specialist.id, label: "Specialist Visit", narration: `Ms. Jones visits ${specialist.name} for evaluation.`, color: "#0ea5e9", duration: 4 },
        { id: "c4", from: specialist.id, to: pcp.id, label: "Consult Note", narration: `${specialist.name} sends findings back to ${pcp.name}: treatment plan recommended.`, color: "#3b82f6", duration: 3 },
        { id: "c5", from: pcp.id, to: "patient", label: "Care Plan", narration: `${pcp.name} calls Ms. Jones to discuss the specialist's findings and next steps.`, color: "#06b6d4", duration: 3 },
      ],
    });
  }

  return scenarios;
}
