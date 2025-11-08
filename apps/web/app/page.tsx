"use client";

import { useState } from "react";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [method, setMethod] = useState<"TRIZ" | "DFX">("TRIZ");
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatingDesign, setGeneratingDesign] = useState(false);
  const [designUrl, setDesignUrl] = useState<string | null>(null);

  // --- Listes des paramètres TRIZ et DFX ---
  const trizPrinciples = [
    "Segmentation", "Extraction", "Qualité locale", "Asymétrie", "Fusion",
    "Extraction partielle", "Équivalence universelle", "Inversion",
    "Anticipation", "Action préliminaire", "Cushioning", "Intermédiaire",
    "Inversion dynamique", "Sphéricité", "Transformation des propriétés",
    "Partage", "Action partielle ou excessive", "Mécanique vibratoire",
    "Mécanique continue", "Changement de couleur", "Homogénéisation",
    "Expansion et contraction", "Retournement", "Mécanique flexible",
    "Usage de la dynamique", "Utilisation des paramètres physiques",
    "Utilisation d’états intermédiaires", "Mise en phase", "Réaction chimique",
    "Absorption", "Chaleur", "Écoulement", "Rotation", "Copie",
    "Transformation des champs", "Économie", "Élimination", "Automatisation",
    "Priorité"
  ];

  const dfxOptions = [
    "DFP – Design For Procurement",
    "DFM – Design For Manufacture",
    "DFT – Design For Test",
    "DFD – Design For Diagnosability",
    "DFA – Design For Assembly",
    "DFE – Design For Environment",
    "DFF – Design For Fabrication",
    "DFS – Design For Serviceability",
    "DFR – Design For Reliability",
    "DFC – Design For Cost"
  ];

  const methodParams = method === "TRIZ" ? trizPrinciples : dfxOptions;

  // --- Sélection des paramètres ---
  const toggleParam = (param: string) => {
    setSelectedParams(prev =>
      prev.includes(param)
        ? prev.filter(p => p !== param)
        : [...prev, param]
    );
  };

  // --- Génération du prompt ---
  const handleGeneratePrompt = async () => {
    if (!idea.trim()) return alert("Veuillez entrer votre idée.");
    if (selectedParams.length === 0)
      return alert("Veuillez sélectionner au moins un paramètre.");

    setGeneratingPrompt(true);
    setPrompt(null);

    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, method, params: selectedParams }),
      });

      const data = await res.json();
      setPrompt(data.prompt);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du prompt.");
    } finally {
      setGeneratingPrompt(false);
    }
  };

  // --- Génération du design ---
  const handleGenerateDesign = async () => {
    if (!prompt) return alert("Veuillez générer un prompt d'abord.");
    setGeneratingDesign(true);
    setDesignUrl(null);

    try {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      // ✅ Correction ici : la route renvoie { image }
      if (data.image) {
        setDesignUrl(data.image);
      } else if (data.error) {
        alert("Erreur : " + data.error);
      } else {
        alert("Aucune image reçue !");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du design.");
    } finally {
      setGeneratingDesign(false);
    }
  };

  return (
    <section className="bg-white p-8 rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-center">
        🎨 Conception produit augmentée par l'IA (TRIZ / DFX)
      </h1>

      {/* ---- Zone idée ---- */}
      <div className="space-y-2">
        <label className="block font-medium">💡 Votre idée :</label>
        <textarea
          className="w-full border p-2 rounded"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          placeholder="Décrivez votre idée de produit..."
        />
      </div>

      {/* ---- Choix méthode et paramètres ---- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <label>Méthode :</label>
          <select
            className="border p-1 rounded"
            value={method}
            onChange={(e) => {
              const m = e.target.value as "TRIZ" | "DFX";
              setMethod(m);
              setSelectedParams([]);
            }}
          >
            <option value="TRIZ">TRIZ</option>
            <option value="DFX">Design-for-X (DFX)</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block font-medium mb-2">
            Paramètres disponibles :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto border p-2 rounded">
            {methodParams.map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 border p-1 rounded hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedParams.includes(p)}
                  onChange={() => toggleParam(p)}
                />
                <span className="text-sm">{p}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Boutons d'action ---- */}
      <div className="flex gap-4 mt-4 justify-center">
        <button
          onClick={handleGeneratePrompt}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={generatingPrompt || selectedParams.length === 0}
        >
          {generatingPrompt ? "⏳ Génération du prompt..." : "🧠 Générer prompt"}
        </button>

        <button
          onClick={handleGenerateDesign}
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={!prompt || generatingDesign}
        >
          {generatingDesign ? "🎨 Génération design..." : "🚀 Générer design"}
        </button>
      </div>

      {/* ---- Affichage du prompt généré ---- */}
      {prompt && (
        <div className="border p-4 rounded bg-gray-50 mt-4">
          <h2 className="font-bold mb-2">🧩 Prompt généré :</h2>
          <pre className="whitespace-pre-wrap">{prompt}</pre>
        </div>
      )}

      {/* ---- Affichage de l'image générée ---- */}
      {designUrl && (
        <div className="border p-4 rounded bg-gray-50 mt-4 text-center">
          <h2 className="font-bold mb-2">🖼️ Design généré :</h2>
          <img
            src={designUrl}
            alt="Design généré"
            className="max-w-lg mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </section>
  );
}
