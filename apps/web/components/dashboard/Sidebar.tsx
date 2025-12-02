"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  
  const links = [
    { href: '/dashboard', label: 'Projets' },
    { href: '/dashboard/ideation', label: 'Idéation' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white p-4">
      <nav className="space-y-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block p-2 rounded ${pathname === link.href ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}