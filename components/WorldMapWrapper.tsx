"use client";
import dynamic from "next/dynamic";
import type { CountryScore } from "@/lib/types";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

export default function WorldMapWrapper({ data }: { data: CountryScore[] }) {
  return <WorldMap data={data} />;
}
