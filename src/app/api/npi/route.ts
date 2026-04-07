import { NextResponse } from "next/server";

const NPI_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Pass through supported NPI API params
  const params = new URLSearchParams();
  params.set("version", "2.1");
  params.set("limit", searchParams.get("limit") || "20");

  const number = searchParams.get("number");
  const first_name = searchParams.get("first_name");
  const last_name = searchParams.get("last_name");
  const organization_name = searchParams.get("organization_name");
  const taxonomy_description = searchParams.get("taxonomy_description");
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const postal_code = searchParams.get("postal_code");
  const enumeration_type = searchParams.get("enumeration_type");
  const skip = searchParams.get("skip");

  if (number) params.set("number", number);
  if (first_name) params.set("first_name", first_name);
  if (last_name) params.set("last_name", last_name);
  if (organization_name) params.set("organization_name", organization_name);
  if (taxonomy_description) params.set("taxonomy_description", taxonomy_description);
  if (city) params.set("city", city);
  if (state) params.set("state", state);
  if (postal_code) params.set("postal_code", postal_code);
  if (enumeration_type) params.set("enumeration_type", enumeration_type);
  if (skip) params.set("skip", skip);

  try {
    const res = await fetch(`${NPI_API}&${params.toString()}`, {
      next: { revalidate: 3600 }, // cache 1 hour
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to query NPI registry", detail: String(err) },
      { status: 502 }
    );
  }
}
