import dynamic from "next/dynamic";
import Link from "next/link";
import type { CountryScore } from "./api/creativity-map/route";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

async function getMapData(): Promise<CountryScore[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/creativity-map`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const mapData = await getMapData();
  const totalDesigns = mapData.reduce((s, c) => s + c.designs, 0);
  const totalCountries = mapData.length;
  const avgComplexity =
    mapData.length > 0
      ? (mapData.reduce((s, c) => s + c.avg_complexity, 0) / mapData.length).toFixed(1)
      : "—";

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-700/40 rounded-full text-blue-400 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live creativity map · {totalCountries} countries
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Turn ideas into
              <br />
              <span className="text-blue-400">physical reality.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Any student, anywhere — describe what you want to make, and AI generates
              printable CAD code instantly. No software. No experience needed.
              Just a browser and an idea.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors"
              >
                Start creating →
              </Link>
              <Link
                href="/gallery"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors"
              >
                Browse gallery
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/5">
              {[
                { value: totalDesigns || "0", label: "designs created" },
                { value: totalCountries || "0", label: "countries active" },
                { value: avgComplexity, label: "avg complexity" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl font-bold text-white">{value}</div>
                  <div className="text-gray-500 text-sm mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: map */}
          <div>
            <div className="rounded-2xl border border-white/5 bg-[#0d1117] p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Creativity Score by Country
                </span>
                <span className="text-xs text-gray-600">live · updates on new designs</span>
              </div>
              <WorldMap data={mapData} />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "✍️", step: "1", title: "Describe your idea", body: "Type what you want to make in plain language. A solar panel mount. A prosthetic finger grip. A custom door latch." },
              { icon: "⚙️", step: "2", title: "AI generates CAD", body: "Claude creates OpenSCAD code — parametric, readable, printable. See a live 3D preview rotate in your browser." },
              { icon: "🖨️", step: "3", title: "Download and print", body: "Download the .scad file. Take it to any 3D printer — at school, a makerspace, or a local print shop." },
            ].map(({ icon, step, title, body }) => (
              <div key={step} className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="text-xs text-blue-400 font-medium mb-1">Step {step}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsor bar */}
      <section className="py-10 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-6">Built with</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Vercel", "Anthropic", "Supabase", "Auth0", "Resend", "Sentry"].map((s) => (
              <span key={s} className="px-4 py-2 text-sm rounded-lg text-gray-400 bg-white/[0.03] border border-white/5">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
