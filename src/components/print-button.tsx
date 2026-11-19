"use client";

import { Printer } from "@/components/icons";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-ghost">
      <Printer className="h-4 w-4" /> Imprimer
    </button>
  );
}
