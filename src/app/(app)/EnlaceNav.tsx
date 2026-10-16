"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EnlaceNav({ href, children }: { href: string; children: React.ReactNode }) {
  const activo = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
        activo ? "bg-tinta text-white" : "text-tinta-2 hover:bg-fondo"
      }`}
    >
      {children}
    </Link>
  );
}
