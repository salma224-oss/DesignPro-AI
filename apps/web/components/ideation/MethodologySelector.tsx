"use client";

const METHODS = [
  { id: "TRIZ", name: "TRIZ", description: "Résolution contradictions techniques" },
  { id: "DFX", name: "Design for X", description: "Optimisation par critères" },
  { id: "DT", name: "Design Thinking", description: "Centré utilisateur" },
  { id: "VE", name: "Value Engineering", description: "Validation fonctionnelle" },
];

export function MethodologySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {METHODS.map(method => (
        <div
          key={method.id}
          className={`border-2 p-4 rounded cursor-pointer ${
            value === method.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
          onClick={() => onChange(method.id)}
        >
          <h3 className="font-semibold">{method.name}</h3>
          <p className="text-sm text-gray-600">{method.description}</p>
        </div>
      ))}
    </div>
  );
}