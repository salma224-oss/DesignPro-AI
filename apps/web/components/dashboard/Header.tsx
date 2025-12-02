"use client";
import { supabase } from "~/lib/supabase";

export function Header() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
          Déconnexion
        </button>
      </div>
    </header>
  );
}