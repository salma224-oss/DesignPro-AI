// app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { UserMenu } from "../../components/auth/UserMenu";
import type { Project, ProjectStatus } from "../../types";
import { useRouter } from "next/navigation";

interface ProjectStats {
  total: number;
  inProgress: number;
  inValidation: number;
  completed: number;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    inProgress: 0,
    inValidation: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my-projects' | 'collaborations'>('all');
  const [user, setUser] = useState<any>(null);
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

  // ✅ AJOUT: Fonction pour supprimer un projet
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projectName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Recharger la liste des projets
      await loadUserAndProjects();

      alert('Projet supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du projet');
    }
  };

  // ✅ AJOUT: Fonction pour archiver un projet
  const handleArchiveProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir archiver le projet "${projectName}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      // Recharger la liste des projets
      await loadUserAndProjects();

      alert('Projet archivé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      alert('Erreur lors de l\'archivage du projet');
    }
  };

  useEffect(() => {
    loadUserAndProjects();
  }, [activeTab]);

  const loadUserAndProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push('/login');
        return;
      }

      let query = supabase.from('projects').select('*');

      if (activeTab === 'my-projects') {
        query = query.eq('owner_id', user.id);
      } else if (activeTab === 'collaborations') {
        const { data: collaborations } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id)
          .neq('role', 'owner');

        if (collaborations && collaborations.length > 0) {
          query = query.in('id', collaborations.map(c => c.project_id));
        } else {
          query = query.eq('id', 'no-projects');
        }
      }

      // Fetch projects first
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        // Fetch project states to determine progress and status
        const projectIds = data.map(p => p.id);
        const { data: statesData } = await supabase
          .from('project_states')
          .select('*')
          .in('project_id', projectIds);

        const statesMap = new Map(statesData?.map(s => [s.project_id, s]));

        const enrichedProjects = data.map((p: any) => {
          const state = statesMap.get(p.id);

          let status: ProjectStatus = 'in_progress';
          let progress = 0;

          if (state) {
            if (state.evaluation_complete) {
              status = 'completed';
              progress = 100;
            } else if (state.step_file) {
              status = 'validation';
              progress = 90;
            } else if (state.design_results) {
              status = 'validation'; // Or advanced in progress
              progress = 75;
            } else if (state.generated_prompt) {
              progress = 50;
            } else if (state.selected_methodology) {
              progress = 25;
            }
          }

          // Workaround for domain storage in description
          // If description contains "Domaine:", parse it? (Optional, kept as is for now)

          return {
            ...p,
            status,
            progress,
            methodology: state?.selected_methodology || p.method || 'Non défini'
          };
        }).filter(p => p.status !== 'archived');

        setProjects(enrichedProjects);
        setStats({
          total: enrichedProjects.length,
          inProgress: enrichedProjects.filter(p => p.status === 'in_progress').length,
          inValidation: enrichedProjects.filter(p => p.status === 'validation').length,
          completed: enrichedProjects.filter(p => p.status === 'completed').length
        });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: ProjectStatus) => {
    const statusMap = {
      draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: '📝' },
      in_progress: { label: 'En Cours', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
      validation: { label: 'En Validation', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: '✅' },
      archived: { label: 'Archivé', color: 'bg-red-100 text-red-800', icon: '🗄️' }
    };
    return statusMap[status];
  };

  const getMethodologyInfo = (methodology?: string) => {
    const methodMap = {
      TRIZ: { label: 'TRIZ', description: 'Résolution inventive', color: 'bg-purple-100 text-purple-800' },
      DFX: { label: 'Design for X', description: 'Optimisation critères', color: 'bg-orange-100 text-orange-800' },
      DT: { label: 'Design Thinking', description: 'Centré utilisateur', color: 'bg-blue-100 text-blue-800' },
      VE: { label: 'Value Engineering', description: 'Optimisation valeur', color: 'bg-green-100 text-green-800' }
    };

    if (!methodology) {
      return { label: 'Non défini', description: '', color: 'bg-gray-100 text-gray-800' };
    }

    return methodMap[methodology as keyof typeof methodMap] || { label: methodology, description: '', color: 'bg-gray-100 text-gray-800' };
  };

  // ✅ AJOUT: Déterminer le texte du bouton en fonction du statut
  const getContinueButtonText = (project: Project) => {
    switch (project.status) {
      case 'completed':
        return 'Voir Rapport';
      case 'validation':
        return 'Valider';
      case 'in_progress':
        return 'Continuer';
      case 'draft':
        return 'Commencer';
      default:
        return 'Continuer';
    }
  };

  // ✅ AJOUT: Déterminer le lien en fonction du statut
  const getContinueButtonLink = (project: Project) => {
    // Pour tous les projets non terminés, aller vers l'idéation
    if (project.status !== 'completed') {
      return `/dashboard/projects/${project.id}/ideation`;
    }
    // Pour les projets terminés, aller vers la page de rapport
    return `/dashboard/projects/${project.id}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header avec Bienvenue */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={handleGoHome}
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  🏠 Accueil
                </button>
                <h1 className="text-4xl font-bold text-gray-900">
                  Tableau de Bord DesignPro AI
                </h1>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl">
                Bienvenue{user ? `, ${user.email}` : ''} dans votre espace de conception professionnelle.
                Gérez vos projets, collaborez avec votre équipe et suivez l'avancement de vos conceptions.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/projects/new"
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 flex items-center space-x-3 shadow-lg"
              >
                <span className="text-xl">+</span>
                <span className="font-semibold">Nouveau Projet</span>
              </Link>

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

          {/* Section d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-2xl text-blue-600">💡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Comment ça marche ?
                </h3>
                <div className="text-blue-800 space-y-2">
                  <p>1. <strong>Créez un projet</strong> avec les informations de base (titre, domaine, collaborateurs)</p>
                  <p>2. <strong>Lancez le processus d'idéation</strong> pour générer des concepts avec l'IA</p>
                  <p>3. <strong>Choisissez votre méthodologie</strong> et paramétrez-la selon vos besoins</p>
                  <p>4. <strong>Validez les résultats</strong> et générez les fichiers techniques</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <span className="text-2xl text-indigo-600">📁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Projets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-2xl text-blue-600">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">En Cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <span className="text-2xl text-yellow-600">⚡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">En Validation</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inValidation}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <span className="text-2xl text-green-600">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-2xl shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'all' as const, label: 'Tous les Projets', count: stats.total },
                { id: 'my-projects' as const, label: 'Mes Projets', count: projects.filter(p => p.status !== 'archived').length },
                { id: 'collaborations' as const, label: 'Collaborations', count: projects.filter(p => p.status !== 'archived').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Liste des projets */}
        <div className="bg-white rounded-2xl shadow-sm border">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">
                {activeTab === 'collaborations' ? '👥' : '🚀'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'collaborations'
                  ? 'Aucune collaboration'
                  : 'Aucun projet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {activeTab === 'collaborations'
                  ? "Les projets où vous êtes invité en tant que collaborateur apparaîtront ici."
                  : "Commencez par créer votre premier projet de conception assistée par IA."}
              </p>
              {activeTab !== 'collaborations' && (
                <Link
                  href="/dashboard/projects/new"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Créer mon premier projet
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {projects.map((project) => {
                const statusInfo = getStatusInfo(project.status);
                const methodInfo = getMethodologyInfo(project.methodology);

                return (
                  <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            <Link
                              href={getContinueButtonLink(project)}
                              className="hover:text-indigo-600"
                            >
                              {project.name}
                            </Link>
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <span className="mr-1">{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${methodInfo.color}`}>
                            {methodInfo.label}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-4">{project.description}</p>

                        {/* Métadonnées et progression */}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span>📅</span>
                            <span>Modifié le {new Date(project.updated_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>👥</span>
                            <span>{project.collaborators_count || 0} collaborateurs</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>📊</span>
                            <span>Progression: {project.progress || 0}%</span>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-6">
                        {/* ✅ CORRECTION: Lien vers l'idéation au lieu de la page projet */}
                        <Link
                          href={getContinueButtonLink(project)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                        >
                          {getContinueButtonText(project)}
                        </Link>

                        {/* ✅ AJOUT: Boutons d'action */}
                        <div className="flex flex-col space-y-2">
                          {/* Bouton Archiver */}
                          <button
                            onClick={() => handleArchiveProject(project.id, project.name)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium px-2 py-1 rounded border border-yellow-300 hover:bg-yellow-50"
                            title="Archiver le projet"
                          >
                            🗄️
                          </button>

                          {/* Bouton Supprimer (seulement pour le propriétaire) */}
                          {project.owner_id === user?.id && (
                            <button
                              onClick={() => handleDeleteProject(project.id, project.name)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                              title="Supprimer définitivement le projet"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section d'aide */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                Besoin d'aide pour démarrer ?
              </h3>
              <p className="text-indigo-700">
                Consultez notre guide détaillé ou contactez notre équipe de support.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/guide"
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-50 text-sm font-medium"
              >
                📚 Guide Utilisateur
              </Link>
              <Link
                href="/support"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                💬 Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}