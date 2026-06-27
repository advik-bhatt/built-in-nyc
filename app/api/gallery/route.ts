import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const db = createServiceClient();
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    let query = db
      .from("designs")
      .select("id, prompt, title, explanation, complexity_score, preview_json, created_at, profiles(username, country)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(60);

    if (country) {
      // Filter by joining profiles country — handled post-fetch since Supabase FK filters are limited
    }

    const { data, error } = await query;
    if (error) throw error;

    const filtered = country
      ? (data ?? []).filter((d) => (d.profiles as { country?: string } | null)?.country === country)
      : data;

    return NextResponse.json(filtered ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
