"use client";
import { useState, useEffect, useCallback } from "react";
import DesignCard from "@/components/DesignCard";
import { useRouter } from "next/navigation";

type Design = {
  id: string;
  title: string | null;
  prompt: string;
  explanation: string | null;
  complexity_score: number;
  preview_json: { meshes: any[] } | null;
  created_at: string;
  profiles: { username: string | null; country: string | null } | null;
};

export default function GalleryPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const router = useRouter();

  const load = useCallback(async (c?: string) => {
    setLoading(true);
    try {
      const url = c ? `/api/gallery?country=${encodeURIComponent(c)}` : "/api/gallery";
      const res = await fetch(url);
      const data = await res.json();
      setDesigns(Array.isArray(data) ? data : []);
      const seen = new Set<string>();
      for (const d of (Array.isArray(data) ? data : [])) {
        const co = d.profiles?.country;
        if (co) seen.add(co);
      }
      setCountries(Array.from(seen).sort());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCountry = (c: string) => {
    setCountry(c);
    load(c || undefined);
  };

  const handleFork = (d: Design) => {
    router.push(`/create?prompt=${encodeURIComponent(d.prompt)}`);
  };

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Community Gallery</h1>
            <p className="text-gray-500 mt-1 text-sm">Designs created by makers around the world</p>
          </div>
          <select
            value={country}
            onChange={(e) => handleCountry(e.target.value)}
            className="bg-[#111827] border border-gray-700 text-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-600"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#111827] border border-gray-800 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">No designs yet</h2>
            <p className="text-gray-600 mb-8">
              {country ? `No designs from ${country} yet.` : "Be the first to create one!"}
            </p>
            <a
              href="/create"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
            >
              Create a design →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((d) => (
              <DesignCard key={d.id} design={d} onFork={handleFork} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
