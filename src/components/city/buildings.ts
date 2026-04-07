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

// A message in the story — NOT a person moving, but a MESSAGE being sent
export interface StoryStep {
  id: string;
  from: string;         // building ID sending
  to: string;           // building ID receiving
  label: string;        // short label on the message bubble
  narration: string;    // what shows in the dialogue box
  color: string;
  duration: number;
  // What kind of communication is this?
  method: "message" | "call" | "fax" | "erx" | "claim" | "alert" | "walk";
  // "walk" = Ms. Jones physically goes somewhere (rare)
}

export interface Story {
  id: string;
  title: string;
  patient: string;
  summary: string;
  steps: StoryStep[];
}

export const PATIENT_BUILDING: Building = {
  id: "patient",
  label: "Ms. Jones's Home",
  type: "patient",
  position: [0, 0, 12],
  size: [2, 1.8, 2],
  color: "#06b6d4",
  description: "Gloria Jones, 58. Lives alone. Has diabetes, hypertension. Uses Coordra to message her pharmacy and view care updates.",
};

export const INSURANCE_BUILDING: Building = {
  id: "insurance",
  label: "BlueCross Insurance",
  type: "insurance",
  position: [12, 0, 4],
  size: [2.5, 4, 2],
  color: "#f59e0b",
  description: "Processes claims, prior authorizations, coverage. Connected to Coordra for real-time auth responses.",
};

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

export const DEFAULT_BUILDINGS: Building[] = [
  {
    id: "npi-1234567892",
    label: "Springfield General",
    type: "hospital",
    position: [0, 0, -10],
    size: [4, 5.5, 3],
    color: "#ef4444",
    description: "General Acute Care Hospital. Level II Trauma Center. ER, inpatient, imaging.",
    npi: 1234567892,
    tagline: "Level II Trauma Center",
  },
  {
    id: "npi-1234567890",
    label: "Dr. Patel, MD",
    type: "doctor",
    position: [-8, 0, -3],
    size: [2.5, 3, 2],
    color: "#3b82f6",
    description: "Family Medicine. Ms. Jones's PCP. Uses Coordra to coordinate care with pharmacy and specialists.",
    npi: 1234567890,
    tagline: "Family Medicine — PCP",
  },
  {
    id: "npi-1234567891",
    label: "City Pharmacy",
    type: "pharmacy",
    position: [8, 0, -3],
    size: [2.5, 2.2, 2],
    color: "#22c55e",
    description: "Community pharmacy. Fills Rx, checks interactions, contacts prescribers via Coordra.",
    npi: 1234567891,
    tagline: "Your neighborhood pharmacy",
  },
  {
    id: "npi-1234567893",
    label: "Midwest Radiology",
    type: "lab",
    position: [-8, 0, 6],
    size: [2.2, 2.2, 2],
    color: "#a855f7",
    description: "Diagnostic imaging and lab work. X-ray, MRI, blood panels. Results sent via Coordra.",
    npi: 1234567893,
    tagline: "Results in 24 hours",
  },
  {
    id: "npi-1234567894",
    label: "Dr. Lee, DO",
    type: "doctor",
    position: [-4, 0, 2],
    size: [2.5, 3, 2],
    color: "#0ea5e9",
    description: "Orthopedic Surgery. Specialist referrals from Dr. Patel.",
    npi: 1234567894,
    tagline: "Orthopedics",
  },
  {
    id: "npi-1234567895",
    label: "Dr. Chen, MD",
    type: "doctor",
    position: [4, 0, 6],
    size: [2.5, 3, 2],
    color: "#8b5cf6",
    description: "Endocrinology. Manages Ms. Jones's diabetes with Dr. Patel.",
    npi: 1234567895,
    tagline: "Endocrinology / Diabetes",
  },
];

// ---------------------------------------------------------------------------
// 10 SCENARIOS — Ms. Jones stays home, messages fly between buildings
// ---------------------------------------------------------------------------

const H = "npi-1234567892"; // hospital
const PCP = "npi-1234567890"; // dr patel
const RX = "npi-1234567891"; // pharmacy
const LAB = "npi-1234567893"; // radiology
const ORTHO = "npi-1234567894"; // dr lee
const ENDO = "npi-1234567895"; // dr chen
const INS = "insurance";
const PT = "patient";

export const STORIES: Story[] = [
  // 1. PRESCRIPTION REFILL — patient calls from home
  {
    id: "refill",
    title: "Prescription Refill",
    patient: "Gloria Jones, 58",
    summary: "Ms. Jones's metformin is running low. She calls City Pharmacy from home. Watch the messages fly between pharmacy, doctor, and insurance — all through Coordra.",
    steps: [
      { id: "1a", from: PT, to: RX, label: "Refill request", narration: "Ms. Jones calls City Pharmacy from home. 'I need my metformin refilled.' The pharmacist checks — prescription expired, no refills left.", color: "#06b6d4", duration: 3, method: "call" },
      { id: "1b", from: RX, to: PCP, label: "Refill auth needed", narration: "City Pharmacy sends a Coordra message to Dr. Patel's office: 'Patient Jones needs metformin renewal. Last filled 90 days ago. 0 refills remaining.'", color: "#22c55e", duration: 3, method: "message" },
      { id: "1c", from: PCP, to: RX, label: "New Rx sent", narration: "Dr. Patel reviews the chart — A1C is 7.2, well-controlled. Sends e-prescription via Coordra: metformin 1000mg BID, 90-day supply, 3 refills.", color: "#3b82f6", duration: 3, method: "erx" },
      { id: "1d", from: RX, to: INS, label: "Claim submitted", narration: "City Pharmacy submits the claim to BlueCross through Coordra. Metformin is Tier 1 generic.", color: "#f59e0b", duration: 2.5, method: "claim" },
      { id: "1e", from: INS, to: RX, label: "Approved — $5", narration: "BlueCross approves instantly. $5 copay for 90-day supply. Confirmation sent back through Coordra.", color: "#22c55e", duration: 2, method: "claim" },
      { id: "1f", from: RX, to: PT, label: "Rx ready", narration: "City Pharmacy texts Ms. Jones via Coordra: 'Your metformin is ready. $5.00 copay. Pickup anytime.' She goes after lunch.", color: "#06b6d4", duration: 3, method: "message" },
    ],
  },

  // 2. BROKEN BONE — 911, ER, the whole chain
  {
    id: "broken-arm",
    title: "Broken Wrist — ER Visit",
    patient: "Gloria Jones, 58",
    summary: "Ms. Jones slips on ice and fractures her wrist. She has to physically go to the ER — but after that, the entire care coordination happens through Coordra messages.",
    steps: [
      { id: "2a", from: PT, to: H, label: "911 / ER arrival", narration: "Ms. Jones falls on her icy porch. Neighbor calls 911. Ambulance takes her to Springfield General ER. This is the one time she physically goes somewhere.", color: "#ef4444", duration: 4, method: "walk" },
      { id: "2b", from: H, to: LAB, label: "X-ray order", narration: "ER doctor orders X-ray stat. The order goes through Coordra to Midwest Radiology — no phone tag, no lost paperwork.", color: "#a855f7", duration: 3, method: "message" },
      { id: "2c", from: LAB, to: H, label: "Fracture confirmed", narration: "Radiology sends results back through Coordra: 'Distal radius fracture, non-displaced.' Images attached. ER doc sees it in 20 minutes.", color: "#a855f7", duration: 3, method: "message" },
      { id: "2d", from: H, to: RX, label: "Discharge Rx", narration: "ER sends e-prescriptions to City Pharmacy via Coordra: ibuprofen 800mg + Norco 5/325 (7-day supply).", color: "#22c55e", duration: 3, method: "erx" },
      { id: "2e", from: RX, to: INS, label: "Rx claims", narration: "City Pharmacy runs both through BlueCross. Ibuprofen: approved. Norco: DENIED — prior authorization required for opioids.", color: "#f59e0b", duration: 3, method: "claim" },
      { id: "2f", from: INS, to: RX, label: "PA required", narration: "BlueCross sends denial back through Coordra. Reason: 'Opioid PA policy. Submit clinical justification.'", color: "#ef4444", duration: 2, method: "claim" },
      { id: "2g", from: RX, to: PCP, label: "PA needed", narration: "Pharmacist messages Dr. Patel via Coordra: 'Norco PA denied. Can you submit? Patient has confirmed fracture, diabetic, NSAIDs risky alone.'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "2h", from: PCP, to: INS, label: "PA submission", narration: "Dr. Patel submits PA through Coordra with clinical notes: fracture confirmed by imaging, patient diabetic (NSAID risk), short-term opioid justified.", color: "#f59e0b", duration: 3, method: "message" },
      { id: "2i", from: INS, to: PCP, label: "PA approved", narration: "4 hours later, BlueCross approves. Norco authorized for 7 days. Approval flows through Coordra to Dr. Patel AND City Pharmacy simultaneously.", color: "#22c55e", duration: 2, method: "message" },
      { id: "2j", from: INS, to: RX, label: "PA approved", narration: "City Pharmacy gets the green light. Pharmacist fills both prescriptions.", color: "#22c55e", duration: 2, method: "message" },
      { id: "2k", from: RX, to: PT, label: "Rx ready", narration: "Coordra text to Ms. Jones: 'Both prescriptions ready. Take ibuprofen WITH food (important with your diabetes). Norco only for severe pain.'", color: "#06b6d4", duration: 3, method: "message" },
      { id: "2l", from: H, to: PCP, label: "Discharge summary", narration: "Springfield General sends discharge summary to Dr. Patel via Coordra: fracture details, splint applied, Rx sent, follow-up in 1 week.", color: "#3b82f6", duration: 3, method: "message" },
      { id: "2m", from: PCP, to: PT, label: "Follow-up scheduled", narration: "Dr. Patel's office messages Ms. Jones via Coordra: 'We got your ER notes. Appointment Tuesday 10am to check your splint. Feel better!'", color: "#06b6d4", duration: 3, method: "message" },
    ],
  },

  // 3. SPECIALIST REFERRAL
  {
    id: "referral",
    title: "Specialist Referral",
    patient: "Gloria Jones, 58",
    summary: "Dr. Patel refers Ms. Jones to Dr. Lee (orthopedics) for her wrist follow-up. All coordination happens through Coordra — no phone tag.",
    steps: [
      { id: "3a", from: PCP, to: ORTHO, label: "Referral", narration: "Dr. Patel sends referral through Coordra to Dr. Lee: 'Distal radius fracture 2 weeks ago. Splint in place. Please evaluate for casting vs. surgery.'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "3b", from: PCP, to: INS, label: "Referral auth", narration: "Dr. Patel submits referral authorization to BlueCross through Coordra. Ortho specialist visit requires pre-auth on her plan.", color: "#f59e0b", duration: 3, method: "claim" },
      { id: "3c", from: INS, to: PCP, label: "Auth approved", narration: "BlueCross approves the referral. 3 visits authorized for orthopedic evaluation.", color: "#22c55e", duration: 2, method: "claim" },
      { id: "3d", from: ORTHO, to: PT, label: "Appointment", narration: "Dr. Lee's office messages Ms. Jones via Coordra: 'Referral received from Dr. Patel. Can you come in Thursday at 2pm?'", color: "#0ea5e9", duration: 3, method: "message" },
      { id: "3e", from: PT, to: ORTHO, label: "Confirmed", narration: "Ms. Jones confirms through Coordra: 'Thursday works. Thank you.'", color: "#06b6d4", duration: 2, method: "message" },
      { id: "3f", from: ORTHO, to: PCP, label: "Consult note", narration: "After the visit, Dr. Lee sends consult note via Coordra: 'Healing well. Cast applied. No surgery needed. Follow-up in 4 weeks.'", color: "#3b82f6", duration: 3, method: "message" },
    ],
  },

  // 4. LAB RESULTS
  {
    id: "lab-results",
    title: "Lab Results — A1C Check",
    patient: "Gloria Jones, 58",
    summary: "Dr. Patel orders routine blood work for Ms. Jones's diabetes. She goes to the lab, but the results flow through Coordra to everyone who needs them.",
    steps: [
      { id: "4a", from: PCP, to: LAB, label: "Lab order", narration: "Dr. Patel orders A1C and metabolic panel through Coordra. The order goes electronically to Midwest Radiology/Lab.", color: "#a855f7", duration: 3, method: "message" },
      { id: "4b", from: PCP, to: PT, label: "Lab scheduled", narration: "Coordra message to Ms. Jones: 'Lab work ordered. Go to Midwest Radiology anytime this week. Fasting required for metabolic panel.'", color: "#06b6d4", duration: 3, method: "message" },
      { id: "4c", from: PT, to: LAB, label: "Blood draw", narration: "Ms. Jones goes to the lab Wednesday morning. Fasting blood draw takes 10 minutes.", color: "#a855f7", duration: 3, method: "walk" },
      { id: "4d", from: LAB, to: PCP, label: "Results ready", narration: "Lab results sent to Dr. Patel via Coordra: A1C 7.8 (up from 7.2). Metabolic panel normal. Flagged as 'needs review'.", color: "#a855f7", duration: 3, method: "message" },
      { id: "4e", from: PCP, to: ENDO, label: "Endocrine consult", narration: "Dr. Patel messages Dr. Chen (endocrinology) via Coordra: 'A1C trending up. Currently on metformin 1000 BID. Thoughts on adding a second agent?'", color: "#8b5cf6", duration: 3, method: "message" },
      { id: "4f", from: ENDO, to: PCP, label: "Recommendation", narration: "Dr. Chen responds: 'Agree. Recommend adding Jardiance 10mg daily. Good for her cardiac risk profile too. Happy to see her if you want a full consult.'", color: "#8b5cf6", duration: 3, method: "message" },
      { id: "4g", from: PCP, to: PT, label: "Results + plan", narration: "Dr. Patel messages Ms. Jones: 'Your A1C went up a bit. Adding a new medication — Jardiance. I'm sending the prescription to City Pharmacy.'", color: "#06b6d4", duration: 3, method: "message" },
      { id: "4h", from: PCP, to: RX, label: "New Rx", narration: "Dr. Patel sends e-prescription for Jardiance 10mg to City Pharmacy via Coordra.", color: "#22c55e", duration: 2, method: "erx" },
    ],
  },

  // 5. PRIOR AUTH BATTLE
  {
    id: "prior-auth",
    title: "Prior Auth Battle",
    patient: "Gloria Jones, 58",
    summary: "Dr. Patel prescribes Jardiance but insurance denies it. Watch the back-and-forth battle through Coordra — this is where most healthcare frustration lives.",
    steps: [
      { id: "5a", from: RX, to: INS, label: "Claim: Jardiance", narration: "City Pharmacy submits Jardiance claim to BlueCross. Brand-name, Tier 3. $287/month without insurance.", color: "#f59e0b", duration: 3, method: "claim" },
      { id: "5b", from: INS, to: RX, label: "DENIED", narration: "BlueCross denies: 'Step therapy required. Patient must try glipizide (Tier 1) first before Jardiance.' This is the #1 frustration in healthcare.", color: "#ef4444", duration: 3, method: "claim" },
      { id: "5c", from: RX, to: PCP, label: "Denial notice", narration: "Pharmacist alerts Dr. Patel via Coordra: 'Jardiance denied. Step therapy — they want glipizide first. Do you want to appeal or switch?'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "5d", from: PCP, to: INS, label: "Appeal", narration: "Dr. Patel appeals through Coordra: 'Glipizide contraindicated — patient has cardiac risk factors. Jardiance has proven cardiovascular benefit. Clinical necessity.'", color: "#f59e0b", duration: 4, method: "message" },
      { id: "5e", from: INS, to: PCP, label: "More info needed", narration: "BlueCross requests more documentation: 'Submit last 2 A1C results, cardiac history, and reason glipizide is contraindicated.'", color: "#f59e0b", duration: 3, method: "message" },
      { id: "5f", from: PCP, to: INS, label: "Documentation", narration: "Dr. Patel submits via Coordra: A1C history (7.2 → 7.8), hypertension diagnosis, family cardiac history. 'Jardiance reduces CV events by 14%.'", color: "#f59e0b", duration: 3, method: "message" },
      { id: "5g", from: INS, to: PCP, label: "APPROVED", narration: "After 3 days, BlueCross approves Jardiance. $45/month copay with PA. Approval sent through Coordra to Dr. Patel and City Pharmacy.", color: "#22c55e", duration: 2, method: "claim" },
      { id: "5h", from: INS, to: RX, label: "PA confirmed", narration: "City Pharmacy receives the PA approval. Pharmacist fills the Jardiance.", color: "#22c55e", duration: 2, method: "claim" },
      { id: "5i", from: RX, to: PT, label: "Rx ready — $45", narration: "Coordra text to Ms. Jones: 'Jardiance ready. $45 copay. Take once daily with or without food. Come by anytime.'", color: "#06b6d4", duration: 3, method: "message" },
    ],
  },

  // 6. MEDICATION INTERACTION ALERT
  {
    id: "interaction",
    title: "Drug Interaction Alert",
    patient: "Gloria Jones, 58",
    summary: "City Pharmacy catches a dangerous drug interaction when filling a new prescription. Coordra enables instant communication to fix it before harm is done.",
    steps: [
      { id: "6a", from: ORTHO, to: RX, label: "New Rx: Meloxicam", narration: "Dr. Lee prescribes meloxicam (NSAID) for Ms. Jones's wrist pain. E-prescription sent to City Pharmacy via Coordra.", color: "#0ea5e9", duration: 3, method: "erx" },
      { id: "6b", from: RX, to: ORTHO, label: "INTERACTION ALERT", narration: "Pharmacist flags via Coordra: 'ALERT: Meloxicam + metformin + her kidney function = risk. Also on ibuprofen from ER. Double NSAID. Please review.'", color: "#ef4444", duration: 3, method: "alert" },
      { id: "6c", from: RX, to: PCP, label: "FYI — interaction", narration: "Pharmacist also alerts Dr. Patel (PCP) via Coordra: 'Dr. Lee prescribed meloxicam. Patient already on ibuprofen 800 + metformin. Flagging interaction.'", color: "#3b82f6", duration: 3, method: "alert" },
      { id: "6d", from: ORTHO, to: RX, label: "Changed to Tylenol", narration: "Dr. Lee responds via Coordra: 'Good catch. Cancel meloxicam. Switching to acetaminophen 500mg. Sending new e-Rx now.'", color: "#22c55e", duration: 3, method: "erx" },
      { id: "6e", from: RX, to: PT, label: "Updated Rx ready", narration: "Coordra message to Ms. Jones: 'Your pain medication was changed to Tylenol (safer with your other meds). Ready for pickup.'", color: "#06b6d4", duration: 3, method: "message" },
    ],
  },

  // 7. INSURANCE FORMULARY CHANGE
  {
    id: "formulary",
    title: "Formulary Change — Surprise!",
    patient: "Gloria Jones, 58",
    summary: "BlueCross changes their formulary mid-year. Ms. Jones's blood pressure medication is no longer covered. The pharmacy catches it at refill time.",
    steps: [
      { id: "7a", from: PT, to: RX, label: "Refill request", narration: "Ms. Jones requests her lisinopril refill through Coordra. She's been on it for 5 years.", color: "#06b6d4", duration: 3, method: "message" },
      { id: "7b", from: RX, to: INS, label: "Claim", narration: "City Pharmacy submits the refill claim to BlueCross.", color: "#f59e0b", duration: 2, method: "claim" },
      { id: "7c", from: INS, to: RX, label: "Not covered", narration: "BlueCross rejects: 'Lisinopril removed from formulary as of April 1. Preferred alternative: losartan.' Ms. Jones had no warning.", color: "#ef4444", duration: 3, method: "claim" },
      { id: "7d", from: RX, to: PCP, label: "Formulary issue", narration: "Pharmacist messages Dr. Patel: 'Lisinopril no longer covered by BlueCross. They suggest losartan. Clinically equivalent — OK to switch?'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "7e", from: PCP, to: RX, label: "Switch approved", narration: "Dr. Patel responds: 'Losartan is fine. Sending new Rx: losartan 50mg daily. Same dosing schedule.'", color: "#22c55e", duration: 3, method: "erx" },
      { id: "7f", from: RX, to: PT, label: "New med ready", narration: "Coordra message: 'Your BP med changed from lisinopril to losartan (insurance change). Same effect, $5 copay. Ready for pickup.'", color: "#06b6d4", duration: 3, method: "message" },
    ],
  },

  // 8. DIABETES CHECK-IN (routine)
  {
    id: "diabetes-checkin",
    title: "Diabetes Management Check-In",
    patient: "Gloria Jones, 58",
    summary: "Dr. Chen (endocrinology) does a quarterly diabetes review with Dr. Patel, all through Coordra. No office visit needed this time.",
    steps: [
      { id: "8a", from: ENDO, to: PCP, label: "Quarterly review", narration: "Dr. Chen sends quarterly check via Coordra: 'Reviewing Gloria Jones's diabetes management. Last A1C 7.8. On metformin + Jardiance. How is she doing?'", color: "#8b5cf6", duration: 3, method: "message" },
      { id: "8b", from: PCP, to: ENDO, label: "Update", narration: "Dr. Patel responds: 'She reports better energy since Jardiance. No hypoglycemia episodes. Weight stable. Wants to avoid insulin if possible.'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "8c", from: ENDO, to: PCP, label: "Plan", narration: "Dr. Chen: 'Good. Let's recheck A1C in 6 weeks. If still above 7.5, consider adding Ozempic. I'll see her in-person next quarter.'", color: "#8b5cf6", duration: 3, method: "message" },
      { id: "8d", from: PCP, to: PT, label: "Update from docs", narration: "Coordra message to Ms. Jones: 'Dr. Patel and Dr. Chen reviewed your diabetes. Doing well! Lab work needed in 6 weeks. We'll send a reminder.'", color: "#06b6d4", duration: 3, method: "message" },
    ],
  },

  // 9. DISCHARGE FOLLOW-UP
  {
    id: "discharge",
    title: "Hospital Discharge Coordination",
    patient: "Gloria Jones, 58",
    summary: "Ms. Jones is discharged from Springfield General after her ER visit. Watch how Coordra ensures nothing falls through the cracks.",
    steps: [
      { id: "9a", from: H, to: PCP, label: "Discharge summary", narration: "Springfield General sends discharge summary to Dr. Patel via Coordra: diagnosis, procedures, new medications, follow-up instructions.", color: "#ef4444", duration: 3, method: "message" },
      { id: "9b", from: H, to: RX, label: "Discharge meds", narration: "Hospital sends medication reconciliation to City Pharmacy: 'New: ibuprofen 800mg, Norco 5/325. Continue: metformin, lisinopril, Jardiance.'", color: "#22c55e", duration: 3, method: "message" },
      { id: "9c", from: H, to: INS, label: "ER claim", narration: "Hospital submits ER visit claim to BlueCross: CPT codes for ER visit (99284), X-ray (73100), splint application (29125).", color: "#f59e0b", duration: 3, method: "claim" },
      { id: "9d", from: PCP, to: PT, label: "We got your notes", narration: "Dr. Patel's office via Coordra: 'We received your ER notes. You're scheduled for follow-up Tuesday 10am. Bring your splint.'", color: "#06b6d4", duration: 3, method: "message" },
      { id: "9e", from: RX, to: PT, label: "Med check", narration: "Pharmacist via Coordra: 'I see your new meds from the ER. Quick question — are you still taking your ibuprofen, or did they tell you to stop the OTC version?'", color: "#22c55e", duration: 3, method: "message" },
      { id: "9f", from: PT, to: RX, label: "Reply", narration: "Ms. Jones replies via Coordra: 'They said stop the OTC ibuprofen and just take the prescription strength one.'", color: "#06b6d4", duration: 2, method: "message" },
      { id: "9g", from: RX, to: PCP, label: "Med reconciled", narration: "Pharmacist updates Dr. Patel: 'Confirmed with patient — OTC ibuprofen discontinued. Only taking Rx strength. Medication list reconciled.'", color: "#3b82f6", duration: 3, method: "message" },
    ],
  },

  // 10. URGENT AFTER-HOURS
  {
    id: "after-hours",
    title: "After-Hours Urgent Message",
    patient: "Gloria Jones, 58",
    summary: "Ms. Jones has concerning symptoms at 9pm. Dr. Patel's office is closed. Coordra's after-hours routing ensures the right person responds.",
    steps: [
      { id: "10a", from: PT, to: PCP, label: "Urgent message", narration: "Ms. Jones sends via Coordra at 9:14pm: 'My wrist is very swollen and hot. More than yesterday. Should I go to the ER?' Message flagged as URGENT.", color: "#ef4444", duration: 3, method: "alert" },
      { id: "10b", from: PCP, to: PT, label: "Auto-response", narration: "Coordra auto-routes to on-call: 'Dr. Patel's office is closed. Your URGENT message has been forwarded to the on-call provider. Expected response: 15 minutes.'", color: "#3b82f6", duration: 2, method: "message" },
      { id: "10c", from: PCP, to: PT, label: "On-call response", narration: "On-call NP responds via Coordra: 'Hot and swollen could be infection. Can you send a photo through Coordra? If you see red streaks, go to ER now.'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "10d", from: PT, to: PCP, label: "Photo sent", narration: "Ms. Jones sends a photo through Coordra. Moderate swelling, no red streaks, slight warmth.", color: "#06b6d4", duration: 2, method: "message" },
      { id: "10e", from: PCP, to: PT, label: "Instructions", narration: "NP responds: 'Doesn't look infected. Elevate, ice 20 min on/off, take your ibuprofen. If red streaks appear or fever over 101, go to ER. We'll see you tomorrow.'", color: "#3b82f6", duration: 3, method: "message" },
      { id: "10f", from: PCP, to: PCP, label: "Note to Dr. Patel", narration: "NP leaves internal Coordra note for Dr. Patel: 'After-hours contact from Jones re: wrist swelling. Photos attached. Advised conservative tx. Please follow up AM.'", color: "#3b82f6", duration: 3, method: "message" },
    ],
  },
];
