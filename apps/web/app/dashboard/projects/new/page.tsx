// app/dashboard/projects/new/page.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "~/components/auth/UserMenu";

const DOMAINS = [
  "Mobilier et Design",
  "Électronique Grand Public",
  "Équipement Médical",
  "Automobile et Transport",
  "Aéronautique et Spatial",
  "Équipement Sportif",
  "Jardin et Extérieur",
  "Cuisine et Maison",
  "Bureau et Professionnel",
  "Textile et Mode",
  "Jouets et Loisirs",
  "Outillage et Industrie"
];

export default function NewProject() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    collaborators: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCollaborator, setNewCollaborator] = useState('');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  // ✅ AJOUT: Fonction de déconnexion
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // ✅ AJOUT: Fonction pour retourner à l'accueil
  const handleGoHome = () => {
    router.push('/');
  };

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Erreur auth:', error);
          setShouldRedirect(true);
          return;
        }
        
        if (!user) {
          console.log('Aucun utilisateur trouvé, redirection vers login');
          setShouldRedirect(true);
          return;
        }
        
        console.log('Utilisateur authentifié:', user.email);
        setUser(user);
      } catch (error) {
        console.error('Erreur lors de la vérification auth:', error);
        setShouldRedirect(true);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Gérer la redirection dans un useEffect séparé
  useEffect(() => {
    if (shouldRedirect && !authLoading) {
      router.push('/login');
    }
  }, [shouldRedirect, authLoading, router]);

  const addCollaborator = () => {
    if (newCollaborator.trim() && !formData.collaborators.includes(newCollaborator.trim())) {
      setFormData(prev => ({
        ...prev,
        collaborators: [...prev.collaborators, newCollaborator.trim()]
      }));
      setNewCollaborator('');
    }
  };

  const removeCollaborator = (email: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Vérifier à nouveau l'authentification avant la soumission
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Erreur d'authentification: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('Non authentifié. Veuillez vous reconnecter.');
      }

      console.log('Création du projet par:', user.email);

      if (!formData.name.trim() || !formData.description.trim()) {
        throw new Error('Le nom et la description sont requis');
      }

      // Créer le projet
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim(),
          domain: formData.domain,
          owner_id: user.id,
          status: 'draft',
          progress: 0
        }])
        .select()
        .single();

      if (projectError) {
        console.error('Erreur Supabase détaillée:', projectError);
        throw new Error(`Erreur lors de la création: ${projectError.message}`);
      }
      
      if (!project) {
        throw new Error('Le projet n\'a pas pu être créé');
      }

      console.log('Projet créé avec ID:', project.id);

      // Ajouter les collaborateurs
      if (formData.collaborators.length > 0) {
        const { error: collaboratorError } = await supabase
          .from('project_members')
          .insert(
            formData.collaborators.map(email => ({
              project_id: project.id,
              user_email: email,
              role: 'editor',
              status: 'pending',
              invited_by: user.id
            }))
          );

        if (collaboratorError) {
          console.warn('Avertissement collaborateurs:', collaboratorError);
          // Ne pas bloquer la création si les collaborateurs échouent
        }
      }

      // Rediriger vers l'idéation
      console.log('Redirection vers:', `/dashboard/projects/${project.id}/ideation`);
      router.push(`/dashboard/projects/${project.id}/ideation`);

    } catch (error: any) {
      console.error('Erreur complète lors de la création:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié après le chargement
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md">
            <div className="text-yellow-600 text-2xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Redirection en cours...</h3>
            <p className="text-yellow-700 mb-4">Vous allez être redirigé vers la page de connexion.</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header MODIFIÉ */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={handleGoHome}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  🏠 Accueil
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  ← Tableau de bord
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Créer un Nouveau Projet</h1>
              <p className="text-gray-600 mt-2">
                Commencez par définir les informations de base de votre projet
              </p>
              <div className="mt-2 text-sm text-green-600">
                ✅ Connecté en tant que: {user?.email}
              </div>
            </div>
            
            {/* ✅ AJOUT: Boutons de déconnexion et menu utilisateur */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex items-center space-x-2"
              >
                <span>🚪</span>
                <span>Déconnexion</span>
              </button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Le reste du code reste inchangé */}
        {/* Guide d'information */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <span className="text-2xl text-blue-600">💡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Informations Professionnelles Requises
              </h3>
              <div className="text-blue-800 space-y-2 text-sm">
                <p><strong>Nom du projet :</strong> Doit refléter clairement l'objectif et le scope</p>
                <p><strong>Description :</strong> Décrivez le produit, ses fonctionnalités principales et le public cible</p>
                <p><strong>Domaine :</strong> Sélectionnez le secteur d'application pour une meilleure orientation IA</p>
                <p><strong>Collaborateurs :</strong> Ajoutez les membres de l'équipe qui participeront au projet</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                {error.includes('authentifié') && (
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Se reconnecter
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom du projet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du Projet *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Chaise de bureau ergonomique innovante"
              />
              <p className="mt-1 text-sm text-gray-500">
                Un nom clair qui identifie votre projet
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du Projet *
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Décrivez en détail votre produit : fonctionnalités principales, public cible, contraintes techniques, objectifs de performance..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Cette description sera utilisée par l'IA pour comprendre votre vision
              </p>
            </div>

            {/* Domaine */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domaine d'Application
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sélectionnez un domaine</option>
                {DOMAINS.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Le secteur industriel de votre produit pour une meilleure orientation
              </p>
            </div>

            {/* Collaborateurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collaborateurs (Optionnel)
              </label>
              <div className="flex space-x-3 mb-3">
                <input
                  type="email"
                  value={newCollaborator}
                  onChange={(e) => setNewCollaborator(e.target.value)}
                  placeholder="Email du collaborateur"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addCollaborator}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
                >
                  Ajouter
                </button>
              </div>
              
              {formData.collaborators.length > 0 && (
                <div className="space-y-2">
                  {formData.collaborators.map((email, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeCollaborator(email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Les collaborateurs recevront une invitation à rejoindre le projet
              </p>
            </div>

            {/* Prochaines étapes */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400">🚀</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">Prochaines Étapes</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Après la création, vous serez redirigé vers l'interface d'idéation 
                    où vous pourrez choisir votre méthodologie et lancer la génération IA.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href="/dashboard"
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.description.trim()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{loading ? 'Création...' : 'Créer le Projet'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}