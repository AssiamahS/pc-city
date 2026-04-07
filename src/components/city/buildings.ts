import type { CityProvider } from "@/lib/types";

export interface Building {
  id: string;
  label: string;
  type: "doctor" | "pharmacy" | "hospital" | "lab" | "insurance" | "patient";
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  description: string;
  npi?: number;
  tagline?: string;
  logo?: string;
}

export interface StoryStep {
  id: string;
  from: string;
  to: string;
  label: string;
  narration: string;
  color: string;
  duration: number;
}

export interface Story {
  id: string;
  title: string;
  patient: string;
  summary: string;
  steps: StoryStep[];
}

// Patient home is always present
export const PATIENT_BUILDING: Building = {
  id: "patient",
  label: "Ms. Jones's Home",
  type: "patient",
  position: [0, 0, 10],
  size: [2, 1.8, 2],
  color: "#06b6d4",
  description: "Gloria Jones, 58. Lives alone. Has diabetes. Tripped on her porch steps.",
};

// Insurance is always present (not NPI-based)
export const INSURANCE_BUILDING: Building = {
  id: "insurance",
  label: "BlueCross Insurance",
  type: "insurance",
  position: [10, 0, 6],
  size: [2.5, 4, 2],
  color: "#f59e0b",
  description: "Processes claims, prior authorizations, coverage. Approves or denies.",
};

// Convert a CityProvider into a Building for the 3D scene
export function providerToBuilding(p: CityProvider): Building {
  return {
    id: `npi-${p.npi}`,
    label: p.name,
    type: p.type,
    position: p.position || [0, 0, 0],
    size: [2.5, p.building.height, 2],
    color: p.building.color,
    description: `${p.specialty}. ${p.address.city}, ${p.address.state}. ${p.address.phone || ""}`.trim(),
    npi: p.npi,
    tagline: p.building.tagline,
    logo: p.building.logo,
  };
}

// Default buildings for when API hasn't loaded yet
export const DEFAULT_BUILDINGS: Building[] = [
  {
    id: "npi-1234567892",
    label: "Springfield General Hospital",
    type: "hospital",
    position: [0, 0, -8],
    size: [4, 5.5, 3],
    color: "#ef4444",
    description: "General Acute Care Hospital. Level II Trauma Center.",
    npi: 1234567892,
    tagline: "Level II Trauma Center",
  },
  {
    id: "npi-1234567890",
    label: "Dr. Amara Patel, MD",
    type: "doctor",
    position: [-7, 0, -2],
    size: [2.5, 3, 2],
    color: "#3b82f6",
    description: "Family Medicine. Springfield, IL.",
    npi: 1234567890,
    tagline: "Your family doctor",
  },
  {
    id: "npi-1234567891",
    label: "City Pharmacy",
    type: "pharmacy",
    position: [7, 0, -2],
    size: [2.5, 2.2, 2],
    color: "#22c55e",
    description: "Community/Retail Pharmacy. Springfield, IL.",
    npi: 1234567891,
    tagline: "Fast fills, fair prices",
  },
  {
    id: "npi-1234567893",
    label: "Midwest Radiology Lab",
    type: "lab",
    position: [-7, 0, 6],
    size: [2.2, 2.2, 2],
    color: "#a855f7",
    description: "Diagnostic Radiology. Results in 24 hours.",
    npi: 1234567893,
    tagline: "Results in 24 hours",
  },
  {
    id: "npi-1234567894",
    label: "Dr. Marcus Lee, DO",
    type: "doctor",
    position: [0, 0, 3],
    size: [2.5, 3, 2],
    color: "#0ea5e9",
    description: "Orthopedic Surgery. Bones & joints specialist.",
    npi: 1234567894,
    tagline: "Bones & joints specialist",
  },
];

// ---------------------------------------------------------------------------
// STORIES — reference buildings by ID pattern "npi-{number}" or special IDs
// ---------------------------------------------------------------------------
export const STORIES: Story[] = [
  {
    id: "broken-arm",
    title: "Ms. Jones Breaks Her Arm",
    patient: "Gloria Jones, 58",
    summary: "Ms. Jones trips on her porch steps and fractures her wrist. Watch as the healthcare system coordinates her care — from 911 to discharge to filling her pain meds.",
    steps: [
      {
        id: "s1", from: "patient", to: "npi-1234567892",
        label: "911 Call",
        narration: "Ms. Jones slips on her icy porch steps and lands hard on her left wrist. She can't move it. Her neighbor calls 911. The ambulance takes her to Springfield General.",
        color: "#ef4444", duration: 4,
      },
      {
        id: "s2", from: "npi-1234567892", to: "npi-1234567893",
        label: "X-Ray Order",
        narration: "The ER doctor examines her wrist — it's swollen and tender. He orders an X-ray stat. The order goes electronically to Midwest Radiology.",
        color: "#a855f7", duration: 3,
      },
      {
        id: "s3", from: "npi-1234567893", to: "npi-1234567892",
        label: "X-Ray Results",
        narration: "Radiology confirms: distal radius fracture, non-displaced. The images and report are sent back to the ER physician within 20 minutes.",
        color: "#a855f7", duration: 3,
      },
      {
        id: "s4", from: "npi-1234567892", to: "insurance",
        label: "ER Claim",
        narration: "The hospital's billing system automatically submits the ER visit claim to BlueCross. CPT codes for the visit, X-ray, and splint application.",
        color: "#f59e0b", duration: 3,
      },
      {
        id: "s5", from: "insurance", to: "npi-1234567892",
        label: "Claim Acknowledged",
        narration: "BlueCross receives the claim and sends back an acknowledgment. They'll process it within 30 days. Ms. Jones's $250 ER copay applies.",
        color: "#f59e0b", duration: 2.5,
      },
      {
        id: "s6", from: "npi-1234567892", to: "npi-1234567891",
        label: "Pain Rx",
        narration: "The ER doctor prescribes ibuprofen 800mg and a short course of Norco for breakthrough pain. The e-prescription is sent to City Pharmacy.",
        color: "#22c55e", duration: 3,
      },
      {
        id: "s7", from: "npi-1234567891", to: "insurance",
        label: "Rx Claim",
        narration: "City Pharmacy runs the prescriptions through insurance. The ibuprofen is covered at $0. But Norco needs a prior authorization...",
        color: "#f59e0b", duration: 3,
      },
      {
        id: "s8", from: "insurance", to: "npi-1234567891",
        label: "PA Required",
        narration: "BlueCross denies the Norco claim — prior authorization required for opioids. The pharmacist calls Dr. Patel to get the PA started.",
        color: "#ef4444", duration: 2.5,
      },
      {
        id: "s9", from: "npi-1234567891", to: "npi-1234567890",
        label: "PA Request",
        narration: "The pharmacist faxes (yes, fax) the PA request to Dr. Patel's office. They need the doctor to justify medical necessity for the Norco.",
        color: "#3b82f6", duration: 3,
      },
      {
        id: "s10", from: "npi-1234567890", to: "insurance",
        label: "PA Submission",
        narration: "Dr. Patel's office submits the prior auth with clinical notes: fracture confirmed, patient is diabetic (NSAIDs alone risky), short-term opioid justified.",
        color: "#f59e0b", duration: 3.5,
      },
      {
        id: "s11", from: "insurance", to: "npi-1234567890",
        label: "PA Approved",
        narration: "After 4 hours, BlueCross approves the PA. Norco authorized for 7-day supply. Approval sent back to Dr. Patel and the pharmacy.",
        color: "#22c55e", duration: 2.5,
      },
      {
        id: "s12", from: "insurance", to: "npi-1234567891",
        label: "PA Approved",
        narration: "City Pharmacy receives the approval. They can now fill the Norco. The pharmacist calls Ms. Jones to let her know it's ready.",
        color: "#22c55e", duration: 2,
      },
      {
        id: "s13", from: "npi-1234567892", to: "npi-1234567890",
        label: "Discharge Summary",
        narration: "The ER sends a discharge summary to Dr. Patel: fracture details, treatment given, follow-up in 1 week. This goes via the health information exchange.",
        color: "#3b82f6", duration: 3,
      },
      {
        id: "s14", from: "npi-1234567891", to: "patient",
        label: "Rx Ready",
        narration: "Ms. Jones's neighbor picks up both prescriptions. The pharmacist included instructions: take ibuprofen with food (diabetes), Norco only for severe pain.",
        color: "#06b6d4", duration: 3,
      },
      {
        id: "s15", from: "npi-1234567890", to: "patient",
        label: "Follow-Up Call",
        narration: "Dr. Patel's office calls Ms. Jones the next morning. They've reviewed the ER notes. Appointment scheduled for Tuesday to check the splint.",
        color: "#06b6d4", duration: 3.5,
      },
    ],
  },
  {
    id: "refill",
    title: "The Refill Runaround",
    patient: "Gloria Jones, 58",
    summary: "Ms. Jones needs her diabetes medication refilled, but the prescription has expired. Watch the back-and-forth between pharmacy, doctor, and insurance.",
    steps: [
      {
        id: "r1", from: "patient", to: "npi-1234567891",
        label: "Refill Request",
        narration: "Ms. Jones calls City Pharmacy to refill her metformin. She's been on it for 3 years. But the prescription expired last month — no refills remaining.",
        color: "#06b6d4", duration: 3,
      },
      {
        id: "r2", from: "npi-1234567891", to: "npi-1234567890",
        label: "Refill Auth Needed",
        narration: "The pharmacy faxes Dr. Patel's office requesting a new prescription for metformin 1000mg twice daily. They note Ms. Jones is out of medication.",
        color: "#3b82f6", duration: 3,
      },
      {
        id: "r3", from: "npi-1234567890", to: "npi-1234567891",
        label: "New Rx Sent",
        narration: "Dr. Patel reviews Ms. Jones's chart — her last A1C was 7.2, well-controlled. He sends a new e-prescription: metformin 1000mg, 90-day supply, 3 refills.",
        color: "#22c55e", duration: 3,
      },
      {
        id: "r4", from: "npi-1234567891", to: "insurance",
        label: "Claim Submitted",
        narration: "The pharmacy submits the claim to BlueCross. Metformin is on the preferred formulary — should be straightforward.",
        color: "#f59e0b", duration: 2.5,
      },
      {
        id: "r5", from: "insurance", to: "npi-1234567891",
        label: "Covered - $5 Copay",
        narration: "BlueCross approves it instantly. Tier 1 generic: $5 copay for a 90-day supply. No prior auth needed. This is how it should work.",
        color: "#22c55e", duration: 2,
      },
      {
        id: "r6", from: "npi-1234567891", to: "patient",
        label: "Rx Ready - $5",
        narration: "City Pharmacy texts Ms. Jones: 'Your metformin is ready. Copay: $5.00.' She picks it up on her way home from the grocery store.",
        color: "#06b6d4", duration: 3,
      },
    ],
  },
];
