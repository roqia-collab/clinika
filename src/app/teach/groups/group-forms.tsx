"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function CreateGroupForm({ teachers }: { teachers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        try {
          await api("/api/groups", "POST", { name: f.get("name"), year: f.get("year") ? Number(f.get("year")) : undefined, teacherId: f.get("teacherId") || undefined });
          setMsg({ ok: true, text: "Groupe créé." });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        }
      }}
    >
      <label className="block"><span className="label">Nom</span><input name="name" required minLength={2} className="field" placeholder="ex. 3e année — Groupe A" /></label>
      <label className="block"><span className="label">Année</span><input name="year" type="number" min={1} max={10} className="field" /></label>
      {teachers.length > 0 && (
        <label className="block">
          <span className="label">Enseignant</span>
          <select name="teacherId" className="field" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </label>
      )}
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary w-full">Créer le groupe</button>
    </form>
  );
}

export function AddMembersForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const emails = String(new FormData(form).get("emails")).split(/[\s,;]+/).filter(Boolean);
        try {
          const r = await api<{ added: number; notFound: string[] }>("/api/groups", "PUT", { groupId, emails });
          setMsg({ ok: r.notFound.length === 0, text: `${r.added} ajouté(s).${r.notFound.length ? ` Introuvables (ou non étudiants) : ${r.notFound.join(", ")}` : ""}` });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        }
      }}
    >
      <label htmlFor={`emails-${groupId}`} className="sr-only">E-mails des étudiants</label>
      <input id={`emails-${groupId}`} name="emails" required className="field flex-1" placeholder="Ajouter des étudiants par e-mail (séparés par des virgules)" />
      <button className="btn-ghost">Ajouter</button>
      {msg && <p className={`w-full text-xs ${msg.ok ? "text-success" : "text-amber-600"}`}>{msg.text}</p>}
    </form>
  );
}
