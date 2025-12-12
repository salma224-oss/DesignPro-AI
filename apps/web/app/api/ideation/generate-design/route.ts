import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '~/lib/supabase';
import { aiService } from '~/lib/ai';

export async function POST(request: NextRequest) {
  let body: any = null;

  try {
    body = await request.json();
    const {
      projectId,
      generationMethod,
      prompt,
      sketch,
      image,
      methodology
    } = body;

    console.log('🎨 API Generate Design - Début:', {
      projectId,
      generationMethod,
      hasPrompt: !!prompt,
      hasSketch: !!sketch,
      hasImage: !!image
    });

    // Validation
    if (!projectId || !generationMethod) {
      return NextResponse.json(
        { error: 'Données manquantes: projectId et generationMethod requis' },
        { status: 400 }
      );
    }

    let result;

    // Appel au service IA centralisé (Phase 2 du workflow)
    switch (generationMethod) {
      case 'sdxl':
      case 'prompt':
        if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
        result = await aiService.generateDesignCandidates('sdxl', prompt);
        break;

      case 'controlnet':
        if (!sketch) return NextResponse.json({ error: 'Sketch requis' }, { status: 400 });
        result = await aiService.generateDesignCandidates('controlnet', prompt, sketch);
        break;

      case 'img2img':
        if (!image) return NextResponse.json({ error: 'Image requise' }, { status: 400 });
        result = await aiService.generateDesignCandidates('img2img', prompt, image);
        break;

      default:
        return NextResponse.json({ error: 'Méthode non supportée' }, { status: 400 });
    }

    // Sauvegarder les résultats dans Supabase
    if (result.images.length > 0) {
      try {
        await supabase
          .from('project_states')
          .upsert({
            project_id: projectId,
            selected_generation_method: generationMethod,
            design_results: {
              ...result,
              prompt_used: prompt,
              methodology
            },
            selected_methodology: methodology,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'project_id'
          });
      } catch (dbError) {
        console.error('❌ Erreur sauvegarde Supabase:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      count: result.images.length,
      projectId: projectId
    });

  } catch (error: any) {
    console.error('❌ Erreur critique génération design:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      projectId: body?.projectId
    }, { status: 500 });
  }
}
