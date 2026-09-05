import type { Jurisdiction } from "@/lib/types";

// DRAFT DATA — attorney review required before production use.
// Facts below are sourced from publicly available statute summaries
// and compact member rosters as of 2026-04. Verify each field with counsel
// before relying on it in a live patient flow.

export const JURISDICTIONS: Record<string, Jurisdiction> = {
  NJ: {
    code: "NJ",
    name: "New Jersey",
    country: "US",
    federalFloor: "HIPAA",
    breach: {
      deadlineDays: 30,
      method: ["mail", "email", "substitute"],
      privateRightOfAction: true,
    },
    consent: {
      model: "opt-in",
      minorAge: 14,
      specialCategories: ["hiv", "mental_health", "substance_use", "reproductive", "genetic"],
    },
    licensure: {
      compactsJoined: ["NLC", "PTC", "ASLP-IC"],
      telehealthControlledSubstances: true,
    },
    records: {
      responseDays: 30,
      feeCapUsd: 1.0,
    },
    notes: "NJ has its own Identity Theft Prevention Act for breach notice. Not in IMLC or PSYPACT as of 2026-04.",
    reviewStatus: "draft",
  },

  NY: {
    code: "NY",
    name: "New York",
    country: "US",
    federalFloor: "HIPAA",
    breach: {
      deadlineDays: 60,
      method: ["mail", "email", "substitute"],
      privateRightOfAction: false,
    },
    consent: {
      model: "opt-in",
      minorAge: 12,
      specialCategories: ["hiv", "mental_health", "substance_use", "reproductive", "genetic"],
    },
    licensure: {
      compactsJoined: [],
      telehealthControlledSubstances: true,
    },
    records: {
      responseDays: 10,
      feeCapUsd: 0.75,
    },
    notes: "NY SHIELD Act applies. Not in major licensure compacts — most restrictive for cross-state telehealth.",
    reviewStatus: "draft",
  },

  CA: {
    code: "CA",
    name: "California",
    country: "US",
    federalFloor: "HIPAA",
    breach: {
      deadlineDays: 15,
      method: ["mail", "email", "substitute"],
      privateRightOfAction: true,
    },
    consent: {
      model: "opt-in",
      minorAge: 12,
      specialCategories: ["hiv", "mental_health", "substance_use", "reproductive", "genetic"],
    },
    licensure: {
      compactsJoined: [],
      telehealthControlledSubstances: false,
    },
    records: {
      responseDays: 15,
      feeCapUsd: 0.25,
    },
    notes: "CMIA + CCPA/CPRA layer on top of HIPAA. 15-day breach notice is among the strictest in US.",
    reviewStatus: "draft",
  },

  TX: {
    code: "TX",
    name: "Texas",
    country: "US",
    federalFloor: "HIPAA",
    breach: {
      deadlineDays: 60,
      method: ["mail", "email", "substitute"],
      privateRightOfAction: false,
    },
    consent: {
      model: "opt-in",
      minorAge: 16,
      specialCategories: ["hiv", "mental_health", "substance_use", "reproductive"],
    },
    licensure: {
      compactsJoined: ["IMLC", "PSYPACT", "NLC", "PTC", "ASLP-IC"],
      telehealthControlledSubstances: true,
    },
    records: {
      responseDays: 15,
    },
    notes: "TMRPA (Texas Medical Records Privacy Act) extends HIPAA to more entities. Broad compact membership makes cross-state telehealth easier.",
    reviewStatus: "draft",
  },

  FL: {
    code: "FL",
    name: "Florida",
    country: "US",
    federalFloor: "HIPAA",
    breach: {
      deadlineDays: 30,
      method: ["mail", "email", "substitute"],
      privateRightOfAction: false,
    },
    consent: {
      model: "opt-in",
      minorAge: 18,
      specialCategories: ["hiv", "mental_health", "substance_use"],
    },
    licensure: {
      compactsJoined: ["PSYPACT", "NLC", "PTC", "ASLP-IC"],
      telehealthControlledSubstances: true,
    },
    records: {
      responseDays: 30,
      feeCapUsd: 1.0,
    },
    notes: "FIPA (Florida Information Protection Act) enforces 30-day breach notice with AG notification at 500+ affected.",
    reviewStatus: "draft",
  },
};

export function getJurisdiction(code: string): Jurisdiction | null {
  return JURISDICTIONS[code.toUpperCase()] || null;
}

export function listJurisdictions(): Jurisdiction[] {
  return Object.values(JURISDICTIONS);
}
