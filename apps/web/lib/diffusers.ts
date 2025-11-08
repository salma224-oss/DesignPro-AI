// lib/diffusers.ts
import fetch from "node-fetch";

export async function generateDesignImage(prompt: string): Promise<string> {
  const HF_TOKEN = process.env.HF_API_KEY;
  const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0";

  if (!HF_TOKEN) {
    throw new Error("HF_API_KEY manquant dans .env.local");
  }

  // 🆕 Nouvelle URL API Hugging Face (router.huggingface.co)
  const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

  console.log("🧠 Envoi du prompt à Hugging Face:", prompt);

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur Hugging Face:", errorText);
    throw new Error(`Erreur Hugging Face: ${errorText}`);
  }

  // 🧩 Lire la réponse binaire (image PNG)
  const arrayBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");

  return `data:image/png;base64,${base64Image}`;
}
