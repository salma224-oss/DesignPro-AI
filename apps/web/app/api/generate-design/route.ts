// app/api/generate-design/route.ts
import { NextResponse } from "next/server";
import { generateDesignImage } from "~/lib/diffusers";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Aucun prompt fourni" }, { status: 400 });
    }

    console.log("🚀 Génération design pour:", prompt);
    const image = await generateDesignImage(prompt);

    return NextResponse.json({ image });
  } catch (error: any) {
    console.error("❌ Erreur route /api/generate-design:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne serveur" },
      { status: 500 }
    );
  }
}
