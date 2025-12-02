// app/login/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("🔄 Tentative de connexion...", { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), // ✅ Normaliser l'email
        password: password,
      });

      if (error) {
        console.error("❌ Erreur de connexion détaillée:", error);
        
        // ✅ Messages d'erreur plus précis
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Veuillez confirmer votre email avant de vous connecter.");
        } else if (error.message.includes("Too many requests")) {
          setError("Trop de tentatives de connexion. Veuillez réessayer plus tard.");
        } else {
          setError(`Erreur de connexion: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        console.log("✅ Connexion réussie:", data.user.email);
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      console.error("❌ Erreur inattendue:", error);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo et titre */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">DesignPro AI</div>
            <h2 className="text-2xl font-semibold text-gray-900">Connexion</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ou{" "}
              <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                créez un nouveau compte
              </Link>
            </p>
          </div>

          {/* Formulaire */}
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">❌</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="votre@email.com"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Votre mot de passe"
                  minLength={6}
                />
              </div>
            </div>

            {/* Options supplémentaires */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Bouton de connexion */}
            <div>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Connexion...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </button>
            </div>

            {/* Lien vers l'inscription */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Pas de compte ?{" "}
                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                  S'inscrire gratuitement
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Section d'information */}
        <div className="text-center">
          <p className="text-sm text-blue-200">
            Besoin d'aide ?{" "}
            <Link href="/support" className="font-medium text-white hover:text-blue-100">
              Contactez le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}