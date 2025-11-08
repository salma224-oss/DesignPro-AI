// app/api/generate-prompt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generatePrompt } from "../../../lib/mistral";

export async function POST(req: NextRequest) {
  const { idea, method, params } = await req.json();
  try {
    const prompt = await generatePrompt(idea, method, params);
    return NextResponse.json({ prompt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
