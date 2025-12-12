// lib/ai.ts - Version complète avec Agent Q et Workflow DFA-IA
/**
 * WORKFLOW COMPLET DFA-IA
 * 
 * ASCII Visualization:
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │                              WORKFLOW COMPLET DFA-IA                                │
 * ├─────────────────────────────────────────────────────────────────────────────────────┤
 * │                                                                                     │
 * │  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐         │
 * │  │    INPUT USER   │        │     MISTRAL     │        │   MÉTHODOLOGIE  │         │
 * │  │  [TEXTE/SKETCH/ │───────▶│       AI        │───────▶│  [TRIZ/DFX/DT/  │         │
 * │  │     IMAGE]      │        │  (Prompt Eng.)  │        │    VALUE ENG.]  │         │
 * │  └─────────────────┘        └─────────────────┘        └─────────────────┘         │
 * │                                      │                                               │
 * │                                      ▼                                               │
 * │                         ┌─────────────────────────────┐                             │
 * │                         │        PROMPT FINAL         │                             │
 * │                         └─────────────────────────────┘                             │
 * │                                      │                                               │
 * │                                      ▼                                               │
 * │  ┌─────────────────────────────────────────────────────────────────────────────┐    │
 * │  │                    PHASE 2: GÉNÉRATION DES DESIGNS                         │    │
 * │  ├─────────────────────────────────────────────────────────────────────────────┤    │
 * │  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐          │    │
 * │  │  │   STABLE     │    │   CONTROLNET │    │        IMG2IMG       │          │    │
 * │  │  │  DIFFUSION   │    │   (Sketch)   │    │   (Image variations) │          │    │
 * │  │  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘          │    │
 * │  │         └───────────────────┼───────────────────────┘                      │    │
 * │  │                     ┌───────▼───────┐                                      │    │
 * │  │                     │  4 CONCEPTS   │                                      │    │
 * │  │                     └───────┬───────┘                                      │    │
 * │  └─────────────────────────────┼─────────────────────────────────────────────┘    │
 * │                                ▼                                                    │
 * │                    PHASE 3: ÉVALUATION (Agent Q / R.E.A.L)                          │
 * │                                ▼                                                    │
 * │                    PHASE 4: PRODUCTION (STEP / ISO 10303)                           │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 */

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HF_API_TOKEN = process.env.HF_API_TOKEN;

// Configuration des modèles de génération
const MODEL_CONFIG = {
  SD: {
    primary: "stabilityai/stable-diffusion-xl-base-1.0",
    fallbacks: [
      "runwayml/stable-diffusion-v1-5",
      "stabilityai/stable-diffusion-2-1"
    ]
  },
  CONTROLNET: {
    primary: "lllyasviel/sd-controlnet-scribble",
    fallbacks: [
      "lllyasviel/sd-controlnet-canny",
      "lllyasviel/sd-controlnet-openpose"
    ]
  },
  IMG2IMG: {
    primary: "black-forest-labs/FLUX.1-dev",
    fallbacks: [
      "runwayml/stable-diffusion-v1-5",
      "stabilityai/stable-diffusion-xl-base-1.0"
    ]
  }
};

// Types pour Agent Q
export interface AgentQEvaluation {
  overall_score: number;
  category_scores: {
    aesthetic: number;
    functional: number;
    innovative: number;
    manufacturable: number;
    ergonomic: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: {
    quick_fixes: string[];
    redesign_ideas: string[];
    material_suggestions: string[];
  };
  expert_opinion: string;
  recommendation: 'validate' | 'iterate' | 'reject';
}

export interface DesignGenerationResult {
  images: string[];
  source: string;
  model: string;
  used_fallback: boolean;
  fallback_reason?: string;
  model_attempts: string[];
}

// Types pour R.E.A.L. Simulation
export interface REALSimulation {
  fea_analysis: {
    stress_points: Array<{ location: string; value: number; unit: string }>;
    safety_factor: number;
    deformation: number;
    critical_points: string[];
  };
  dfm_analysis: {
    manufacturability_score: number;
    estimated_cost: number;
    recommended_material: string;
    production_time: number;
    complexity_score: number;
  };
  optimization_suggestions: Array<{
    type: 'material' | 'structure' | 'cost' | 'manufacturing';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    estimated_saving?: number;
  }>;
}

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // ========== PHASE 2 : GÉNÉRATION (Stable Diffusion / ControlNet) ==========

  async generateDesignCandidates(
    method: 'sdxl' | 'controlnet' | 'img2img' | 'prompt',
    prompt: string,
    imageInput?: string
  ): Promise<DesignGenerationResult> {
    console.log(`🎨 Lancement Phase 2: Génération (${method})...`);

    // Vérification configuration
    if (!HF_API_TOKEN) {
      console.error('⚠️ HF_API_TOKEN manquant.');
      // On retourne une erreur explicite pour que le frontend puisse l'afficher
      // au lieu de retourner des images de fallback silencieusement
      throw new Error("Token Hugging Face manquant (HF_API_TOKEN). Veuillez le configurer dans .env.local");
    }

    try {
      switch (method) {
        case 'sdxl':
        case 'prompt':
          return await this.generateWithStableDiffusion(prompt);
        case 'controlnet':
          if (!imageInput) throw new Error('Sketch requis pour ControlNet');
          return await this.generateWithControlNet(imageInput, prompt);
        case 'img2img':
          if (!imageInput) throw new Error('Image requise pour Img2Img');
          return await this.generateWithImg2Img(imageInput, prompt);
        default:
          throw new Error('Méthode de génération non supportée');
      }
    } catch (error: any) {
      console.error('❌ Erreur critique génération Phase 2:', error);
      const fallbackImages = await this.generateRealisticFallbackImages(prompt || 'design');
      return {
        images: fallbackImages,
        source: 'local-fallback-error',
        model: 'demo-generator',
        used_fallback: true,
        fallback_reason: error.message,
        model_attempts: []
      };
    }
  }

  private async generateWithStableDiffusion(prompt: string): Promise<DesignGenerationResult> {
    const modelsToTry = [MODEL_CONFIG.SD.primary, ...MODEL_CONFIG.SD.fallbacks];
    const modelAttempts: string[] = [];

    for (const modelId of modelsToTry) {
      // Retry loop pour le chargement du modèle (cold start)
      let attempts = 0;
      const MAX_RETRIES = 3;

      while (attempts < MAX_RETRIES) {
        try {
          if (attempts > 0) console.log(`🔄 Tentative ${attempts + 1}/${MAX_RETRIES} pour ${modelId}...`);

          const payload = {
            inputs: prompt,
            parameters: {
              // Ajustement dynamique résolution (SDXL=1024, SD1.5=512)
              num_inference_steps: (modelId.toLowerCase().includes('xl') || modelId.includes('FLUX')) ? 30 : 25,
              guidance_scale: 7.5,
              width: (modelId.toLowerCase().includes('xl') || modelId.includes('FLUX')) ? 1024 : 512,
              height: (modelId.toLowerCase().includes('xl') || modelId.includes('FLUX')) ? 1024 : 512
            }
          };

          // 1. Premier appel (validation)
          const result1 = await this.generateWithHuggingFace(modelId, payload, { wait_for_model: true });

          // 2. Appels supplémentaires en parallèle pour la variété (4 images au total)
          const extraCalls = [1, 2, 3].map(() => this.generateWithHuggingFace(modelId, payload, { wait_for_model: true }));
          const extraResults = await Promise.all(extraCalls);

          // 3. Conversion et agrégation
          const allBlobs = [result1.imageBlob, ...extraResults.map(r => r.imageBlob)];
          const toBase64 = async (b: Blob) => {
            const buf = await b.arrayBuffer();
            return `data:${b.type};base64,${Buffer.from(buf).toString('base64')}`;
          };
          const images = await Promise.all(allBlobs.map(toBase64));

          return {
            images,
            source: 'huggingface',
            model: result1.modelUsed,
            used_fallback: false,
            model_attempts: modelAttempts
          };

        } catch (e: any) {
          console.log(`❌ Erreur ${modelId} (Tentative ${attempts + 1}):`, e.message);

          // Erreur d'accès (Gated Repo ou Token invalide)
          if (e.message.includes('401') || e.message.includes('403')) {
            // On ne fallback PAS pour une erreur d'auth, l'utilisateur doit corriger son token/accès
            throw new Error(
              `Accès REFUSÉ au modèle ${modelId} (Erreur 403/401). \n` +
              `1. Vérifiez que votre TOKEN HF est correct dans .env.local.\n` +
              `2. Si vous utilisez SDXL/FLUX, acceptez les conditions sur huggingface.co`
            );
          }

          // Gestion spécifique du chargement de modèle (503)
          if (e.message.includes('loading') || e.message.includes('503')) {
            const waitTimeMatch = e.message.match(/estimated_time":\s*([\d.]+)/);
            const waitTime = waitTimeMatch ? parseFloat(waitTimeMatch[1]) : 20;

            console.log(`⏳ Modèle en chargement, attente de ${waitTime}s...`);
            await new Promise(resolve => setTimeout(resolve, (waitTime * 1000) + 2000));
            attempts++;
            continue;
          }

          // Pour les autres erreurs, on passe au modèle suivant
          break;
        }
      }
      modelAttempts.push(modelId);
    }

    const fallbackImages = await this.generateRealisticFallbackImages(prompt);
    return {
      images: fallbackImages,
      source: 'local-fallback',
      model: 'demo-generator',
      used_fallback: true,
      fallback_reason: 'Tous les modèles SD ont échoué',
      model_attempts: modelAttempts
    };
  }

  private async generateWithControlNet(sketch: string, prompt: string): Promise<DesignGenerationResult> {
    const cleanedSketch = sketch.replace(/^data:image\/\w+;base64,/, "");
    const controlnetPrompt = prompt || "professional industrial design";
    const modelsToTry = [MODEL_CONFIG.CONTROLNET.primary, ...MODEL_CONFIG.CONTROLNET.fallbacks];
    const modelAttempts: string[] = [];

    for (const modelId of modelsToTry) {
      try {
        modelAttempts.push(modelId);
        if (!(await this.testModelAccessibility(modelId)).accessible) continue;

        const payload = {
          inputs: { image: `data:image/png;base64,${cleanedSketch}`, prompt: controlnetPrompt },
          parameters: { num_inference_steps: 20, guidance_scale: 7.5, width: 512, height: 512 }
        };

        const result = await this.generateWithHuggingFace(modelId, payload, { wait_for_model: true });
        const images = await this.convertBlobToBase64Array(result.imageBlob, 4);

        return {
          images,
          source: 'huggingface-controlnet',
          model: result.modelUsed,
          used_fallback: false,
          model_attempts: modelAttempts
        };
      } catch (e) { console.log(`❌ Échec ${modelId}`); }
    }

    // Fallback vers SD si ControlNet échoue
    console.log('🔄 Fallback ControlNet -> SD');
    const sdResult = await this.generateWithStableDiffusion(controlnetPrompt);
    sdResult.fallback_reason = 'ControlNet échoué, fallback sur SD';
    return sdResult;
  }

  private async generateWithImg2Img(image: string, prompt: string): Promise<DesignGenerationResult> {
    const cleanedImage = image.replace(/^data:image\/\w+;base64,/, "");
    const img2imgPrompt = prompt || "professional product design variations";
    const modelsToTry = [MODEL_CONFIG.IMG2IMG.primary, ...MODEL_CONFIG.IMG2IMG.fallbacks];
    const modelAttempts: string[] = [];

    for (const modelId of modelsToTry) {
      try {
        modelAttempts.push(modelId);
        if (!(await this.testModelAccessibility(modelId)).accessible) continue;

        // FLUX et SDXL préfèrent 1024x1024
        const isFluxOrSDXL = modelId.includes('FLUX') || modelId.includes('xl');
        const size = isFluxOrSDXL ? 1024 : 512;

        const payload = {
          inputs: {
            image: `data:image/png;base64,${cleanedImage}`,
            prompt: img2imgPrompt
          },
          parameters: {
            num_inference_steps: isFluxOrSDXL ? 30 : 25,
            strength: 0.8,
            guidance_scale: 7.5,
            width: size,
            height: size
          }
        };

        const result = await this.generateWithHuggingFace(modelId, payload, { wait_for_model: true });
        const images = await this.convertBlobToBase64Array(result.imageBlob, 4);

        return {
          images,
          source: 'huggingface-img2img',
          model: result.modelUsed,
          used_fallback: false,
          model_attempts: modelAttempts
        };
      } catch (e) { console.log(`❌ Échec ${modelId}`); }
    }

    // Fallback
    return await this.generateWithStableDiffusion(img2imgPrompt);
  }

  private async testModelAccessibility(modelId: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      // 1. Vérification du Token
      const whoami = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { 'Authorization': `Bearer ${HF_API_TOKEN}` }
      });

      if (!whoami.ok) {
        const err = await whoami.text();
        console.error(`❌ HF_API_TOKEN invalide (${whoami.status}): ${err}`);
        return { accessible: false, error: `Token invalide: ${err}` };
      }

      const user = await whoami.json();
      console.log(`👤 HF User: ${user.name} (Token valide)`);

      // 2. Vérification du Modèle (via Router)
      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${modelId}`, {
        method: 'HEAD', // HEAD est plus léger pour vérifier l'existence
        headers: { 'Authorization': `Bearer ${HF_API_TOKEN}` }
      });

      if (!response.ok) {
        console.warn(`⚠️ Modèle ${modelId} inaccessible sur Router (${response.status})`);
      }

      // Note: Router renvoie parfois 404/503 même si le modèle existe (cold boot).
      // On considère accessible si Token OK pour tenter le chargement.
      return { accessible: true }; // On force true si le token est bon pour laisser la boucle de retry faire son travail
    } catch (e: any) {
      console.error('Erreur test accessibilité:', e.message);
      return { accessible: false, error: e.message };
    }
  }

  private async generateWithHuggingFace(modelId: string, payload: any, options: { wait_for_model?: boolean } = {}) {
    const url = `https://router.huggingface.co/hf-inference/models/${modelId}` + (options.wait_for_model ? '?wait_for_model=true' : '');

    console.log(`📡 Appel HF (${modelId}) -> ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get('content-type');
    console.log(`📩 Réponse HF: Status ${response.status}, Type: ${contentType}`);

    if (contentType?.includes('application/json')) {
      const errorJson = await response.json();
      console.error('❌ Erreur API HF JSON:', errorJson);
      throw new Error(`Erreur HF: ${errorJson.error || JSON.stringify(errorJson)}`);
    }

    if (!response.ok) {
      throw new Error(`Erreur HF ${response.status}: ${await response.text()}`);
    }

    const imageBlob = await response.blob();
    console.log(`📦 Image reçue: ${imageBlob.type}, taille: ${imageBlob.size} octets`);

    if (!imageBlob.type.startsWith('image/')) {
      throw new Error(`Type de réponse invalide: ${imageBlob.type}`);
    }

    return { imageBlob, modelUsed: modelId };
  }

  private async convertBlobToBase64Array(blob: Blob, count: number): Promise<string[]> {
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const url = `data:image/jpeg;base64,${base64}`;
    return Array(count).fill(url);
  }

  private async generateRealisticFallbackImages(prompt: string, count: number = 4): Promise<string[]> {
    return [
      'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop',
      'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop',
      'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop',
      'https://images.unsplash.com/photo-1581094794321-8410e6f0e61d?w=512&h=512&fit=crop'
    ].slice(0, count);
  }

  // ========== PHASE 1 & 3 & 4 : PROMPTS & EVALUATION & STEP (EXISTANT) ==========


  async generateProfessionalPrompt(
    projectData: any,
    methodology: string,
    methodologyParams: Record<string, any>
  ): Promise<string> {
    try {
      console.log('🤖 Génération prompt Mistral...');

      if (!MISTRAL_API_KEY) {
        throw new Error("Clé API Mistral manquante (MISTRAL_API_KEY). Veuillez la configurer dans .env.local");
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: 'Expert en conception industrielle et génération de prompts'
            },
            {
              role: 'user',
              content: `Agis comme un expert en Prompt Engineering pour Stable Diffusion.
              
              TACHE: Créer un prompt d'image hautement détaillé et artistique pour ce projet:
              
              CONTEXTE PROJET:
              - Nom: "${projectData.name}"
              - Domaine: ${projectData.domain}
              - Description Utilisateur (Input): "${projectData.description}"
              
              MÉTHODOLOGIE APPLIQUÉE (${methodology}):
              - Paramètres: ${JSON.stringify(methodologyParams)}
              
              INSTRUCTIONS:
              1. ANALYSE l'input utilisateur et combine-le avec les principes de la méthodologie ${methodology}.
              2. CRÉE un prompt unique, long et descriptif (anglais) pour Stable Diffusion v1.5.
              3. INCLUS des détails sur: les formes, les matériaux, l'éclairage, le style (photoréaliste, 8k, unreal engine 5), et la vue caméra.
              4. INTÈGRE subtilement les contraintes de la méthodologie dans le design visuel.
              
              FORMAT DE SORTIE:
              Uniquement le texte du prompt en anglais, sans introduction ni guillemets.`
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Erreur Mistral, fallback local:', response.status);
        return this.generateFallbackPrompt(projectData, methodology, methodologyParams);
      }

      const data = await response.json();
      const generatedPrompt = data.choices?.[0]?.message?.content;

      if (!generatedPrompt) {
        throw new Error('Aucun contenu dans la réponse Mistral');
      }

      console.log('✅ Prompt Mistral généré');
      return generatedPrompt;

    } catch (err) {
      console.error('❌ Erreur génération prompt Mistral:', err);
      return this.generateFallbackPrompt(projectData, methodology, methodologyParams);
    }
  }

  async generateSTEPFileWithAI(
    prompt: string,
    designIndex: number,
    designUrl?: string
  ): Promise<string> {
    try {
      console.log('📁 Génération fichier STEP Mistral...');

      if (!MISTRAL_API_KEY || MISTRAL_API_KEY === "LYhnS109jMADgCYbTaTdIJKUakrMqE7R") {
        return this.generateFallbackSTEP(prompt, designIndex);
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: `Expert en CAO et fichiers STEP. Génère un contenu STEP valide pour des conceptions industrielles.`
            },
            {
              role: 'user',
              content: `Génère un fichier STEP basique pour: ${prompt}
              Format: ISO-10303-21;
              Entité: produit_conception_${designIndex + 1};
              Retourne UNIQUEMENT le contenu STEP sans commentaires.`
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur Mistral API: ${response.status}`);
      }

      const data = await response.json();
      const stepContent = data.choices[0].message.content;

      const base64Content = Buffer.from(stepContent).toString('base64');
      return `data:text/plain;base64,${base64Content}`;

    } catch (error) {
      console.error('❌ Erreur génération STEP Mistral:', error);
      return this.generateFallbackSTEP(prompt, designIndex);
    }
  }

  // ========== AGENT Q ==========

  /**
   * AGENT Q - Évaluation experte de la qualité perçue
   */
  async evaluateDesignWithAgentQ(
    designUrl: string,
    originalPrompt: string,
    methodology: string,
    projectType?: string
  ): Promise<AgentQEvaluation> {
    try {
      console.log('🤖 Agent Q - Évaluation du design...');

      // Analyse visuelle basique (sans API tierce pour le moment)
      const visualAnalysis = await this.analyzeDesignImageBasic(designUrl);

      // Générer l'évaluation avec Mistral
      const evaluationPrompt = `
        Vous êtes Agent Q, expert senior en design industriel avec 20 ans d'expérience.
        
        ÉVALUATION DU DESIGN:
        - Type de projet: ${projectType || 'Produit industriel'}
        - Méthodologie utilisée: ${methodology}
        - Brief original: "${originalPrompt}"
        - Caractéristiques visuelles détectées: ${visualAnalysis}
        
        INSTRUCTIONS:
        1. Évaluez le design sur 5 critères (0-10): 
           - Esthétique: beauté, proportions, équilibre
           - Fonctionnel: adéquation au besoin, praticité
           - Innovant: originalité, valeur ajoutée
           - Fabricable: simplicité de production
           - Ergonomique: confort, facilité d'utilisation
        
        2. Identifiez 3-4 points forts
        3. Identifiez 3-4 points faibles
        4. Proposez des améliorations (correctifs rapides, redesigns, suggestions matériaux)
        5. Donnez une recommandation finale: validate, iterate, ou reject
        
        FORMAT DE RÉPONSE STRICT (JSON uniquement):
        {
          "overall_score": number entre 0 et 10,
          "category_scores": {
            "aesthetic": number,
            "functional": number,
            "innovative": number,
            "manufacturable": number,
            "ergonomic": number
          },
          "strengths": ["point 1", "point 2", "point 3"],
          "weaknesses": ["point 1", "point 2", "point 3"],
          "suggestions": {
            "quick_fixes": ["suggestion 1", "suggestion 2"],
            "redesign_ideas": ["idée 1", "idée 2"],
            "material_suggestions": ["matériau 1", "matériau 2"]
          },
          "expert_opinion": "Analyse détaillée de 2-3 phrases",
          "recommendation": "validate|iterate|reject"
        }
        
        IMPORTANT: Répondez UNIQUEMENT en JSON, sans texte supplémentaire.
      `;

      const response = await this.callMistralAPI(evaluationPrompt);

      try {
        const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const evaluation = JSON.parse(cleanedResponse);
        console.log('✅ Évaluation Agent Q générée:', evaluation.overall_score);
        return evaluation;
      } catch (parseError) {
        console.error('❌ Erreur parsing Agent Q:', parseError);
        return this.generateFallbackEvaluation(originalPrompt, methodology);
      }

    } catch (error) {
      console.error('❌ Erreur Agent Q:', error);
      return this.generateFallbackEvaluation(originalPrompt, methodology);
    }
  }

  /**
   * Analyse d'image basique (version simple)
   */
  private async analyzeDesignImageBasic(imageUrl: string): Promise<string> {
    try {
      // Version simplifiée - nous analysons juste l'URL
      // En production, nous utilisons Replicate API avec BLIP-2
      if (REPLICATE_API_TOKEN) {
        console.log('🤖 Lancement analyse visuelle avec Replicate...');
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: "4b32258c42da7d4cfb94245c9ff2545a48a7cc2081ce168896167f218ca959d9", // blip-2 version
            input: { image: imageUrl, caption: true }
          })
        });

        if (!response.ok) {
          console.error('Erreur API Replicate:', await response.text());
          throw new Error(`Replicate API error: ${response.status}`);
        }

        let prediction = await response.json();

        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const pollResponse = await fetch(prediction.urls.get, {
            headers: {
              'Authorization': `Token ${REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          prediction = await pollResponse.json();
        }

        if (prediction.status === 'failed') {
          console.error('Analyse Replicate échouée:', prediction.error);
          throw new Error('Replicate analysis failed');
        }

        console.log('✅ Analyse visuelle Replicate terminée.');
        return prediction.output;
      }

      // Fallback: description générique basée sur le type d'URL
      if (imageUrl.includes('unsplash')) {
        return "Image de démonstration professionnelle, design industriel, rendu 3D de qualité";
      }

      return "Image de conception produit, design technique, rendu réaliste";

    } catch (error) {
      return "Design produit visuellement analysé";
    }
  }

  // ========== BOUCLE R.E.A.L. ==========

  /**
   * Simulation R.E.A.L. (FEA/DFM)
   */
  async simulateREALAnalysis(
    designUrl: string,
    designIndex: number,
    projectType: string,
    methodology: string
  ): Promise<REALSimulation> {
    try {
      console.log('⚙️ Simulation R.E.A.L. en cours...');

      // Simulation basique basée sur le type de projet
      const simulation = this.generateBasicSimulation(projectType, methodology);

      // Amélioration avec IA si disponible
      if (MISTRAL_API_KEY && MISTRAL_API_KEY !== "LYhnS109jMADgCYbTaTdIJKUakrMqE7R") {
        const enhancedSimulation = await this.enhanceSimulationWithAI(
          simulation,
          projectType,
          methodology
        );
        return enhancedSimulation;
      }

      return simulation;

    } catch (error) {
      console.error('❌ Erreur simulation R.E.A.L.:', error);
      return this.generateBasicSimulation(projectType, methodology);
    }
  }

  /**
   * Génère une simulation basique basée sur le type de projet
   */
  private generateBasicSimulation(
    projectType: string,
    methodology: string
  ): REALSimulation {
    // Données factices basées sur le type de projet
    const projectTypeData = {
      'meuble': {
        manufacturability: 85,
        cost: 150,
        material: 'Bois massif ou contreplaqué',
        time: 8,
        stressPoints: 2
      },
      'produit electronique': {
        manufacturability: 75,
        cost: 250,
        material: 'Plastique ABS avec finition métal',
        time: 12,
        stressPoints: 4
      },
      'outillage': {
        manufacturability: 90,
        cost: 80,
        material: 'Acier trempé',
        time: 6,
        stressPoints: 3
      },
      'dispositif medical': {
        manufacturability: 70,
        cost: 350,
        material: 'Polycarbonate médical',
        time: 15,
        stressPoints: 5
      },
      'automobile': {
        manufacturability: 65,
        cost: 1200,
        material: 'Alliage aluminium',
        time: 20,
        stressPoints: 8
      }
    };

    const defaults = {
      manufacturability: 80,
      cost: 200,
      material: 'Matériau standard',
      time: 10,
      stressPoints: 3
    };

    const data = projectTypeData[projectType.toLowerCase() as keyof typeof projectTypeData] || defaults;

    return {
      fea_analysis: {
        stress_points: [
          { location: 'Point de fixation principal', value: 45, unit: 'MPa' },
          { location: 'Zone de charge maximale', value: 62, unit: 'MPa' },
          { location: 'Jointure structurelle', value: 38, unit: 'MPa' }
        ].slice(0, data.stressPoints),
        safety_factor: 2.5 + Math.random() * 1.5,
        deformation: 0.5 + Math.random() * 2,
        critical_points: ['Zone de contrainte maximale', 'Point de fatigue potentiel']
      },
      dfm_analysis: {
        manufacturability_score: data.manufacturability,
        estimated_cost: data.cost,
        recommended_material: data.material,
        production_time: data.time,
        complexity_score: 100 - data.manufacturability
      },
      optimization_suggestions: [
        {
          type: 'material',
          suggestion: `Envisager ${data.material} pour équilibrer coût et performance`,
          impact: 'medium',
          estimated_saving: data.cost * 0.15
        },
        {
          type: 'structure',
          suggestion: 'Ajouter des nervures de renforcement dans les zones de contrainte',
          impact: 'high',
          estimated_saving: data.cost * 0.10
        },
        {
          type: 'manufacturing',
          suggestion: 'Simplifier les formes pour réduire le temps d\'usinage',
          impact: 'medium',
          estimated_saving: data.time * 0.2
        }
      ]
    };
  }

  /**
   * Améliore la simulation avec IA
   */
  private async enhanceSimulationWithAI(
    baseSimulation: REALSimulation,
    projectType: string,
    methodology: string
  ): Promise<REALSimulation> {
    try {
      const prompt = `
        En tant qu'expert en simulation FEA et DFM, analysez ces résultats et proposez des optimisations:
        
        Projet: ${projectType}
        Méthodologie: ${methodology}
        
        Résultats actuels:
        - Score fabricabilité: ${baseSimulation.dfm_analysis.manufacturability_score}/100
        - Coût estimé: ${baseSimulation.dfm_analysis.estimated_cost}€
        - Matériau recommandé: ${baseSimulation.dfm_analysis.recommended_material}
        - Facteur de sécurité: ${baseSimulation.fea_analysis.safety_factor}
        
        Proposez 2-3 optimisations supplémentaires spécifiques au projet.
        Répondez en JSON avec ce format:
        {
          "additional_suggestions": [
            {
              "type": "material|structure|cost|manufacturing",
              "suggestion": "description",
              "impact": "high|medium|low",
              "estimated_saving": number
            }
          ]
        }
      `;

      const response = await this.callMistralAPI(prompt);
      const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiEnhancement = JSON.parse(cleanedResponse);

      return {
        ...baseSimulation,
        optimization_suggestions: [
          ...baseSimulation.optimization_suggestions,
          ...aiEnhancement.additional_suggestions
        ]
      };
    } catch (error) {
      console.error('Erreur amélioration simulation:', error);
      return baseSimulation;
    }
  }

  // ========== MÉTHODES UTILITAIRES ==========

  private async callMistralAPI(prompt: string): Promise<string> {
    if (!MISTRAL_API_KEY || MISTRAL_API_KEY === "LYhnS109jMADgCYbTaTdIJKUakrMqE7R") {
      throw new Error('Mistral API key non configurée');
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private generateFallbackPrompt(
    projectData: any,
    methodology: string,
    methodologyParams: Record<string, any>
  ): string {
    const basePrompt = `Conception professionnelle ${projectData.name} pour ${projectData.domain}. `;

    const methodologyPrompts = {
      TRIZ: `Résolution de contradiction technique: ${methodologyParams.contradiction_technique || 'performance vs coût'}. Design innovant, technique, fonctionnel.`,
      DESIGN_THINKING: `Design centré utilisateur. Phase empathie: ${methodologyParams.phase_empathie || 'analyse besoins'}. Ergonomique, intuitif, accessible.`,
      DESIGN_FOR_X: `Optimisation ${methodologyParams.critere_principal || 'fabrication'}. Contraintes: ${methodologyParams.contraintes_fabrication || 'standard'}. Design industriel.`,
      VALUE_ENGINEERING: `Rapport valeur optimal. Fonctions: ${methodologyParams.fonctions_principales || 'essentielles'}. Budget: ${methodologyParams.budget_max || 'maîtrisé'}.`
    };

    const methodPrompt = methodologyPrompts[methodology as keyof typeof methodologyPrompts] || methodologyPrompts.TRIZ;

    return basePrompt + methodPrompt + ` Description: ${projectData.description}. Rendu 3D professionnel, matériaux réalistes, éclairage studio, fond neutre.`;
  }

  private generateFallbackSTEP(prompt: string, designIndex: number): string {
    const stepContent = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Design ${designIndex + 1}'), '2;1');
FILE_NAME('design_${designIndex + 1}.step','${new Date().toISOString()}',('System'),(''),'Mistral AI STEP Generator','v1.0','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 }'));
ENDSEC;
DATA;
#10 = PRODUCT('design_${designIndex + 1}','${prompt.substring(0, 50)}','',$);
#20 = PRODUCT_DEFINITION_FORMATION('','',#10);
#30 = PRODUCT_DEFINITION('design','',#20,#40);
#40 = PRODUCT_DEFINITION_CONTEXT('part definition',#50,'design');
#50 = APPLICATION_CONTEXT('mechanical design');
#60 = APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',1994,#50);
ENDSEC;
END-ISO-10303-21;`;

    const base64Content = Buffer.from(stepContent).toString('base64');
    return `data:text/plain;base64,${base64Content}`;
  }

  private generateFallbackEvaluation(
    prompt: string,
    methodology: string
  ): AgentQEvaluation {
    return {
      overall_score: 7.5,
      category_scores: {
        aesthetic: 8,
        functional: 7,
        innovative: 6,
        manufacturable: 8,
        ergonomic: 7
      },
      strengths: [
        "Design esthétique et équilibré",
        "Bonne adéquation au besoin fonctionnel",
        "Matériaux appropriés pour la production"
      ],
      weaknesses: [
        "Peut être complexe à assembler",
        "Ergonomie perfectible",
        "Coût de production légèrement élevé"
      ],
      suggestions: {
        quick_fixes: ["Simplifier les fixations", "Arrondir les angles pour l'ergonomie"],
        redesign_ideas: ["Repenser le système d'assemblage", "Optimiser l'utilisation des matériaux"],
        material_suggestions: ["Envisager un composite plus léger", "Utiliser des matériaux recyclés"]
      },
      expert_opinion: "Design solide avec quelques améliorations possibles pour optimiser la fabrication et l'ergonomie. Recommandation: itérer pour perfectionner.",
      recommendation: "iterate"
    };
  }
}

export const aiService = AIService.getInstance();
