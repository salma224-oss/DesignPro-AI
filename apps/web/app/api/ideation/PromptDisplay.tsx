"use client";
import { useState } from "react";

interface PromptDisplayProps {
  prompt: string;
  onEdit?: (newPrompt: string) => void;
  editable?: boolean;
}

export function PromptDisplay({ prompt, onEdit, editable = true }: PromptDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(prompt);

  const handleSave = () => {
    onEdit?.(currentPrompt);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-gray-700">
          Prompt généré :
        </label>
        {editable && (
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
          >
            {isEditing ? 'Sauvegarder' : 'Modifier'}
          </button>
        )}
      </div>
      
      {isEditing ? (
        <textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          className="w-full h-40 p-3 border rounded-lg font-mono text-sm"
          placeholder="Personnalisez votre prompt..."
        />
      ) : (
        <div className="bg-white p-4 rounded border">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {prompt}
          </pre>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500">
        💡 Ce prompt sera utilisé pour générer les designs IA
      </div>
    </div>
  );
}
