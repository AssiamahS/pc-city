// Shared in-memory state for the entire PC City system
// This is the single source of truth that the MCP server reads

export interface Patient {
  id: string;
  name: string;
  dob: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  primaryCare: string;
  insurance: string;
  status: "active" | "admitted" | "discharged" | "emergency";
  buildingId: string;
}

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
  patientId?: string;
}

export interface JourneyStep {
  id: string;
  patientId: string;
  fromBuilding: string;
  toBuilding: string;
  action: string;
  details: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  timestamp: string;
  resolvedAt?: string;
}

export interface Journey {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  startedAt: string;
  status: "active" | "completed" | "blocked";
  steps: JourneyStep[];
}

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "critical";
  source: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Role {
  id: string;
  title: string;
  assignee: string;
  credential: string;
  buildingId: string;
  onDuty: boolean;
}

// ─── SEED DATA ─────────────────────────────────────────────────────────

export const patients: Patient[] = [
  {
    id: "p1",
    name: "Mrs. Eleanor Jones",
    dob: "1958-03-14",
    conditions: ["Type 2 Diabetes", "Hypertension", "Chronic Kidney Disease Stage 3"],
    medications: ["Metformin 1000mg BID", "Lisinopril 20mg daily", "Atorvastatin 40mg daily"],
    allergies: ["Penicillin", "Sulfa drugs"],
    primaryCare: "Dr. Alexandria Brooks",
    insurance: "Medicare Advantage - Aetna",
    status: "active",
    buildingId: "patient",
  },
  {
    id: "p2",
    name: "Ryan Mitchell",
    dob: "1985-07-22",
    conditions: ["Pericardial Effusion", "Suspected Viral Infection"],
    medications: ["Ibuprofen 600mg TID", "Colchicine 0.5mg BID"],
    allergies: [],
    primaryCare: "Dr. Will Rosenblom",
    insurance: "Blue Cross PPO",
    status: "emergency",
    buildingId: "hospital",
  },
  {
    id: "p3",
    name: "Sandra Kim",
    dob: "1972-11-03",
    conditions: ["Breast Cancer Stage IIA", "Anxiety"],
    medications: ["Tamoxifen 20mg daily", "Sertraline 50mg daily"],
    allergies: ["Latex"],
    primaryCare: "Dr. T.J. Whitmore",
    insurance: "United Healthcare",
    status: "active",
    buildingId: "doctor",
  },
];

export const roles: Role[] = [
  { id: "r1", title: "Emergency Department MD", assignee: "Alexandria Brooks, MD", credential: "MD", buildingId: "hospital", onDuty: true },
  { id: "r2", title: "Hospitalist", assignee: "Alexandria Brooks, MD", credential: "MD", buildingId: "hospital", onDuty: false },
  { id: "r3", title: "House Supervisor", assignee: "Will Rosenblom, MD", credential: "MD", buildingId: "hospital", onDuty: false },
  { id: "r4", title: "On-Call Cardiologist", assignee: "Will Rosenblom, MD", credential: "MD", buildingId: "doctor", onDuty: false },
  { id: "r5", title: "On-Call Pediatrician", assignee: "T.J. Whitmore, MD", credential: "MD", buildingId: "doctor", onDuty: false },
  { id: "r6", title: "On-Call Radiologist", assignee: "Alice Stevens, MD", credential: "MD", buildingId: "lab", onDuty: false },
  { id: "r7", title: "Pharmacist", assignee: "Deborah Wilson, CPhT", credential: "CPhT", buildingId: "pharmacy", onDuty: false },
];

// Mrs. Jones' complete journey: routine visit -> abnormal labs -> pharmacy prior auth battle
const now = new Date();
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();

export const journeys: Journey[] = [
  {
    id: "j1",
    patientId: "p1",
    patientName: "Mrs. Eleanor Jones",
    reason: "Routine diabetes checkup — A1C recheck + kidney function labs",
    startedAt: h(72),
    status: "active",
    steps: [
      {
        id: "s1", patientId: "p1", fromBuilding: "patient", toBuilding: "doctor",
        action: "Scheduled appointment",
        details: "Mrs. Jones called to schedule 3-month diabetes follow-up with Dr. Brooks. A1C was 8.1 last visit, goal is <7.0.",
        status: "completed", timestamp: h(72), resolvedAt: h(71),
      },
      {
        id: "s2", patientId: "p1", fromBuilding: "doctor", toBuilding: "lab",
        action: "Lab order placed",
        details: "Dr. Brooks ordered: HbA1C, Comprehensive Metabolic Panel, Lipid Panel, Urine Albumin-to-Creatinine Ratio. Fasting required.",
        status: "completed", timestamp: h(48), resolvedAt: h(47),
      },
      {
        id: "s3", patientId: "p1", fromBuilding: "patient", toBuilding: "lab",
        action: "Patient lab visit",
        details: "Mrs. Jones arrived fasting at 7:30 AM. Blood draw completed. Urine sample collected. Results expected in 24-48 hours.",
        status: "completed", timestamp: h(36), resolvedAt: h(35.5),
      },
      {
        id: "s4", patientId: "p1", fromBuilding: "lab", toBuilding: "doctor",
        action: "Lab results returned",
        details: "CRITICAL: A1C now 9.2 (up from 8.1). eGFR dropped to 42 (was 55). Creatinine 1.6. Albumin-to-creatinine ratio elevated at 180 mg/g. LDL 142.",
        status: "completed", timestamp: h(24), resolvedAt: h(23.5),
      },
      {
        id: "s5", patientId: "p1", fromBuilding: "doctor", toBuilding: "patient",
        action: "Results review call",
        details: "Dr. Brooks called Mrs. Jones. Explained worsening kidney function and uncontrolled diabetes. Recommending adding Jardiance (empagliflozin) 10mg — kidney protective + glucose lowering. Must stop Metformin if eGFR drops below 30.",
        status: "completed", timestamp: h(20), resolvedAt: h(19.5),
      },
      {
        id: "s6", patientId: "p1", fromBuilding: "doctor", toBuilding: "pharmacy",
        action: "New prescription sent",
        details: "E-prescribed Jardiance (empagliflozin) 10mg daily #90 to pharmacy. Note: patient has sulfa allergy — Jardiance is safe (not a sulfonamide antibiotic).",
        status: "completed", timestamp: h(19), resolvedAt: h(18.5),
      },
      {
        id: "s7", patientId: "p1", fromBuilding: "pharmacy", toBuilding: "insurance",
        action: "Insurance claim submitted",
        details: "Deborah Wilson processed Rx. Jardiance requires prior authorization from Aetna Medicare Advantage. Retail price without insurance: $580/month.",
        status: "completed", timestamp: h(18), resolvedAt: h(17),
      },
      {
        id: "s8", patientId: "p1", fromBuilding: "insurance", toBuilding: "pharmacy",
        action: "Prior auth DENIED — step therapy required",
        details: "Aetna denied: 'Patient must first try and fail glipizide (sulfonylurea) before Jardiance is covered.' Dr. Brooks notes sulfa allergy makes sulfonamide-related drugs risky.",
        status: "completed", timestamp: h(12), resolvedAt: h(11),
      },
      {
        id: "s9", patientId: "p1", fromBuilding: "pharmacy", toBuilding: "doctor",
        action: "PA denial forwarded to prescriber",
        details: "Deborah called Dr. Brooks' office. Faxed denial letter. Insurance wants glipizide first but patient has sulfa allergy. Peer-to-peer review may be needed.",
        status: "completed", timestamp: h(10), resolvedAt: h(9.5),
      },
      {
        id: "s10", patientId: "p1", fromBuilding: "doctor", toBuilding: "insurance",
        action: "Appeal with clinical justification",
        details: "Dr. Brooks submitted appeal: 'Patient has documented sulfa allergy. Glipizide is a sulfonamide derivative — contraindicated. Jardiance (SGLT2i) has proven renal benefit in CKD Stage 3. See CREDENCE trial data. eGFR 42 and declining. Urgent.'",
        status: "in_progress", timestamp: h(6),
      },
      {
        id: "s11", patientId: "p1", fromBuilding: "insurance", toBuilding: "doctor",
        action: "Peer-to-peer review scheduled",
        details: "Aetna medical director wants to speak with Dr. Brooks. Scheduled for tomorrow 2:00 PM.",
        status: "pending", timestamp: h(4),
      },
      {
        id: "s12", patientId: "p1", fromBuilding: "pharmacy", toBuilding: "patient",
        action: "Patient notified of delay",
        details: "Deborah called Mrs. Jones to explain insurance is reviewing. Medication not yet available. Mrs. Jones frustrated — 'I just want to protect my kidneys.'",
        status: "pending", timestamp: h(3),
      },
    ],
  },
];

export const messages: CityMessage[] = [
  // Mrs. Jones journey messages
  { id: "m1", from: "Dr. Alexandria Brooks", to: "Quest Diagnostics Lab", fromRole: "Primary Care", toRole: "Lab", body: "Order: HbA1C, CMP, Lipid Panel, UACR for Eleanor Jones DOB 3/14/58. Fasting required. Diabetes + CKD monitoring.", priority: "normal", timestamp: h(48), buildingId: "doctor", patientId: "p1" },
  { id: "m2", from: "Quest Diagnostics Lab", to: "Dr. Alexandria Brooks", fromRole: "Lab", toRole: "Primary Care", body: "CRITICAL RESULTS — Eleanor Jones: A1C 9.2 (H), eGFR 42 (L), Creatinine 1.6 (H), UACR 180 mg/g (H), LDL 142 (H). Please acknowledge.", priority: "urgent", timestamp: h(24), buildingId: "lab", patientId: "p1" },
  { id: "m3", from: "Dr. Alexandria Brooks", to: "Mrs. Eleanor Jones", fromRole: "Primary Care", toRole: "Patient", body: "Eleanor, your lab results show your diabetes and kidney numbers have worsened. I'd like to start you on Jardiance — it helps both blood sugar and kidney protection. I'm sending the prescription to your pharmacy now.", priority: "priority", timestamp: h(20), buildingId: "doctor", patientId: "p1" },
  { id: "m4", from: "Dr. Alexandria Brooks", to: "Deborah Wilson, CPhT", fromRole: "Primary Care", toRole: "Pharmacist", body: "E-Rx sent: Jardiance 10mg daily #90, Eleanor Jones. Note sulfa allergy — Jardiance is NOT a sulfonamide antibiotic, safe to dispense.", priority: "normal", timestamp: h(19), buildingId: "doctor", patientId: "p1" },
  { id: "m5", from: "Deborah Wilson, CPhT", to: "Aetna Medicare Advantage", fromRole: "Pharmacist", toRole: "Insurance", body: "Prior Auth Request: Jardiance 10mg for Eleanor Jones. Dx: E11.65 (T2DM w/ hyperglycemia), N18.3 (CKD Stage 3). A1C 9.2, eGFR 42.", priority: "normal", timestamp: h(18), buildingId: "pharmacy", patientId: "p1" },
  { id: "m6", from: "Aetna Medicare Advantage", to: "Deborah Wilson, CPhT", fromRole: "Insurance", toRole: "Pharmacist", body: "DENIED: Prior Authorization required. Step therapy protocol: patient must trial glipizide (preferred sulfonylurea) before SGLT2 inhibitor coverage. Reference: Aetna formulary tier exception policy §4.2.", priority: "urgent", timestamp: h(12), buildingId: "insurance", patientId: "p1" },
  { id: "m7", from: "Deborah Wilson, CPhT", to: "Dr. Alexandria Brooks", fromRole: "Pharmacist", toRole: "Primary Care", body: "Dr. Brooks — Jardiance PA denied by Aetna. They want glipizide trial first. But Mrs. Jones has sulfa allergy on file. Faxing denial letter now. You may need a peer-to-peer.", priority: "priority", timestamp: h(10), buildingId: "pharmacy", patientId: "p1" },
  { id: "m8", from: "Dr. Alexandria Brooks", to: "Aetna Medicare Advantage", fromRole: "Primary Care", toRole: "Insurance Medical Director", body: "APPEAL: Eleanor Jones has documented sulfa allergy — glipizide (a sulfonamide) is contraindicated. Jardiance has Class I evidence for renal protection in CKD (CREDENCE, DAPA-CKD trials). eGFR 42 and declining. Delay risks progression to dialysis. Requesting expedited review.", priority: "urgent", timestamp: h(6), buildingId: "doctor", patientId: "p1" },
  { id: "m9", from: "Deborah Wilson, CPhT", to: "Mrs. Eleanor Jones", fromRole: "Pharmacist", toRole: "Patient", body: "Hi Mrs. Jones, this is Deborah at the pharmacy. Your doctor prescribed Jardiance but your insurance needs to approve it first. Dr. Brooks is working on the appeal. We'll call you as soon as it's ready. I'm sorry for the delay.", priority: "normal", timestamp: h(3), buildingId: "pharmacy", patientId: "p1" },

  // Ryan Mitchell ER messages
  { id: "m10", from: "Will Rosenblom, MD", to: "Alexandria Brooks, MD", fromRole: "On-Call Cardiologist", toRole: "Emergency Department MD", body: "Patient Ryan Mitchell's echo confirms pericardial effusion. Viral panel pending. Must be prepped for pericardiocentesis if tamponade physiology develops. Currently stable.", priority: "urgent", timestamp: h(1), buildingId: "hospital", patientId: "p2" },
  { id: "m11", from: "Alexandria Brooks, MD", to: "Adrian, Floor Nurse", fromRole: "Emergency Department MD", toRole: "Floor Nurse", body: "Adrian — Mitchell in room 6343 needs continuous cardiac monitoring. Vitals q15 min. Call me immediately if systolic drops below 90 or JVP rises.", priority: "priority", timestamp: h(0.5), buildingId: "hospital", patientId: "p2" },
];

export const logs: LogEntry[] = [
  { id: "log1", level: "info", source: "system", message: "PC City server started", timestamp: h(73), metadata: { version: "1.0.0" } },
  { id: "log2", level: "info", source: "doctor", message: "Dr. Brooks scheduled follow-up for Mrs. Jones (p1)", timestamp: h(72) },
  { id: "log3", level: "info", source: "lab", message: "Lab order received for patient p1: HbA1C, CMP, Lipid, UACR", timestamp: h(48) },
  { id: "log4", level: "critical", source: "lab", message: "CRITICAL LAB VALUES for p1: A1C 9.2, eGFR 42, UACR 180", timestamp: h(24), metadata: { patientId: "p1", values: { a1c: 9.2, egfr: 42, uacr: 180 } } },
  { id: "log5", level: "info", source: "doctor", message: "Dr. Brooks reviewed critical labs, called patient", timestamp: h(20) },
  { id: "log6", level: "info", source: "pharmacy", message: "Rx received: Jardiance 10mg for p1", timestamp: h(19) },
  { id: "log7", level: "warn", source: "insurance", message: "Prior auth DENIED for Jardiance (p1) — step therapy required", timestamp: h(12), metadata: { patientId: "p1", reason: "step_therapy", requiredDrug: "glipizide" } },
  { id: "log8", level: "error", source: "pharmacy", message: "Insurance conflict: required drug (glipizide) contraindicated — patient has sulfa allergy", timestamp: h(10), metadata: { patientId: "p1", allergy: "Sulfa drugs", conflictDrug: "glipizide" } },
  { id: "log9", level: "warn", source: "doctor", message: "Appeal submitted to Aetna for Jardiance override — peer-to-peer pending", timestamp: h(6) },
  { id: "log10", level: "info", source: "pharmacy", message: "Patient p1 notified of medication delay", timestamp: h(3) },
  { id: "log11", level: "critical", source: "hospital", message: "ER: Pericardial effusion confirmed for p2 (Ryan Mitchell). Pericardiocentesis prep ordered.", timestamp: h(1), metadata: { patientId: "p2" } },
  { id: "log12", level: "info", source: "hospital", message: "Continuous cardiac monitoring initiated for p2, room 6343", timestamp: h(0.5) },
];
