"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "@/components/icons";
import { api } from "@/lib/client";

export function AssignmentForm({ groups, cases }: { groups: { id: string; name: string }[]; cases: { id: string; title: string }[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        setBusy(true);
        setMsg(null);
        try {
          await api("/api/assignments", "POST", { title: f.get("title"), instructions: f.get("instructions"), caseId: f.get("caseId"), groupId: f.get("groupId"), dueAt: f.get("dueAt") || undefined });
          setMsg({ ok: true, text: "Devoir créé et étudiants notifiés." });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block"><span className="label">Titre</span><input name="title" required minLength={3} className="field" /></label>
      <label className="block">
        <span className="label">Cas</span>
        <select name="caseId" required className="field">{cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      </label>
      <label className="block">
        <span className="label">Groupe</span>
        <select name="groupId" required className="field">{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
      </label>
      <label className="block"><span className="label">Échéance</span><input name="dueAt" type="datetime-local" className="field" /></label>
      <label className="block"><span className="label">Consignes</span><textarea name="instructions" rows={3} className="field" /></label>
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Création…" : "Assigner le cas"}</button>
    </form>
  );
}

export function DeleteAssignment({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="subtle hover:text-danger"
      aria-label="Supprimer le devoir"
      onClick={async () => {
        if (!confirm("Supprimer ce devoir ? Les rapports déjà rendus sont conservés.")) return;
        await api(`/api/assignments?id=${id}`, "DELETE").catch((e) => alert((e as Error).message));
        router.refresh();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
