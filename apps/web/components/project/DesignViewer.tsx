"use client";

export function DesignViewer({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Design ${index + 1}`}
          className="w-full h-48 object-cover rounded border"
        />
      ))}
    </div>
  );
}