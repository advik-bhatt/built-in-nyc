import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export type CountryScore = {
  country: string;
  designs: number;
  makers: number;
  avg_complexity: number;
  score: number;
};

export async function GET() {
  try {
    const db = createServiceClient();

    const { data, error } = await db
      .from("designs")
      .select("complexity_score, user_id, profiles(country)")
      .eq("is_public", true);

    if (error) throw error;

    const agg: Record<string, { designs: number; complexity_sum: number; makers: Set<string> }> = {};

    for (const row of data ?? []) {
      const country = (row.profiles as { country?: string } | null)?.country;
      if (!country) continue;
      if (!agg[country]) agg[country] = { designs: 0, complexity_sum: 0, makers: new Set() };
      agg[country].designs++;
      agg[country].complexity_sum += row.complexity_score ?? 5;
      agg[country].makers.add(row.user_id ?? "");
    }

    const result: CountryScore[] = Object.entries(agg).map(([country, s]) => {
      const avg_complexity = s.complexity_sum / s.designs;
      const score = Math.min(100, Math.round(s.designs * 6 + avg_complexity * 4 + s.makers.size * 3));
      return { country, designs: s.designs, makers: s.makers.size, avg_complexity: +avg_complexity.toFixed(1), score };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
