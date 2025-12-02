"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { TRIZAnalyzer } from "../../../../components/ideation/TRIZAnalyzer";
import { MethodologySelector } from "../../../../components/ideation/MethodologySelector";
import { CollaborationPanel } from "../../../../components/project/CollaborationPanel";
import { PromptDisplay } from "../../../../components/ideation/PromptDisplay";
import { DesignViewer } from "../../../../components/project/DesignViewer";
import type { Project } from "../../../../types";

type WorkflowStep = "input" | "methodology" | "customization" | "generation" | "result";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("input");
  const [selectedMethodology, setSelectedMethodology] = useState("TRIZ");
  const [methodologyData, setMethodologyData] = useState<any>({});
  const [idea, setIdea] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [designResults, setDesignResults] = useState<{images: string[]} | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProjectData = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (!error && data) {
        setProject(data as Project);
      }
    };

    loadProjectData();
  }, [projectId]);

  const handleGeneratePrompt = async () => {
    try {
      const response = await fetch('/api/ideation/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          idea,
          methodology: selectedMethodology,
          methodologyData,
        })
      });
      
      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      setCurrentStep("generation");
    } catch (error) {
      console.error('Error generating prompt:', error);
    }
  };

  const handleGenerateDesign = async () => {
    try {
      const response = await fetch('/api/ideation/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatedPrompt,
        })
      });
      
      const data = await response.json();
      setDesignResults(data);
      setCurrentStep("result");
    } catch (error) {
      console.error('Error generating design:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">
                {project?.name || "Projet"}
              </h1>
              
              <nav className="flex space-x-4">
                {(["input", "methodology", "customization", "generation", "result"] as WorkflowStep[]).map(step => (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentStep === step
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
            
            <CollaborationPanel projectId={projectId} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          
          {currentStep === "input" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Décrivez votre idée</h2>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="w-full h-32 p-3 border rounded-lg"
                placeholder="Décrivez votre produit..."
              />
              <button
                onClick={() => setCurrentStep("methodology")}
                disabled={!idea.trim()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          )}

          {currentStep === "methodology" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Choisissez votre approche</h2>
              <MethodologySelector 
                value={selectedMethodology} 
                onChange={setSelectedMethodology} 
              />
              <button
                onClick={() => setCurrentStep("customization")}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Configurer
              </button>
            </div>
          )}

          {currentStep === "customization" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Configuration {selectedMethodology}</h2>
              {selectedMethodology === "TRIZ" && (
                <TRIZAnalyzer onUpdate={setMethodologyData} />
              )}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep("methodology")}
                  className="px-4 py-2 border rounded"
                >
                  Retour
                </button>
                <button
                  onClick={handleGeneratePrompt}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Générer le Prompt
                </button>
              </div>
            </div>
          )}

          {currentStep === "generation" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Prompt Optimisé</h2>
              <PromptDisplay prompt={generatedPrompt} />
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentStep("customization")}
                  className="px-4 py-2 border rounded"
                >
                  Retour
                </button>
                <button
                  onClick={handleGenerateDesign}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Générer le Design
                </button>
              </div>
            </div>
          )}

          {currentStep === "result" && designResults && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Résultats</h2>
              <DesignViewer images={designResults.images} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


