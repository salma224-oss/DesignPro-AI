// app/page.tsx - VERSION CORRIGÉE
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserMenu } from "../components/auth/UserMenu";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // ⚠️ SUPPRIMER la redirection automatique
      // if (user) {
      //   router.push('/dashboard');
      // }
    };
    
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-800">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-white text-2xl font-bold">DesignPro AI</div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="bg-white text-blue-900 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50"
                  >
                    Tableau de Bord
                  </Link>
                  <UserMenu />
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-white hover:text-blue-200 px-4 py-2"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-white text-blue-900 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50"
                  >
                    Commencer Gratuitement
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Conception Produit
            <span className="block text-blue-200">Augmentée par IA</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transformez vos idées en prototypes validés avec l'intelligence artificielle. 
            Méthodologies professionnelles, génération assistée, collaboration d'équipe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-2xl"
                >
                  📊 Aller au Tableau de Bord
                </Link>
                <Link
                  href="/dashboard/projects/new"
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                >
                  🚀 Créer un Nouveau Projet
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-2xl"
                >
                  🚀 Commencer Maintenant
                </Link>
                <Link
                  href="#features"
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
                >
                  📚 Découvrir les Fonctionnalités
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-white">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-blue-200">Projets Conçus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">4</div>
              <div className="text-blue-200">Méthodologies Expertes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-blue-200">Satisfaction Client</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir DesignPro AI ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme complète pour les professionnels de la conception produit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🔧",
                title: "Méthodologies Structurées",
                description: "TRIZ, Design for X, Design Thinking, Value Engineering - Choisissez l'approche adaptée à votre projet"
              },
              {
                icon: "🤖",
                title: "IA Générative Avancée",
                description: "Génération de concepts, prompts optimisés, visualisations 3D et fichiers techniques"
              },
              {
                icon: "👥",
                title: "Collaboration d'Équipe",
                description: "Invitez collaborateurs, gérez les permissions, travaillez en temps réel"
              },
              {
                icon: "📊",
                title: "Suivi de Projet",
                description: "Tableau de bord complet, étapes de validation, rapports d'avancement"
              },
              {
                icon: "🎯",
                title: "Résultats Professionnels",
                description: "Designs prêts pour la production, fichiers STEP, documentation technique"
              },
              {
                icon: "⚡",
                title: "Processus Rapide",
                description: "Réduisez le temps de conception de 70% avec l'assistance IA"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-800 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à Transformer Votre Processus de Conception ?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Rejoignez les entreprises innovantes qui utilisent déjà DesignPro AI
          </p>
          {user ? (
            <div className="space-x-4">
              <Link
                href="/dashboard"
                className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 inline-block"
              >
                📊 Tableau de Bord
              </Link>
              <Link
                href="/dashboard/projects/new"
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 inline-block"
              >
                🚀 Nouveau Projet
              </Link>
            </div>
          ) : (
            <Link
              href="/signup"
              className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 inline-block"
            >
              S'inscrire Gratuitement
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

