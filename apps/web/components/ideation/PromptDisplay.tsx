"use client";

export function PromptDisplay({ prompt }: { prompt: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded border">
      <label className="block text-sm font-medium mb-2">Prompt généré :</label>
      <textarea
        value={prompt}
        readOnly
        className="w-full h-32 p-2 border rounded bg-white"
      />
    </div>
  );
}