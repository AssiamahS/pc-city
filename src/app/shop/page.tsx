"use client";

import { useState, useCallback } from "react";
import type { NPIResult } from "@/lib/types";
import { formatProviderName, taxonomyToType } from "@/lib/types";

const COLORS = [
  "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#f59e0b",
  "#06b6d4", "#ec4899", "#0ea5e9", "#84cc16", "#f97316",
];

export default function ShopPage() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "npi" | "org">("name");
  const [state, setState] = useState("");
  const [results, setResults] = useState<NPIResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NPIResult | null>(null);
  const [claimed, setClaimed] = useState(false);

  // Customization
  const [buildingColor, setBuildingColor] = useState("#3b82f6");
  const [buildingHeight, setBuildingHeight] = useState(3);
  const [tagline, setTagline] = useState("");

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);

    const params = new URLSearchParams();
    if (searchType === "npi") {
      params.set("number", query.trim());
    } else if (searchType === "org") {
      params.set("organization_name", query.trim());
      params.set("enumeration_type", "NPI-2");
    } else {
      const parts = query.trim().split(/\s+/);
      if (parts.length >= 2) {
        params.set("first_name", parts[0]);
        params.set("last_name", parts.slice(1).join(" "));
      } else {
        params.set("last_name", parts[0]);
      }
      params.set("enumeration_type", "NPI-1");
    }
    if (state) params.set("state", state);
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/npi?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [query, searchType, state]);

  const claim = useCallback(async (result: NPIResult) => {
    const name = formatProviderName(result);
    const type = taxonomyToType(result.taxonomies?.[0]?.desc || "");
    const addr = result.addresses?.[0];

    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npi: result.number,
        name,
        credential: result.basic.credential || "",
        specialty: result.taxonomies?.[0]?.desc || "",
        type,
        address: addr ? {
          street: addr.address_1,
          city: addr.city,
          state: addr.state,
          zip: addr.postal_code,
          phone: addr.telephone_number,
        } : {},
        building: { color: buildingColor, height: buildingHeight, tagline },
      }),
    });

    if (res.ok) setClaimed(true);
  }, [buildingColor, buildingHeight, tagline]);

  const customize = useCallback(async () => {
    if (!selected) return;
    await fetch("/api/providers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npi: selected.number,
        building: { color: buildingColor, height: buildingHeight, tagline },
      }),
    });
  }, [selected, buildingColor, buildingHeight, tagline]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            &larr; Back to City
          </a>
          <h1 className="mt-2 text-2xl font-bold">Claim Your Building</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Search the NPI Registry to find your practice. Claim your building in Healthcare City, customize it, and be visible to patients.
          </p>
        </div>

        {/* Search */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 mb-6">
          <div className="flex gap-2 mb-3">
            {(["name", "npi", "org"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  searchType === t ? "bg-white/15 text-white" : "bg-white/5 text-zinc-500"
                }`}
              >
                {t === "name" ? "Provider Name" : t === "npi" ? "NPI Number" : "Organization"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder={
                searchType === "npi" ? "Enter 10-digit NPI..."
                : searchType === "org" ? "Organization name..."
                : "First Last name..."
              }
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="ST"
              className="w-14 rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-sm text-white text-center placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={search}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && !selected && (
          <div className="space-y-2 mb-6">
            <p className="text-xs text-zinc-500 mb-2">{results.length} providers found</p>
            {results.map((r) => {
              const name = formatProviderName(r);
              const specialty = r.taxonomies?.[0]?.desc || "—";
              const addr = r.addresses?.[0];
              return (
                <button
                  key={r.number}
                  onClick={() => setSelected(r)}
                  className="w-full text-left rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{specialty}</p>
                      {addr && (
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          {addr.city}, {addr.state} {addr.postal_code}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">NPI {r.number}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected — Customize & Claim */}
        {selected && !claimed && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold">{formatProviderName(selected)}</p>
                <p className="text-xs text-zinc-400">{selected.taxonomies?.[0]?.desc}</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">NPI {selected.number}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                Change
              </button>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="text-xs font-semibold text-zinc-300 mb-3">Customize Your Building</p>

              {/* Color picker */}
              <div className="mb-4">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Building Color</label>
                <div className="flex gap-2 mt-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBuildingColor(c)}
                      className={`h-7 w-7 rounded-lg transition-all ${
                        buildingColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a1a] scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Height */}
              <div className="mb-4">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Building Height</label>
                <div className="flex gap-2 mt-1.5">
                  {[1, 2, 3, 4, 5].map((h) => (
                    <button
                      key={h}
                      onClick={() => setBuildingHeight(h)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        buildingHeight === h ? "bg-white/20 text-white" : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {buildingHeight <= 2 ? "Small practice" : buildingHeight <= 3 ? "Standard" : "Premium — stands out in the city"}
                </p>
              </div>

              {/* Tagline */}
              <div className="mb-5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Tagline</label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Accepting new patients"
                  maxLength={60}
                  className="mt-1.5 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Preview block */}
              <div className="mb-5 flex items-end gap-3 p-3 rounded-lg bg-black/30">
                <div
                  className="rounded"
                  style={{
                    backgroundColor: buildingColor,
                    width: 40,
                    height: buildingHeight * 16,
                  }}
                />
                <div>
                  <p className="text-xs font-semibold">{formatProviderName(selected)}</p>
                  {tagline && <p className="text-[10px] text-zinc-400">{tagline}</p>}
                </div>
              </div>

              <button
                onClick={() => claim(selected)}
                className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition"
              >
                Claim Building — Free
              </button>
              <p className="text-[10px] text-zinc-600 text-center mt-2">
                Premium features (logo, larger building, featured placement) coming soon.
              </p>
            </div>
          </div>
        )}

        {/* Claimed success */}
        {claimed && selected && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center">
            <p className="text-lg font-bold text-emerald-400 mb-1">Building Claimed!</p>
            <p className="text-sm text-zinc-300">
              {formatProviderName(selected)} is now in Healthcare City.
            </p>
            <p className="text-xs text-zinc-500 mt-1">NPI {selected.number}</p>
            <div className="mt-4 flex gap-2 justify-center">
              <a
                href="/"
                className="rounded-lg bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20 transition"
              >
                View City
              </a>
              <button
                onClick={() => { setSelected(null); setClaimed(false); setResults([]); setQuery(""); }}
                className="rounded-lg bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20 transition"
              >
                Add Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
