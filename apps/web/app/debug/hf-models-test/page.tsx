"use client";
import { useState } from "react";

const MODELS_TO_TEST = [
  { id: "runwayml/stable-diffusion-v1-5", name: "Stable Diffusion v1.5" },
  { id: "stabilityai/stable-diffusion-2-1", name: "Stable Diffusion 2.1" },
  { id: "lllyasviel/sd-controlnet-scribble", name: "ControlNet Scribble" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "SDXL Base" },
];

export default function HFModelsTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testModels = async () => {
    setTesting(true);
    const testResults = [];

    for (const model of MODELS_TO_TEST) {
      try {
        console.log(`Testing ${model.id}...`);
        
        const response = await fetch(`https://router.huggingface.co/models/${model.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          }
        });

        testResults.push({
          name: model.name,
          id: model.id,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          accessible: response.ok
        });
      } catch (error: any) {
        testResults.push({
          name: model.name,
          id: model.id,
          status: 'ERROR',
          ok: false,
          statusText: error.message,
          accessible: false
        });
      }
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test d'Accessibilité des Modèles Hugging Face</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Token HF Actuel:</h3>
        <code className="text-sm bg-blue-100 p-2 rounded">
          {process.env.HF_API_TOKEN ? 
            `${process.env.HF_API_TOKEN.substring(0, 10)}...` : 
            'NON CONFIGURÉ'
          }
        </code>
      </div>

      <button
        onClick={testModels}
        disabled={testing}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mb-6"
      >
        {testing ? 'Test en cours...' : 'Tester tous les modèles'}
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className={`p-4 border rounded-lg ${
            result.accessible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{result.name}</h3>
                <p className="text-sm text-gray-600 break-all">{result.id}</p>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                result.accessible ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}>
                {result.accessible ? '✓ Accessible' : `✗ ${result.status} ${result.statusText}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Résultats</h3>
          <p className="text-yellow-700">
            {results.filter(r => r.accessible).length} sur {results.length} modèles sont accessibles.
          </p>
          <p className="text-yellow-700 text-sm mt-2">
            Si aucun modèle n'est accessible, vérifiez votre token HF et vos permissions.
          </p>
        </div>
      )}
    </div>
  );
}