"use client";
import { useState, useEffect } from "react";

export default function HuggingFaceStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/ideation/generate-design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'test',
            generationMethod: 'sdxl',
            prompt: 'test design product'
          })
        });
        
        const data = await response.json();
        setStatus(data);
      } catch (error: any) {
        setStatus({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) return <div>Vérification de la configuration Hugging Face...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Statut Hugging Face</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Configuration</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>HF_API_TOKEN:</span>
              <span className={process.env.HF_API_TOKEN ? 'text-green-600' : 'text-red-600'}>
                {process.env.HF_API_TOKEN ? '✓ Configuré' : '✗ Manquant'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Statut API:</span>
              <span className={status?.huggingface_configured ? 'text-green-600' : 'text-red-600'}>
                {status?.huggingface_configured ? '✓ Connecté' : '✗ Erreur'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Modèles Disponibles</h3>
          <ul className="space-y-1 text-sm">
            <li>• stable-diffusion-v1-5 (Prompt → Design)</li>
            <li>• sd-controlnet-scribble (Sketch → Design)</li>
            <li>• stable-diffusion-v1-5 (Image → Variations)</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Réponse de l'API:</h3>
        <pre className="text-sm">{JSON.stringify(status, null, 2)}</pre>
      </div>

      {!status?.huggingface_configured && (
        <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-2">Configuration Requise</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Vérifiez que <code>HF_API_TOKEN</code> est dans votre <code>.env.local</code></li>
            <li>Le token doit commencer par <code>hf_</code></li>
            <li>Redémarrez votre serveur de développement</li>
            <li>Visitez <a href="https://huggingface.co/settings/tokens" className="underline">huggingface.co/settings/tokens</a> pour obtenir un token</li>
          </ol>
        </div>
      )}
    </div>
  );
}