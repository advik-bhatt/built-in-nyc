"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5">
      <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg tracking-tight">
        <span className="text-2xl">🌍</span>
        <span>MakerMap</span>
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link
          href="/gallery"
          className={`transition-colors ${path === "/gallery" ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          Gallery
        </Link>
        <Link
          href="/create"
          className={`transition-colors ${path === "/create" ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          Create
        </Link>
        <a
          href="/auth/login"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium"
        >
          Sign in
        </a>
      </div>
    </nav>
  );
}
