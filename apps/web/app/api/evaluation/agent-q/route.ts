// apps/web/app/api/evaluation/agent-q/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '~/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { projectId, designUrl, prompt, methodology, projectType } = await request.json();

    console.log('🤖 Agent Q - Début évaluation', { projectId });

    if (!designUrl || !prompt) {
      return NextResponse.json(
        { success: false, error: 'designUrl et prompt requis' },
        { status: 400 }
      );
    }

    const aiService = AIService.getInstance();

    // Analyse avec l'Agent Q
    const evaluation = await aiService.evaluateDesignWithAgentQ(
      designUrl,
      prompt,
      methodology || 'TRIZ',
      projectType
    );

    // Sauvegarder dans Supabase (optionnel)
    if (process.env.SUPABASE_URL) {
      const { supabase } = await import('~/lib/supabase');
      const { error: evaluationError } = await supabase
        .from('project_evaluations')
        .insert({
          project_id: projectId,
          type: 'agent_q',
          evaluation_data: evaluation,
          created_at: new Date().toISOString()
        });

      if (evaluationError) {
        console.error('Erreur sauvegarde évaluation:', evaluationError);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation,
      projectId
    });

  } catch (error: any) {
    console.error('❌ Erreur Agent Q:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de l\'évaluation',
        fallback_evaluation: {
          overall_score: 7.5,
          strengths: ["Design analysé avec succès"],
          weaknesses: ["Analyse limitée sans clé API complète"],
          recommendation: "validate"
        }
      },
      { status: 500 }
    );
  }
}