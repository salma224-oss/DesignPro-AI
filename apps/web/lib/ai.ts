// lib/ai.ts - Version complète avec Agent Q
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "LYhnS109jMADgCYbTaTdIJKUakrMqE7R";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

  // ========== MÉTHODES EXISTANTES ==========
  
  async generateProfessionalPrompt(
    projectData: any,
    methodology: string,
    methodologyParams: Record<string, any>
  ): Promise<string> {
    try {
      console.log('🤖 Génération prompt Mistral...');

      if (!MISTRAL_API_KEY || MISTRAL_API_KEY === "LYhnS109jMADgCYbTaTdIJKUakrMqE7R") {
        console.log('🔄 Fallback local');
        return this.generateFallbackPrompt(projectData, methodology, methodologyParams);
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
              content: `Génère un prompt détaillé en français pour: "${projectData.name}" 
              Domaine: ${projectData.domain}
              Description: ${projectData.description}
              Méthodologie: ${methodology}
              Paramètres: ${JSON.stringify(methodologyParams)}
              Le prompt doit être optimisé pour ComfyUI/Stable Diffusion. Maximum 250 mots.` 
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
        const evaluation = JSON.parse(response);
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
      // En production, vous pourriez utiliser:
      // 1. Replicate API avec BLIP-2
      // 2. Hugging Face avec CLIP
      // 3. OpenAI GPT-4V
      
      if (REPLICATE_API_TOKEN) {
        // Exemple avec Replicate (décommentez si configuré)
        /*
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: "..." // Version BLIP-2
          })
        });
        const data = await response.json();
        return data.output;
        */
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
      const aiEnhancement = JSON.parse(response);

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