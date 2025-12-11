// apps/web/app/api/evaluation/real/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '~/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { projectId, designUrl, designIndex, projectType, methodology } = await request.json();

    console.log('⚙️ R.E.A.L. - Début simulation', { projectId, projectType });

    const aiService = AIService.getInstance();
    
    // Simulation R.E.A.L.
    const simulation = await aiService.simulateREALAnalysis(
      designUrl,
      designIndex || 0,
      projectType || 'produit industriel',
      methodology || 'TRIZ'
    );

    // Sauvegarder dans Supabase (optionnel)
    if (process.env.SUPABASE_URL) {
      const { supabase } = await import('~/lib/supabase');
      await supabase
        .from('project_evaluations')
        .insert({
          project_id: projectId,
          type: 'real_simulation',
          simulation_data: simulation,
          created_at: new Date().toISOString()
        })
        .catch(err => console.error('Erreur sauvegarde simulation:', err));
    }

    return NextResponse.json({
      success: true,
      simulation,
      projectId
    });

  } catch (error: any) {
    console.error('❌ Erreur R.E.A.L.:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la simulation',
        fallback_simulation: {
          dfm_analysis: {
            manufacturability_score: 75,
            estimated_cost: 200,
            recommended_material: "Matériau standard",
            production_time: 10,
            complexity_score: 25
          },
          optimization_suggestions: [
            {
              type: "structure",
              suggestion: "Consulter un ingénieur pour validation structurelle",
              impact: "high"
            }
          ]
        }
      },
      { status: 500 }
    );
  }
}