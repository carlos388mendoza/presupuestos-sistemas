"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BotonSalir() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-texto px-0"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      Cerrar sesión
    </button>
  );
}
