"use client";
export default function PromptPreview({ prompt }: { prompt: string }) {
  return (
    <pre className="p-2 border rounded bg-gray-50 whitespace-pre-wrap">{prompt}</pre>
  );
}
