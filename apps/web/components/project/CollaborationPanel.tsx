"use client";
import { useState } from "react";

export function CollaborationPanel({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState("");

  const addCollaborator = async () => {
    // Implémentation à ajouter
    console.log("Ajouter collaborateur:", email);
  };

  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold mb-2">Collaborateurs</h3>
      <div className="flex space-x-2">
        <input
          type="email"
          placeholder="Email du collaborateur"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button onClick={addCollaborator} className="bg-blue-600 text-white px-4 py-2 rounded">
          Ajouter
        </button>
      </div>
    </div>
  );
}