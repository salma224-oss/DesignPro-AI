// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Version temporaire avec fallback pour éviter les erreurs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

// Afficher un avertissement si les variables d'environnement ne sont pas configurées
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️  Variables Supabase non configurées. Vérifiez votre fichier .env.local');
  console.warn('   Les fonctionnalités Supabase ne fonctionneront pas correctement.');
}

// Client principal pour le frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Fonction utilitaire pour obtenir le client admin
export function getSupabaseAdmin() {
  return createClient(supabaseUrl, serviceRoleKey);
}