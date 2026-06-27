import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/lib/supabase";
import { resend } from "@/lib/resend";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, title, openscad, explanation, complexity_score, preview, is_public, country } = body;
    const db = createServiceClient();
    const userId = session.user.sub as string;

    const { data: existing } = await db.from("profiles").select("id, country").eq("id", userId).single();

    const isNewUser = !existing;
    const isFirstCountry = !existing?.country && country;

    if (isNewUser) {
      await db.from("profiles").insert({
        id: userId,
        email: session.user.email ?? null,
        username: (session.user.email ?? "maker").split("@")[0],
        country: country ?? null,
      });
    } else if (isFirstCountry) {
      await db.from("profiles").update({ country }).eq("id", userId);
    }

    const { data: design, error } = await db
      .from("designs")
      .insert({
        user_id: userId,
        prompt,
        title,
        openscad_code: openscad,
        explanation,
        complexity_score: complexity_score ?? 5,
        preview_json: preview,
        is_public: is_public ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    // Welcome email + first-country milestone email
    if (session.user.email && (isNewUser || isFirstCountry)) {
      const countryLabel = country ? ` from ${country}` : "";
      await resend.emails.send({
        from: "MakerMap <hello@makermap.dev>",
        to: session.user.email,
        subject: isFirstCountry
          ? `🗺️ Your country just appeared on the global maker map!`
          : `🎉 Your first design is live!`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0a0f1e;color:#f9fafb;border-radius:12px">
            <h1 style="font-size:24px;margin-bottom:8px">${isFirstCountry ? "🗺️ Your country just hit the map!" : "🎉 Welcome to MakerMap!"}</h1>
            <p style="color:#9ca3af;line-height:1.6">
              Your design <strong style="color:#60a5fa">"${title}"</strong>${countryLabel} is now live in the community gallery.
              ${isFirstCountry ? `<br><br>You've just put <strong>${country}</strong> on the global creativity map. Every design you create raises your country's score.` : ""}
            </p>
            <a href="https://buildinnyc.vercel.app/gallery" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px">View in gallery →</a>
          </div>`,
      }).catch(() => {});
    }

    return NextResponse.json(design);
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = createServiceClient();
    const { data, error } = await db
      .from("designs")
      .select("*")
      .eq("user_id", session.user.sub as string)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to fetch designs" }, { status: 500 });
  }
}
