"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/", label: "[ 🎙️ HUD ]" },
  { href: "/workspace", label: "[ 🖥️ WORKSPACE ]" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="ultron-navbar fixed top-4 right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/90 border border-amber-500/40 backdrop-blur-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    >
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`ultron-nav-link ${
                isActive
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "text-amber-500/60 hover:text-amber-400"
              }`}
            >
              {route.label}
            </Link>
          );
        })}
    </nav>
  );
}
