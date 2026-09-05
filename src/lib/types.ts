// NPI Registry types (subset of NPPES API v2.1 response)
export interface NPIResult {
  number: number;
  enumeration_type: "NPI-1" | "NPI-2"; // 1=individual, 2=organization
  basic: {
    first_name?: string;
    last_name?: string;
    credential?: string;
    organization_name?: string;
    gender?: string;
    enumeration_date?: string;
    last_updated?: string;
    status?: string;
  };
  addresses: {
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
    address_purpose: string;
    telephone_number?: string;
    fax_number?: string;
  }[];
  taxonomies: {
    code: string;
    taxonomy_group?: string;
    desc: string;
    state?: string;
    license?: string;
    primary: boolean;
  }[];
}

// Provider who has opted in to Healthcare City
export interface CityProvider {
  npi: number;
  name: string;
  credential: string;
  specialty: string;
  type: "doctor" | "pharmacy" | "hospital" | "lab" | "insurance";
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
  };
  // City customization (paid features)
  building: {
    color: string;
    height: number; // 1-5 scale
    logo?: string;  // URL to uploaded image
    tagline?: string;
  };
  optedIn: boolean;
  claimedAt: string;
  // Position in city grid (assigned on opt-in)
  position?: [number, number, number];
}

// Map NPI taxonomy to our building types
export function taxonomyToType(desc: string): CityProvider["type"] {
  const d = desc.toLowerCase();
  if (d.includes("pharmacy") || d.includes("pharmacist")) return "pharmacy";
  if (d.includes("hospital") || d.includes("emergency")) return "hospital";
  if (d.includes("laboratory") || d.includes("radiology") || d.includes("pathology")) return "lab";
  return "doctor";
}

// Jurisdiction — drives consent, licensure, and compliance UI per patient location.
// Patient-centric: evaluated per session based on where the patient currently is.
// Source of truth: src/data/jurisdictions.ts. Treat as draft until attorney-reviewed.
export interface Jurisdiction {
  code: string;           // "NJ", "NY", "ON", "QC"
  name: string;           // "New Jersey"
  country: "US" | "CA";
  federalFloor: "HIPAA" | "PIPEDA";

  // Breach notification to affected individuals
  breach: {
    deadlineDays: number;      // days from discovery
    method: ("mail" | "email" | "substitute")[];
    privateRightOfAction: boolean;
  };

  // Consent model at intake
  consent: {
    model: "opt-in" | "opt-out" | "implied";
    minorAge: number;          // age of medical consent without parent
    specialCategories: ("hiv" | "mental_health" | "substance_use" | "reproductive" | "genetic")[];
  };

  // Clinician licensure / compact membership — drives whether a provider
  // licensed in another state can treat a patient currently in this state.
  licensure: {
    compactsJoined: ("IMLC" | "PSYPACT" | "NLC" | "PTC" | "ASLP-IC")[];
    telehealthControlledSubstances: boolean; // can prescribe Schedule II-V via telehealth
  };

  // Record-request constraints
  records: {
    responseDays: number;      // days to fulfill a patient's request
    feeCapUsd?: number;        // per-page cap, if set
  };

  // Freeform notes for UI / legal context
  notes?: string;

  // Review state — NEVER ship to production without attorney signoff per row.
  reviewStatus: "draft" | "attorney-reviewed";
  reviewedAt?: string;         // ISO date
  reviewedBy?: string;
}

export function formatProviderName(result: NPIResult): string {
  if (result.enumeration_type === "NPI-2") {
    return result.basic.organization_name || "Unknown Organization";
  }
  const parts = [result.basic.first_name, result.basic.last_name].filter(Boolean);
  if (result.basic.credential) parts.push(result.basic.credential);
  return parts.join(" ") || "Unknown Provider";
}
