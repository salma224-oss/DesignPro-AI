// app/api/generate-step/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const fileNameSafe = prompt.replace(/[^a-z0-9]/gi, "_").slice(0, 20);
  const objPath = path.join(process.cwd(), "apps/web/public/generated-files", `${fileNameSafe}.obj`);
  const stepPath = path.join(process.cwd(), "apps/web/public/generated-files", `${fileNameSafe}.step`);

  // Ici tu as déjà un OBJ généré (à partir du design)
  // Conversion via script Python FreeCAD
  await new Promise<void>((resolve, reject) => {
    execFile("python", ["lib/converter.py", objPath, stepPath], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const designUrl = `/generated-files/${fileNameSafe}.step`;
  return NextResponse.json({ designUrl });
}
