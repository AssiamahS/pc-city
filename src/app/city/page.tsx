"use client";

import dynamic from "next/dynamic";

const HealthcareCity = dynamic(
  () => import("../../components/city/HealthcareCity"),
  { ssr: false }
);

export default function CityPage() {
  return <HealthcareCity />;
}
