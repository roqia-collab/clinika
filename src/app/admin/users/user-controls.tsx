"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function UserControls({ id, self, role, plan, active }: { id: string; self: boolean; role: string; plan: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await api(`/api/admin/users/${id}`, "PATCH", body);
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="field w-auto py-1 text-xs" value={role} disabled={busy || self} onChange={(e) => patch({ roleKey: e.target.value })} aria-label="Rôle">
        {([["STUDENT", "Étudiant"], ["TEACHER", "Enseignant"], ["UNIVERSITY_ADMIN", "Admin faculté"], ["PLATFORM_ADMIN", "Admin plateforme"]] as const).map(([r, l]) => <option key={r} value={r}>{l}</option>)}
      </select>
      <select className="field w-auto py-1 text-xs" value={plan} disabled={busy} onChange={(e) => patch({ plan: e.target.value })} aria-label="Formule">
        {([["FREE", "Gratuit"], ["STUDENT_PRO", "Étudiant Pro"], ["UNIVERSITY", "Faculté"]] as const).map(([p, l]) => <option key={p} value={p}>{l}</option>)}
      </select>
      <button className={`chip ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`} disabled={busy || self} onClick={() => confirm(active ? "Désactiver ce compte ? L'utilisateur sera déconnecté." : "Réactiver ce compte ?") && patch({ active: !active })}>
        {active ? "actif" : "désactivé"}
      </button>
    </div>
  );
}
