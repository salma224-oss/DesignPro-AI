"use client";
import React, { useState } from "react";

export default function IdeationForm() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      alert("Veuillez entrer un prompt d'abord !");
      return;
    }

    setLoading(true);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.image) {
        setImageUrl(data.image);
      } else {
        alert("Erreur lors de la génération d’image");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur pendant la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">🎨 Génération de design avec SDXL</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Décris ton idée de design..."
        className="w-full max-w-lg h-32 p-4 border rounded-lg mb-4"
      />

      <button
        onClick={handleGenerateDesign}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        {loading ? "⏳ Génération en cours..." : "🚀 Générer le design"}
      </button>

      {imageUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">🖼️ Résultat :</h2>
          <img
            src={imageUrl}
            alt="Design généré"
            className="max-w-lg rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
