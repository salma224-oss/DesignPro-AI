// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MakerKit - IA Conception Produit",
  description: "Prototype : idéation → prompt → image → 3D/STEP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className + " bg-gray-50 min-h-screen"}>
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold">
              MakerKit IA
            </Link>
            <nav className="space-x-4">
              <Link href="/projects/list" className="text-sm hover:underline">Projets</Link>
              <Link href="/projects/new" className="text-sm hover:underline">Nouveau</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

        <footer className="text-center text-sm text-gray-500 py-8">
          © {new Date().getFullYear()} MakerKit - Prototype
        </footer>
      </body>
    </html>
  );
}
