// components/ImageGallery.tsx
"use client";

export default function ImageGallery({ images }: { images: string[] }) {
  if (!images || images.length === 0) {
    return <div className="text-sm text-gray-500">Aucune image générée pour le moment.</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {images.map((src, idx) => (
        <div key={idx} className="border rounded overflow-hidden">
          <img src={src} alt={`generated-${idx}`} className="w-full h-40 object-cover" />
        </div>
      ))}
    </div>
  );
}
