"use client";
import { useState } from "react";

const TRIZ_PRINCIPLES = [
  "Segmentation", "Extraction", "Local Quality", "Asymmetry", "Consolidation"
];

export function TRIZAnalyzer({ onUpdate }: { onUpdate: (data: any) => void }) {
  const [improving, setImproving] = useState("");
  const [worsening, setWorsening] = useState("");
  const [principles, setPrinciples] = useState<string[]>([]);

  const togglePrinciple = (principle: string) => {
    const newPrinciples = principles.includes(principle)
      ? principles.filter(p => p !== principle)
      : [...principles, principle];
    
    setPrinciples(newPrinciples);
    onUpdate({ improving, worsening, principles: newPrinciples });
  };

  return (
    <div className="space-y-4">
      <div>
        <label>Paramètre à améliorer</label>
        <input
          value={improving}
          onChange={(e) => {
            setImproving(e.target.value);
            onUpdate({ improving: e.target.value, worsening, principles });
          }}
          className="w-full p-2 border rounded"
          placeholder="Ex: Poids, Durabilité..."
        />
      </div>
      
      <div>
        <label>Paramètre qui se dégrade</label>
        <input
          value={worsening}
          onChange={(e) => {
            setWorsening(e.target.value);
            onUpdate({ improving, worsening: e.target.value, principles });
          }}
          className="w-full p-2 border rounded"
          placeholder="Ex: Coût, Complexité..."
        />
      </div>

      <div>
        <label>Principes TRIZ</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TRIZ_PRINCIPLES.map(principle => (
            <label key={principle} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={principles.includes(principle)}
                onChange={() => togglePrinciple(principle)}
              />
              <span>{principle}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}