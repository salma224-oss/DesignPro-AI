// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "~/lib/supabase";

export async function POST(request: Request) {
  try {
    const { name, description, methodology = 'TRIZ' } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Le nom du projet est requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur depuis l'auth
    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader) {
      // Utiliser le client admin pour récupérer l'user
      const supabaseAdmin = getSupabaseAdmin();
      const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      user = authUser;
    }

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Créer le projet avec le service role
    const supabaseAdmin = getSupabaseAdmin();
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert([{ 
        name: name.trim(), 
        description: description?.trim(), 
        owner_id: user.id,
        methodology: methodology,
        status: 'draft'
      }])
      .select()
      .single();

    if (projectError) {
      console.error("Erreur création projet:", projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Erreur serveur:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

// Optionnel: Ajouter d'autres méthodes HTTP
export async function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée" },
    { status: 405 }
  );
}


