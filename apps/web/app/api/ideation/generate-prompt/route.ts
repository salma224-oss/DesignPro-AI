import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '~/lib/ai';

// Fallback local pour générer un prompt basique
function generateLocalPrompt(
  projectData: any,
  methodology: string,
  methodologyParams: Record<string, any>
): string {
  console.log('🔧 Génération prompt fallback local');
  
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

export async function POST(request: NextRequest) {
  try {
    const { projectId, projectData, methodology, methodologyParams } = await request.json();

    console.log('🚀 API Generate Prompt - Début:', {
      projectId,
      projectName: projectData.name,
      methodology
    });

    // Validation basique
    if (!projectData?.name || !methodology) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données manquantes: nom et méthodologie requis'
        },
        { status: 400 }
      );
    }

    let generatedPrompt: string;
    
    try {
      // Utilisation directe de la classe AIService
      const aiService = AIService.getInstance();
      generatedPrompt = await aiService.generateProfessionalPrompt(
        projectData,
        methodology,
        methodologyParams
      );
    } catch (firstError) {
      console.error('❌ Première tentative échouée:', firstError);
      
      // Fallback immédiat avec prompt généré localement
      console.log('🔄 Utilisation du fallback local...');
      generatedPrompt = generateLocalPrompt(projectData, methodology, methodologyParams);
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      methodology: methodology,
      length: generatedPrompt.length
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE generate-prompt:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Service temporairement indisponible. Veuillez réessayer.',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Erreur inconnue' : undefined
      },
      { status: 500 }
    );
  }
}