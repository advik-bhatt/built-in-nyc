import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import * as Sentry from "@sentry/nextjs";

const SYSTEM = `You are an expert parametric CAD engineer and maker educator. Given a plain-language description of a physical object to 3D print, respond with a single JSON object (no markdown, no explanation outside the JSON):

{
  "title": "Short name for the design (max 8 words)",
  "openscad": "complete valid OpenSCAD code with comments explaining each step",
  "preview": {
    "meshes": [
      {"type": "box", "w": 4, "h": 1, "d": 3, "x": 0, "y": 0, "z": 0, "color": "#60a5fa"},
      {"type": "cylinder", "rt": 0.4, "rb": 0.4, "h": 1.5, "x": 0, "y": 0, "z": 0, "color": "#34d399"}
    ]
  },
  "complexity_score": 6,
  "explanation": "Plain-language explanation of what this design does and how someone would use it (2-3 sentences)"
}

Rules:
- OpenSCAD must be complete and valid. Use millimeter units. Include comments.
- preview meshes approximate the shape for browser display. Scale everything to fit within a 6x6x6 unit bounding box. Mesh types: "box" (w/h/d), "cylinder" (rt/rb/h, 16 segments implied), "sphere" (r). Use multiple meshes. Choose blue/teal/purple colors (#60a5fa #34d399 #a78bfa #38bdf8).
- complexity_score: 1 (simple box) to 10 (complex multi-part assembly with tolerances)
- Return only valid JSON. No backticks, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const country = req.headers.get("x-vercel-ip-country") ?? null;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: `Design a 3D printable object: ${prompt}` }],
    });

    const raw = msg.content[0];
    if (raw.type !== "text") throw new Error("Unexpected response type");

    const jsonStr = raw.text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) throw new Error("No JSON in response");

    const design = JSON.parse(jsonStr);
    return NextResponse.json({ ...design, country });
  } catch (err) {
    Sentry.captureException(err);
    console.error(err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
