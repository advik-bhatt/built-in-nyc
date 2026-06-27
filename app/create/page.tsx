"use client";
import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import type { Mesh3D } from "@/components/ThreeViewer";

const ThreeViewer = dynamic(() => import("@/components/ThreeViewer"), { ssr: false });

type GeneratedDesign = {
  title: string;
  openscad: string;
  preview: { meshes: Mesh3D[] };
  complexity_score: number;
  explanation: string;
  country: string | null;
};

const EXAMPLES = [
  "A phone stand with adjustable angle",
  "A solar panel bracket that clips to a 2cm pole",
  "A prosthetic finger grip with textured surface",
  "A cable organizer that mounts under a desk",
  "A modular plant pot with drainage holes",
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 8 ? "#a78bfa" : score >= 5 ? "#60a5fa" : "#34d399";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score * 10}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{score}/10</span>
    </div>
  );
}

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [design, setDesign] = useState<GeneratedDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [country, setCountry] = useState("");

  const generate = useCallback(async (p?: string) => {
    const text = p ?? prompt;
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setDesign(null);
    setSaved(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDesign(data);
      if (data.country && !country) setCountry(data.country);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [prompt, country]);

  const downloadScad = () => {
    if (!design) return;
    const blob = new Blob([design.openscad], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${design.title?.replace(/\s+/g, "-").toLowerCase() ?? "design"}.scad`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveDesign = async () => {
    if (!design) return;
    setSaving(true);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          title: design.title,
          openscad: design.openscad,
          explanation: design.explanation,
          complexity_score: design.complexity_score,
          preview: design.preview,
          is_public: true,
          country: country || design.country,
        }),
      });
      if (res.status === 401) {
        window.location.href = "/auth/login?returnTo=/create";
        return;
      }
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch {
      setError("Failed to save — are you signed in?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2">What do you want to make?</h1>
          <p className="text-gray-500">Describe any physical object in plain language</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: input + results */}
          <div className="space-y-6">
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A phone stand with adjustable angle and cable management..."
                className="w-full bg-transparent text-white placeholder-gray-600 resize-none outline-none text-base leading-relaxed h-28"
                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) generate(); }}
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <span className="text-xs text-gray-600">⌘↵ to generate</span>
                <button
                  onClick={() => generate()}
                  disabled={loading || !prompt.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating…
                    </span>
                  ) : "Generate →"}
                </button>
              </div>
            </div>

            {/* Examples */}
            <div>
              <p className="text-xs text-gray-600 mb-3 uppercase tracking-widest">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setPrompt(ex); generate(ex); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {design && (
              <div className="space-y-4">
                {/* Title + complexity */}
                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-1">{design.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{design.explanation}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Complexity</span>
                      <span>⚡ {design.complexity_score}/10</span>
                    </div>
                    <ScoreBar score={design.complexity_score} />
                  </div>
                </div>

                {/* Country */}
                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Your country (for the map)</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Nigeria, India, Brazil…"
                    className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-700"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadScad}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                  >
                    Download .scad
                  </button>
                  <button
                    onClick={saveDesign}
                    disabled={saving || saved}
                    className="flex-1 px-4 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
                  >
                    {saved ? "✓ Saved to gallery!" : saving ? "Saving…" : "Save to gallery"}
                  </button>
                </div>

                {/* OpenSCAD code */}
                <div className="bg-[#0d1117] border border-gray-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowCode((s) => !s)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <span>📄 OpenSCAD code</span>
                    <span>{showCode ? "▲ hide" : "▼ show"}</span>
                  </button>
                  {showCode && (
                    <pre className="px-4 pb-4 text-xs text-green-400 font-mono leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                      {design.openscad}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: 3D viewer */}
          <div className="h-[500px] lg:sticky lg:top-24">
            {loading ? (
              <div className="w-full h-full rounded-2xl bg-[#0d1117] border border-gray-800 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Generating your design…</p>
              </div>
            ) : design?.preview?.meshes?.length ? (
              <ThreeViewer meshes={design.preview.meshes} />
            ) : (
              <div className="w-full h-full rounded-2xl bg-[#0d1117] border border-dashed border-gray-800 flex flex-col items-center justify-center gap-3 text-gray-700">
                <div className="text-5xl">🔧</div>
                <p className="text-sm">Your 3D preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
