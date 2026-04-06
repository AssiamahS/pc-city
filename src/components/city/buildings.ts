export interface Building {
  id: string;
  label: string;
  type: "doctor" | "pharmacy" | "hospital" | "lab" | "insurance" | "patient";
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  color: string;
  description: string;
}

export interface MessageFlow {
  id: string;
  from: string;
  to: string;
  label: string;
  color: string;
  speed: number; // seconds per trip
}

export const BUILDINGS: Building[] = [
  {
    id: "doctor",
    label: "Doctor's Office",
    type: "doctor",
    position: [-6, 0, -3],
    size: [2.5, 3, 2],
    color: "#3b82f6",
    description: "Primary care physician. Prescribes medications, orders labs, sends referrals.",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    type: "pharmacy",
    position: [6, 0, -3],
    size: [2.5, 2, 2],
    color: "#22c55e",
    description: "Fills prescriptions, checks drug interactions, contacts prescriber for refill auth.",
  },
  {
    id: "hospital",
    label: "Hospital / ER",
    type: "hospital",
    position: [0, 0, -8],
    size: [3.5, 5, 2.5],
    color: "#ef4444",
    description: "Emergency department, inpatient care. Sends discharge summaries to PCP.",
  },
  {
    id: "lab",
    label: "Lab",
    type: "lab",
    position: [-6, 0, 5],
    size: [2, 2, 2],
    color: "#a855f7",
    description: "Processes blood work, imaging orders. Returns results to ordering physician.",
  },
  {
    id: "insurance",
    label: "Insurance",
    type: "insurance",
    position: [6, 0, 5],
    size: [2.5, 4, 2],
    color: "#f59e0b",
    description: "Processes prior authorizations, claims, coverage checks. Approves or denies.",
  },
  {
    id: "patient",
    label: "Patient Home",
    type: "patient",
    position: [0, 0, 6],
    size: [1.8, 1.5, 1.8],
    color: "#06b6d4",
    description: "The patient. Requests refills, receives care plans, gets bills.",
  },
];

export const SCENARIOS: { name: string; flows: MessageFlow[] }[] = [
  {
    name: "Pharmacist Calls Doctor for Refill",
    flows: [
      { id: "f1", from: "patient", to: "pharmacy", label: "Refill request", color: "#06b6d4", speed: 2 },
      { id: "f2", from: "pharmacy", to: "doctor", label: "Fax/call for auth", color: "#22c55e", speed: 3 },
      { id: "f3", from: "doctor", to: "pharmacy", label: "Refill approved", color: "#3b82f6", speed: 2 },
      { id: "f4", from: "pharmacy", to: "patient", label: "Rx ready", color: "#22c55e", speed: 1.5 },
    ],
  },
  {
    name: "Lab Order & Results",
    flows: [
      { id: "l1", from: "doctor", to: "lab", label: "Lab order", color: "#3b82f6", speed: 2 },
      { id: "l2", from: "patient", to: "lab", label: "Patient visit", color: "#06b6d4", speed: 2.5 },
      { id: "l3", from: "lab", to: "doctor", label: "Results", color: "#a855f7", speed: 3 },
      { id: "l4", from: "doctor", to: "patient", label: "Results review", color: "#3b82f6", speed: 2 },
    ],
  },
  {
    name: "Prior Authorization Battle",
    flows: [
      { id: "p1", from: "doctor", to: "pharmacy", label: "Prescription", color: "#3b82f6", speed: 1.5 },
      { id: "p2", from: "pharmacy", to: "insurance", label: "Claims submission", color: "#22c55e", speed: 2 },
      { id: "p3", from: "insurance", to: "pharmacy", label: "DENIED - need prior auth", color: "#ef4444", speed: 2 },
      { id: "p4", from: "pharmacy", to: "doctor", label: "PA needed", color: "#22c55e", speed: 2.5 },
      { id: "p5", from: "doctor", to: "insurance", label: "PA submission", color: "#3b82f6", speed: 3 },
      { id: "p6", from: "insurance", to: "doctor", label: "Approved", color: "#f59e0b", speed: 3 },
      { id: "p7", from: "doctor", to: "pharmacy", label: "PA confirmed", color: "#3b82f6", speed: 1.5 },
      { id: "p8", from: "pharmacy", to: "patient", label: "Rx finally ready", color: "#22c55e", speed: 1.5 },
    ],
  },
  {
    name: "ER Visit & Discharge",
    flows: [
      { id: "e1", from: "patient", to: "hospital", label: "ER arrival", color: "#06b6d4", speed: 2 },
      { id: "e2", from: "hospital", to: "lab", label: "Stat labs", color: "#ef4444", speed: 1.5 },
      { id: "e3", from: "lab", to: "hospital", label: "Results", color: "#a855f7", speed: 2 },
      { id: "e4", from: "hospital", to: "doctor", label: "Discharge summary", color: "#ef4444", speed: 3 },
      { id: "e5", from: "hospital", to: "pharmacy", label: "Discharge Rx", color: "#ef4444", speed: 2.5 },
      { id: "e6", from: "hospital", to: "insurance", label: "ER claim", color: "#ef4444", speed: 3 },
    ],
  },
];
