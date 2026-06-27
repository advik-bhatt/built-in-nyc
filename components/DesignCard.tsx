"use client";
import dynamic from "next/dynamic";
import type { Mesh3D } from "./ThreeViewer";

const ThreeViewer = dynamic(() => import("./ThreeViewer"), { ssr: false });

type Design = {
  id: string;
  title: string | null;
  prompt: string;
  explanation: string | null;
  complexity_score: number;
  preview_json: { meshes: Mesh3D[] } | null;
  created_at: string;
  profiles: { username: string | null; country: string | null } | null;
};

function ComplexityBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-purple-400 bg-purple-900/30 border-purple-700/50" :
    score >= 5 ? "text-blue-400 bg-blue-900/30 border-blue-700/50" :
                 "text-green-400 bg-green-900/30 border-green-700/50";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      ⚡ {score}/10
    </span>
  );
}

export default function DesignCard({ design, onFork }: { design: Design; onFork?: (d: Design) => void }) {
  const meshes = design.preview_json?.meshes ?? [];

  return (
    <div className="group bg-[#111827] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-200">
      <div className="h-40 bg-[#0d1117]">
        {meshes.length > 0 ? (
          <ThreeViewer meshes={meshes} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">
            🔧
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
            {design.title ?? design.prompt}
          </h3>
          <ComplexityBadge score={design.complexity_score} />
        </div>

        {design.explanation && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-1">
            {design.explanation}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {design.profiles?.country && (
              <span className="text-gray-500">📍 {design.profiles.country}</span>
            )}
            {design.profiles?.username && (
              <span>@{design.profiles.username}</span>
            )}
          </div>
          {onFork && (
            <button
              onClick={() => onFork(design)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100"
            >
              Fork →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
