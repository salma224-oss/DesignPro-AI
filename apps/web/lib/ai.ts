// lib/ai.ts - Version corrigée avec fallbacks
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "LYhnS109jMADgCYbTaTdIJKUakrMqE7R";

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Génère un prompt professionnel avec Mistral AI
   */
  async generateProfessionalPrompt(
    projectData: any,
    methodology: string,
    methodologyParams: Record<string, any>
  ): Promise<string> {
    try {
      console.log('🤖 Génération prompt Mistral...');

      // Fallback immédiat si pas de clé API
      if (!MISTRAL_API_KEY || MISTRAL_API_KEY === "LYhnS109jMADgCYbTaTdIJKUakrMqE7R") {
        console.log('🔄 Fallback local (pas de clé Mistral)');
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

  /**
   * Génère un fichier STEP avec Mistral AI
   */
  async generateSTEPFileWithAI(
    prompt: string, 
    designIndex: number, 
    designUrl?: string
  ): Promise<string> {
    try {
      console.log('📁 Génération fichier STEP Mistral...');

      // Fallback si pas de clé API
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
      
      // Créer un data URL
      const base64Content = Buffer.from(stepContent).toString('base64');
      return `data:text/plain;base64,${base64Content}`;

    } catch (error) {
      console.error('❌ Erreur génération STEP Mistral:', error);
      return this.generateFallbackSTEP(prompt, designIndex);
    }
  }

  /**
   * Fallback local pour prompt
   */
  private generateFallbackPrompt(
    projectData: any,
    methodology: string,
    methodologyParams: Record<string, any>
  ): string {
    console.log('🔄 Fallback local prompt');
    
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

  /**
   * Fallback local pour STEP
   */
  private generateFallbackSTEP(prompt: string, designIndex: number): string {
    console.log('🔄 Fallback local STEP');
    
    // Contenu STEP basique
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
}

export const aiService = AIService.getInstance();