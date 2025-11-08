import fetch from "node-fetch";

type MistralAPIChoice = {
  message: { content: string };
};

type MistralAPIResponse = {
  choices?: MistralAPIChoice[];
  output?: string;
};

export async function generatePrompt(
  idea: string,
  method: "TRIZ" | "DFX",
  params: string[]
) {
  const template =
    method === "TRIZ"
      ? `Contexte : ${idea}\nObjectif : Générer un prompt image détaillé selon la méthode TRIZ.\nPrincipes choisis : ${params.join(", ")}`
      : `Contexte : ${idea}\nObjectif : Générer un prompt image optimisé selon la méthode DFX.\nParamètres choisis : ${params.join(", ")}`;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL ?? "mistral-medium",
      messages: [
        { role: "system", content: "Tu es un assistant d'idéation produit. Réponds en FR." },
        { role: "user", content: template },
      ],
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Mistral error: " + txt);
  }

  const data = (await res.json()) as MistralAPIResponse;

  // On récupère le contenu du prompt
  const content =
    data.choices?.[0]?.message?.content ??
    data.output ??
    JSON.stringify(data);

  return content;
}
