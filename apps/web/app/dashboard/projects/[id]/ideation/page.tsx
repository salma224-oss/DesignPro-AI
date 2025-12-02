"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "~/lib/supabase";
import Link from "next/link";
import { UserMenu } from "~/components/auth/UserMenu";

// Méthodes de génération disponibles
const GENERATION_METHODS = {
  PROMPT: {
    id: "prompt",
    name: "Prompt → Design",
    description: "Génération à partir d'une description textuelle avec Mistral + SDXL",
    icon: "💬",
    inputType: "text" as const
  },
  SKETCH: {
    id: "sketch", 
    name: "Sketch → Design",
    description: "Transformation d'esquisse en design réaliste",
    icon: "✏️",
    inputType: "sketch" as const
  },
  IMAGE: {
    id: "image",
    name: "Image → Variations", 
    description: "Création de variations à partir d'une image existante",
    icon: "🖼️",
    inputType: "image" as const
  }
};

const METHODOLOGIES = {
  TRIZ: {
    name: "Méthodologie TRIZ",
    description: "Résolution inventive de problèmes techniques",
    params: ["contradiction_technique", "niveau_inventivite", "ressources_disponibles"]
  },
  DESIGN_THINKING: {
    name: "Design Thinking", 
    description: "Approche centrée utilisateur et itérative",
    params: ["phase_empathie", "personas", "scenarios_usage"]
  },
  DESIGN_FOR_X: {
    name: "Design for X (DfX)",
    description: "Optimisation pour des critères spécifiques", 
    params: ["critere_principal", "contraintes_fabrication", "couts_target"]
  },
  VALUE_ENGINEERING: {
    name: "Value Engineering",
    description: "Optimisation valeur/fonction/coût",
    params: ["fonctions_principales", "budget_max", "rapport_valeur"]
  }
};

interface ProjectState {
  selected_generation_method?: string;
  selected_methodology?: string;
  methodology_params?: Record<string, any>;
  generated_prompt?: string;
  design_results?: any;
  step_file?: string;
  selected_design_index?: number;
  active_step?: string;
  uploaded_sketch?: string;
  uploaded_image?: string;
  user_prompt?: string;
}

export default function IdeationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // États principaux
  const [project, setProject] = useState<any>(null);
  const [selectedGenerationMethod, setSelectedGenerationMethod] = useState<string>("");
  const [selectedMethodology, setSelectedMethodology] = useState<string>("");
  const [methodologyParams, setMethodologyParams] = useState<Record<string, any>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [designResults, setDesignResults] = useState<any>(null);
  const [stepFile, setStepFile] = useState("");
  const [selectedDesignIndex, setSelectedDesignIndex] = useState<number | undefined>(undefined);
  const [activeStep, setActiveStep] = useState("method-selection");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // États pour les uploads et prompts utilisateur
  const [uploadedSketch, setUploadedSketch] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fonction pour charger l'état sauvegardé
  const loadProjectState = async () => {
    try {
      const { data, error } = await supabase
        .from('project_states')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading project state:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error loading project state:', error);
      return null;
    }
  };

  // Fonction pour sauvegarder l'état
  const saveProjectState = async (state: ProjectState) => {
    try {
      const { error } = await supabase
        .from('project_states')
        .upsert({
          project_id: projectId,
          ...state,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'project_id'
        });

      if (error) {
        console.error('Error saving project state:', error);
      }
    } catch (error) {
      console.error('Error saving project state:', error);
    }
  };

  // Charger les données du projet ET l'état sauvegardé
  useEffect(() => {
    const loadProjectAndState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Charger le projet
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        if (!projectData) throw new Error('Projet non trouvé');

        setProject(projectData);

        // Charger l'état sauvegardé
        const savedState = await loadProjectState();
        if (savedState) {
          console.log('📁 État précédent chargé:', savedState);
          
          if (savedState.selected_generation_method) {
            setSelectedGenerationMethod(savedState.selected_generation_method);
          }
          if (savedState.selected_methodology) {
            setSelectedMethodology(savedState.selected_methodology);
          }
          if (savedState.methodology_params) {
            setMethodologyParams(savedState.methodology_params);
          }
          if (savedState.generated_prompt) {
            setGeneratedPrompt(savedState.generated_prompt);
          }
          if (savedState.design_results) {
            setDesignResults(savedState.design_results);
          }
          if (savedState.step_file) {
            setStepFile(savedState.step_file);
          }
          if (savedState.selected_design_index !== undefined && savedState.selected_design_index !== null) {
            setSelectedDesignIndex(savedState.selected_design_index);
          }
          if (savedState.active_step) {
            setActiveStep(savedState.active_step);
          }
          if (savedState.uploaded_sketch) {
            setUploadedSketch(savedState.uploaded_sketch);
          }
          if (savedState.uploaded_image) {
            setUploadedImage(savedState.uploaded_image);
          }
          if (savedState.user_prompt) {
            setUserPrompt(savedState.user_prompt);
          }
        }

        // Déterminer l'étape active basée sur la progression
        determineActiveStep(projectData, savedState);

      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjectAndState();
  }, [projectId, router]);

  // Fonction pour déterminer l'étape active
  const determineActiveStep = (projectData: any, savedState: any) => {
    if (savedState?.active_step) {
      return;
    }

    if (projectData.progress >= 100) {
      setActiveStep('final-results');
    } else if (projectData.progress >= 75) {
      setActiveStep('design-selection');
    } else if (projectData.progress >= 50) {
      setActiveStep('prompt-review');
    } else if (projectData.progress >= 25) {
      setActiveStep('generation');
    } else if (projectData.progress > 0) {
      setActiveStep('parameters');
    } else if (savedState?.selected_generation_method) {
      setActiveStep('methodology');
    } else {
      setActiveStep('method-selection');
    }
  };

  // Sauvegarder l'état à chaque changement important
  useEffect(() => {
    if (!projectId) return;

    const state: ProjectState = {
      selected_generation_method: selectedGenerationMethod,
      selected_methodology: selectedMethodology,
      methodology_params: methodologyParams,
      generated_prompt: generatedPrompt,
      design_results: designResults,
      step_file: stepFile,
      selected_design_index: selectedDesignIndex,
      active_step: activeStep,
      uploaded_sketch: uploadedSketch,
      uploaded_image: uploadedImage,
      user_prompt: userPrompt
    };

    saveProjectState(state);
  }, [
    selectedGenerationMethod, selectedMethodology, methodologyParams, generatedPrompt, 
    designResults, stepFile, selectedDesignIndex, activeStep, uploadedSketch, 
    uploadedImage, userPrompt, projectId
  ]);

  // Gestion de l'upload de fichiers
  const handleFileUpload = async (file: File, type: 'sketch' | 'image') => {
    setUploadingFile(true);
    setError("");
    
    try {
      const reader = new FileReader();
      
      return new Promise<string>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64 = e.target?.result as string;
            
            if (type === 'sketch') {
              setUploadedSketch(base64);
            } else {
              setUploadedImage(base64);
            }
            
            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('❌ Erreur upload fichier:', error);
      setError(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return "";
    } finally {
      setUploadingFile(false);
    }
  };

  // ✅ GÉNÉRATION PROMPT AVEC MISTRAL (pour méthode PROMPT uniquement)
  const generatePromptOnly = async () => {
    if (!project || !selectedMethodology) return;

    setGenerating(true);
    setError("");
    
    try {
      console.log("🚀 Début génération prompt Mistral...");

      const promptResponse = await fetch('/api/ideation/generate-prompt', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          projectId: project.id,
          projectData: {
            name: project.name,
            description: project.description,
            domain: project.domain
          },
          methodology: selectedMethodology,
          methodologyParams: methodologyParams
        })
      });

      let responseData;
      try {
        responseData = await promptResponse.json();
      } catch (parseError) {
        console.error('❌ Erreur parsing réponse:', parseError);
        throw new Error(`Erreur de communication avec le serveur (${promptResponse.status})`);
      }

      if (!promptResponse.ok) {
        let errorMessage = `Erreur serveur (${promptResponse.status})`;
        if (responseData?.error) errorMessage = responseData.error;
        throw new Error(errorMessage);
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erreur lors de la génération du prompt');
      }
      
      if (responseData.prompt) {
        console.log("✅ Prompt Mistral généré avec succès");
        setGeneratedPrompt(responseData.prompt);
        setActiveStep('prompt-review');
        
        await supabase
          .from('projects')
          .update({
            progress: 50,
            status: 'in_progress',
            methodology: selectedMethodology,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      } else {
        throw new Error('Aucun prompt reçu du serveur');
      }
    } catch (error) {
      console.error('❌ Erreur génération prompt:', error);
      setError(`Impossible de générer le prompt: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setGenerating(false);
    }
  };

  // ✅ GÉNÉRATION DESIGNS AVEC VOTRE API EXISTANTE
  const generateDesigns = async () => {
    setGeneratingImages(true);
    setError("");
    
    try {
      console.log("🎨 Génération designs avec votre API...", {
        method: selectedGenerationMethod
      });

      let payload: any = {
        projectId: projectId
      };

      // Déterminer la méthode de génération et les données
      switch (selectedGenerationMethod) {
        case 'prompt':
          if (!generatedPrompt) {
            throw new Error('Veuillez d\'abord générer un prompt');
          }
          payload.generationMethod = 'sdxl';
          payload.prompt = generatedPrompt;
          payload.methodology = selectedMethodology;
          break;

        case 'sketch':
          if (!uploadedSketch) {
            throw new Error('Veuillez d\'abord uploader un sketch');
          }
          payload.generationMethod = 'controlnet';
          payload.sketch = uploadedSketch;
          // Combiner description utilisateur avec prompt de base
          const sketchPrompt = userPrompt 
            ? `${userPrompt}, professional industrial design, high quality, detailed product, realistic materials`
            : "professional industrial design, high quality, detailed product, realistic materials, technical drawing";
          payload.prompt = sketchPrompt;
          break;

        case 'image':
          if (!uploadedImage) {
            throw new Error('Veuillez d\'abord uploader une image');
          }
          payload.generationMethod = 'img2img';
          payload.image = uploadedImage;
          // Combiner description utilisateur avec prompt de base
          const imagePrompt = userPrompt 
            ? `${userPrompt}, professional product design variations, high quality, different styles`
            : "professional product design variations, high quality, different styles and colors";
          payload.prompt = imagePrompt;
          break;

        default:
          throw new Error('Méthode de génération non supportée');
      }

      console.log("📤 Envoi à generate-design:", {
        generationMethod: payload.generationMethod,
        hasPrompt: !!payload.prompt,
        promptLength: payload.prompt?.length
      });

      const designResponse = await fetch('/api/ideation/generate-design', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let responseData;
      try {
        responseData = await designResponse.json();
      } catch (parseError) {
        console.error('❌ Erreur parsing réponse design:', parseError);
        throw new Error(`Erreur de communication avec l'API (${designResponse.status})`);
      }

      if (!designResponse.ok) {
        let errorMessage = `Erreur génération (${designResponse.status})`;
        if (responseData?.error) errorMessage = responseData.error;
        throw new Error(errorMessage);
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erreur lors de la génération');
      }
      
      if (responseData.images && responseData.images.length > 0) {
        console.log("✅ Designs générés avec succès:", {
          imagesCount: responseData.images.length,
          source: responseData.source,
          model: responseData.model
        });
        
        setDesignResults(responseData);
        setActiveStep('design-selection');
        
        await supabase
          .from('projects')
          .update({
            progress: 75,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      } else {
        throw new Error('Aucun design reçu de l\'API');
      }
    } catch (error) {
      console.error('❌ Erreur génération designs:', error);
      setError(`Erreur lors de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setGeneratingImages(false);
    }
  };

  // ✅ GÉNÉRATION STEP AVEC VOTRE API EXISTANTE
  const generateStepFile = async () => {
    if (selectedDesignIndex === undefined || !designResults?.images?.[selectedDesignIndex]) return;

    setGeneratingStep(true);
    setError("");
    
    try {
      const selectedImageUrl = designResults.images[selectedDesignIndex];
      console.log("📁 Génération du fichier STEP avec votre API...");

      const stepResponse = await fetch('/api/ideation/generate-step', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId,
          prompt: generatedPrompt,
          designUrl: selectedImageUrl,
          selectedDesignIndex: selectedDesignIndex
        })
      });

      let responseData;
      try {
        responseData = await stepResponse.json();
      } catch (parseError) {
        console.error('❌ Erreur parsing réponse STEP:', parseError);
        throw new Error(`Erreur de communication avec le serveur (${stepResponse.status})`);
      }

      if (!stepResponse.ok) {
        let errorMessage = `Erreur génération STEP (${stepResponse.status})`;
        if (responseData?.error) errorMessage = responseData.error;
        throw new Error(errorMessage);
      }

      if (responseData.step_file) {
        console.log("✅ Fichier STEP généré avec succès");
        setStepFile(responseData.step_file);
        setActiveStep('final-results');
        
        await supabase
          .from('projects')
          .update({
            progress: 100,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      } else {
        throw new Error('Aucun fichier STEP reçu du serveur');
      }
    } catch (error) {
      console.error('❌ Erreur génération STEP:', error);
      setError(`Erreur lors de la génération du fichier STEP: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setGeneratingStep(false);
    }
  };

  // Gestion des paramètres de méthodologie
  const handleParamChange = (paramName: string, value: any) => {
    setMethodologyParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // Sélection d'un design
  const handleSelectDesign = (index: number) => {
    setSelectedDesignIndex(index);
  };

  // Fonction pour réinitialiser l'état
  const handleResetProject = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser ce projet ? Toute la progression sera perdue.")) {
      return;
    }

    try {
      await supabase
        .from('project_states')
        .delete()
        .eq('project_id', projectId);

      await supabase
        .from('projects')
        .update({
          progress: 0,
          status: 'draft',
          methodology: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      setSelectedGenerationMethod("");
      setSelectedMethodology("");
      setMethodologyParams({});
      setGeneratedPrompt("");
      setDesignResults(null);
      setStepFile("");
      setSelectedDesignIndex(undefined);
      setActiveStep("method-selection");
      setUploadedSketch("");
      setUploadedImage("");
      setUserPrompt("");

      router.refresh();
      alert('Projet réinitialisé avec succès');
    } catch (error) {
      console.error('Error resetting project:', error);
      alert('Erreur lors de la réinitialisation du projet');
    }
  };

  // ✅ CORRECTION : Fonction pour gérer la génération selon l'étape
  const handleGeneration = async () => {
    if (selectedGenerationMethod === 'prompt' && activeStep === 'generation') {
      // Pour la méthode PROMPT, on génère d'abord le prompt, puis les designs
      await generatePromptOnly();
    } else {
      // Pour SKETCH et IMAGE, on génère directement les designs
      await generateDesigns();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error && !generating && !generatingImages && !generatingStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
            <div className="text-red-600 text-2xl mb-2">❌</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => setError("")}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retour
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Tableau de bord
                </Link>
                <button
                  onClick={handleResetProject}
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-lg border border-red-200"
                  title="Réinitialiser le projet"
                >
                  🔄 Réinitialiser
                </button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Phase d'Idéation</h1>
              <p className="text-gray-600 mt-1">
                Projet: <span className="font-semibold">{project?.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Méthode: {selectedGenerationMethod ? GENERATION_METHODS[selectedGenerationMethod as keyof typeof GENERATION_METHODS]?.name : "Non sélectionnée"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Progression</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project?.progress || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{project?.progress || 0}%</div>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Étapes de progression */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { id: 'method-selection', label: 'Méthode', icon: '🚀' },
              { id: 'methodology', label: 'Méthodologie', icon: '🔧', condition: selectedGenerationMethod === 'prompt' },
              { id: 'parameters', label: 'Paramètres', icon: '⚙️', condition: selectedGenerationMethod === 'prompt' },
              { id: 'input', label: 'Entrée', icon: '📥', condition: ['sketch', 'image'].includes(selectedGenerationMethod) },
              { id: 'generation', label: 'Génération', icon: '🎨' },
              { id: 'prompt-review', label: 'Validation', icon: '👁️', condition: selectedGenerationMethod === 'prompt' },
              { id: 'design-selection', label: 'Designs', icon: '🖼️', condition: selectedGenerationMethod !== 'design_to_3d' },
              { id: 'final-results', label: 'Résultats', icon: '📊' }
            ].filter(step => step.condition === undefined || step.condition).map((step, index, filteredSteps) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    activeStep === step.id 
                      ? 'bg-indigo-600 text-white' 
                      : ['prompt-review', 'design-selection', 'final-results'].includes(step.id) && 
                        (generatedPrompt || designResults || stepFile)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  activeStep === step.id ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < filteredSteps.length - 1 && (
                  <div className="w-6 h-0.5 bg-gray-300 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Contenu selon l'étape active */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          
          {/* Étape Sélection de la Méthode */}
          {activeStep === 'method-selection' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Choisissez votre méthode de génération</h2>
              <p className="text-gray-600">
                Sélectionnez comment vous souhaitez générer votre design avec Mistral AI et SDXL
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(GENERATION_METHODS).map((method) => (
                  <div
                    key={method.id}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedGenerationMethod === method.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedGenerationMethod(method.id);
                      // Navigation selon la méthode
                      if (method.id === 'prompt') {
                        setActiveStep('methodology');
                      } else {
                        setActiveStep('input');
                      }
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{method.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{method.name}</h3>
                        <p className="text-gray-600 mt-2">{method.description}</p>
                        <div className="mt-3">
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                            {method.id === 'prompt' ? 'Mistral + SDXL' : 
                             method.id === 'sketch' ? 'SDXL + Sketch' :
                             method.id === 'image' ? 'SDXL Variations' : 'Mistral STEP'}
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedGenerationMethod === method.id 
                          ? 'bg-indigo-500 border-indigo-500 text-white' 
                          : 'border-gray-300'
                      }`}>
                        {selectedGenerationMethod === method.id && '✓'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape Méthodologie (uniquement pour PROMPT) */}
          {activeStep === 'methodology' && selectedGenerationMethod === 'prompt' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Choisissez votre méthodologie</h2>
              <p className="text-gray-600">
                Sélectionnez l'approche méthodologique qui correspond le mieux à votre projet
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(METHODOLOGIES).map(([key, method]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedMethodology === key
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethodology(key)}
                  >
                    <h3 className="font-semibold text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    <div className="flex items-center mt-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedMethodology === key 
                          ? 'bg-indigo-500 border-indigo-500' 
                          : 'border-gray-300'
                      }`}></div>
                      <span className="ml-2 text-sm text-gray-500">
                        {selectedMethodology === key ? 'Sélectionnée' : 'Sélectionner'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedMethodology && (
                <div className="flex justify-end pt-6 border-t">
                  <button
                    onClick={() => setActiveStep('parameters')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                  >
                    Continuer vers les paramètres
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Étape Paramètres (uniquement pour PROMPT) */}
          {activeStep === 'parameters' && selectedGenerationMethod === 'prompt' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Paramètres de la méthodologie</h2>
              <p className="text-gray-600">
                Configurez les paramètres spécifiques pour {METHODOLOGIES[selectedMethodology as keyof typeof METHODOLOGIES]?.name}
              </p>

              <div className="space-y-4">
                {METHODOLOGIES[selectedMethodology as keyof typeof METHODOLOGIES]?.params.map((param: string) => (
                  <div key={param} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {param.replace(/_/g, ' ').toUpperCase()}
                    </label>
                    <input
                      type="text"
                      value={methodologyParams[param] || ''}
                      onChange={(e) => handleParamChange(param, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Entrez la valeur pour ${param}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={() => setActiveStep('methodology')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Retour
                </button>
                <button
                  onClick={() => setActiveStep('generation')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  Continuer vers la génération
                </button>
              </div>
            </div>
          )}

          {/* Étape Entrée (pour SKETCH, IMAGE) */}
          {activeStep === 'input' && ['sketch', 'image'].includes(selectedGenerationMethod) && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedGenerationMethod === 'sketch' && 'Entrée : Sketch + Prompt optionnel'}
                {selectedGenerationMethod === 'image' && 'Entrée : Image + Prompt optionnel'}
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-blue-600 text-3xl mb-4">
                    {selectedGenerationMethod === 'sketch' && '✏️'}
                    {selectedGenerationMethod === 'image' && '🖼️'}
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {selectedGenerationMethod === 'sketch' && 'Upload de votre esquisse'}
                    {selectedGenerationMethod === 'image' && 'Upload de votre image'}
                  </h3>
                  <p className="text-blue-800">
                    {selectedGenerationMethod === 'sketch' && 'SDXL utilisera votre esquisse comme référence. Ajoutez un prompt optionnel pour guider la génération.'}
                    {selectedGenerationMethod === 'image' && 'SDXL créera des variations de votre image. Ajoutez un prompt optionnel pour guider les variations.'}
                  </p>
                </div>
              </div>

              {/* Prompt optionnel */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Prompt optionnel (pour guider la génération)
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Description optionnelle pour ${selectedGenerationMethod === 'sketch' ? 'guider la transformation' : 'guider les variations'}`}
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  Ce prompt est optionnel mais peut améliorer les résultats
                </p>
              </div>

              {/* Upload de fichier */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handleFileUpload(file, selectedGenerationMethod as 'sketch' | 'image');
                    }
                  }}
                />
                
                {(!uploadedSketch && !uploadedImage) ? (
                  <div className="space-y-4">
                    <div className="text-gray-400 text-4xl">
                      {selectedGenerationMethod === 'sketch' ? '✏️' : '📁'}
                    </div>
                    <div>
                      <p className="text-gray-600 mb-2">
                        Glissez-déposez votre fichier ou cliquez pour parcourir
                      </p>
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 cursor-pointer font-medium"
                      >
                        {uploadingFile ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Upload en cours...</span>
                          </div>
                        ) : (
                          `Choisir un fichier ${selectedGenerationMethod === 'sketch' ? 'PNG/JPG' : 'Image'}`
                        )}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, JPEG jusqu'à 10MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-green-600 text-4xl">✅</div>
                    <div>
                      <p className="text-gray-600 mb-2">Fichier uploadé avec succès !</p>
                      <div className="max-w-xs mx-auto">
                        <img 
                          src={selectedGenerationMethod === 'sketch' ? uploadedSketch : uploadedImage} 
                          alt="Preview"
                          className="w-full h-32 object-contain border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => {
                          if (selectedGenerationMethod === 'sketch') {
                            setUploadedSketch("");
                          } else {
                            setUploadedImage("");
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Changer
                      </button>
                      <button
                        onClick={() => setActiveStep('generation')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Continuer vers la génération
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={() => setActiveStep('method-selection')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  ← Retour
                </button>
              </div>
            </div>
          )}

          {/* Étape Génération (commune à toutes les méthodes) */}
          {activeStep === 'generation' && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedGenerationMethod === 'prompt' && 'Génération du Design'}
                {selectedGenerationMethod === 'sketch' && 'Transformation Sketch → Design'}
                {selectedGenerationMethod === 'image' && 'Génération de Variations'}
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                <div className="text-blue-600 text-2xl mb-2">
                  {selectedGenerationMethod === 'prompt' && '🤖'}
                  {selectedGenerationMethod === 'sketch' && '✏️'}
                  {selectedGenerationMethod === 'image' && '🖼️'}
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  {selectedGenerationMethod === 'prompt' && 'Génération avec Mistral + SDXL'}
                  {selectedGenerationMethod === 'sketch' && 'Transformation avec SDXL'}
                  {selectedGenerationMethod === 'image' && 'Variations avec SDXL'}
                </h3>
                <p className="text-blue-800 text-sm">
                  {selectedGenerationMethod === 'prompt' && 'Mistral génère le prompt optimisé, puis SDXL crée les designs.'}
                  {selectedGenerationMethod === 'sketch' && 'SDXL utilise votre esquisse comme référence pour générer un design réaliste.'}
                  {selectedGenerationMethod === 'image' && 'SDXL crée des variations stylistiques basées sur votre image.'}
                </p>
              </div>

              {/* ✅ CORRECTION : Bouton avec fonction unifiée - COMMENTAIRE DÉPLACÉ */}
              <button
                onClick={handleGeneration}
                disabled={generating || generatingImages}
                className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {generating || generatingImages ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {selectedGenerationMethod === 'prompt' && 'Génération du prompt avec Mistral...'}
                      {selectedGenerationMethod !== 'prompt' && 'Génération avec SDXL...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🚀</span>
                    <span>
                      {selectedGenerationMethod === 'prompt' && 'Générer le Design'}
                      {selectedGenerationMethod === 'sketch' && 'Transformer avec SDXL'}
                      {selectedGenerationMethod === 'image' && 'Générer les Variations'}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Étape Validation du Prompt (uniquement pour PROMPT) */}
          {activeStep === 'prompt-review' && selectedGenerationMethod === 'prompt' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Prompt Généré</h2>
              <p className="text-gray-600">
                Voici le prompt généré par Mistral. Vous pouvez le modifier si nécessaire avant de générer les designs.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Prompt généré..."
                />
                <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                  <span>{generatedPrompt.length} caractères</span>
                  <span>Méthodologie: {METHODOLOGIES[selectedMethodology as keyof typeof METHODOLOGIES]?.name}</span>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={() => setActiveStep('parameters')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  ← Retour
                </button>
                <button
                  onClick={generateDesigns}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  Générer les Designs
                </button>
              </div>
            </div>
          )}

          {/* Étape Sélection du Design */}
          {activeStep === 'design-selection' && designResults && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Sélectionnez votre design préféré</h2>
              <p className="text-gray-600">
                Choisissez le design que vous souhaitez convertir en modèle 3D
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {designResults.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedDesignIndex === index
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectDesign(index)}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={image}
                        alt={`Design ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Design {index + 1}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedDesignIndex === index
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedDesignIndex === index && '✓'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDesignIndex !== undefined && (
                <div className="flex justify-end pt-6 border-t">
                  <button
                    onClick={generateStepFile}
                    disabled={generatingStep}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {generatingStep ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Génération du fichier STEP...</span>
                      </div>
                    ) : (
                      'Générer le fichier STEP'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Étape Résultats Finaux */}
          {activeStep === 'final-results' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Résultats Finaux</h2>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-green-600 text-4xl mb-4">🎉</div>
                  <h3 className="font-semibold text-green-900 text-lg mb-2">
                    Projet terminé avec succès !
                  </h3>
                  <p className="text-green-800">
                    Votre design a été généré et converti en modèle 3D.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Design sélectionné */}
                {selectedDesignIndex !== undefined && designResults?.images?.[selectedDesignIndex] && (
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Design Final</h3>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={designResults.images[selectedDesignIndex]}
                        alt="Design final"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Fichier STEP */}
                {stepFile && (
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Fichier STEP</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-4xl mb-4">📦</div>
                      <p className="text-gray-700 mb-4">
                        Votre modèle 3D au format STEP est prêt à être téléchargé.
                      </p>
                      <a
                        href={stepFile}
                        download="design-3d-model.step"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                      >
                        📥 Télécharger le fichier STEP
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Retour au tableau de bord
                </Link>
                <button
                  onClick={handleResetProject}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
                >
                  Recommencer un nouveau projet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}