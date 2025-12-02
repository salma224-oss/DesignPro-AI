"use client";
import { useState } from "react";

export default function HFEndpointsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testEndpoints = async () => {
    setTesting(true);
    const endpoints = [
      {
        name: "Stable Diffusion v1.5",
        url: "https://router.huggingface.co/models/stable-diffusion-v1-5/stable-diffusion-v1-5",
        method: "POST"
      },
      {
        name: "ControlNet Scribble", 
        url: "https://router.huggingface.co/models/lllyasviel/sd-controlnet-scribble",
        method: "POST"
      },
      {
        name: "LoRA Next Scene",
        url: "https://router.huggingface.co/models/lovis93/next-scene-qwen-image-lora-2509",
        method: "POST"
      }
    ];

    const testResults = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET', // Test avec GET d'abord pour vérifier l'accessibilité
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          }
        });

        testResults.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });
      } catch (error: any) {
        testResults.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          ok: false,
          statusText: error.message
        });
      }
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test des Endpoints Hugging Face</h1>
      
      <button
        onClick={testEndpoints}
        disabled={testing}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
      >
        {testing ? 'Test en cours...' : 'Tester les Endpoints'}
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className={`p-4 border rounded-lg ${
            result.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-semibold">{result.name}</h3>
            <p className="text-sm text-gray-600 break-all">{result.url}</p>
            <div className="mt-2 flex items-center">
              <span className={`px-2 py-1 rounded text-xs ${
                result.ok ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}>
                {result.ok ? '✓ Accessible' : `✗ Erreur: ${result.status} ${result.statusText}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Résultats du Test</h3>
          <p className="text-blue-700">
            {results.filter(r => r.ok).length} sur {results.length} endpoints sont accessibles.
          </p>
          <p className="text-blue-700 text-sm mt-2">
            Si certains endpoints ne fonctionnent pas, l'application utilisera automatiquement des images de démonstration.
          </p>
        </div>
      )}
    </div>
  );
}