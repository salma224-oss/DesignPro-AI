import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '~/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { projectId, prompt, designUrl, selectedDesignIndex } = await request.json();

    console.log('📁 Génération STEP Mistral pour:', projectId);
    
    if (selectedDesignIndex === undefined || !prompt) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données manquantes: prompt et selectedDesignIndex requis'
        },
        { status: 400 }
      );
    }

    // Utilisation directe de la classe AIService
    const aiService = AIService.getInstance();
    
    // Génération du fichier STEP avec Mistral
    const stepFileUrl = await aiService.generateSTEPFileWithAI(
      prompt, 
      selectedDesignIndex, 
      designUrl
    );

    return NextResponse.json({
      success: true,
      step_file: stepFileUrl,
      design_url: designUrl,
      design_index: selectedDesignIndex,
      source: "mistral-api"
    });

  } catch (error) {
    console.error('❌ Erreur génération STEP:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}