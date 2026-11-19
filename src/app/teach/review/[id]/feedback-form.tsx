"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

const TEMPLATES = [
  "Bon interrogatoire structuré. La prochaine fois, recherchez explicitement les signes de gravité avant de passer à l'examen.",
  "Vos diagnostics différentiels sont bien ouverts. Reliez clairement chaque élément clé à votre diagnostic retenu.",
  "Revoyez la sécurité de votre prise en charge : vérifiez les contre-indications au regard des antécédents et des allergies.",
];

export function FeedbackForm({ sessionId, initialComment, initialOverride, rubricScore }: { sessionId: string; initialComment: string; initialOverride: number | null; rubricScore: number }) {
  const router = useRouter();
  const [comment, setComment] = useState(initialComment);
  const [override, setOverride] = useState<string>(initialOverride?.toString() ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/results/${sessionId}/feedback`, "POST", { comment, scoreOverride: override === "" ? null : Number(override) });
      setMsg({ ok: true, text: "Commentaire enregistré — l'étudiant a été notifié." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="comment">Commentaire</label>
        <textarea id="comment" className="field" rows={8} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={5000} placeholder="Ce qui a bien marché, ce qu'il faut travailler, moments précis de la transcription…" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEMPLATES.map((t, i) => (
            <button key={i} type="button" onClick={() => setComment((c) => (c ? `${c}\n\n${t}` : t))} className="chip border border-[rgb(var(--line))] text-[11px] hover:border-brand-400">
              + Modèle {i + 1}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="override">Note ajustée (facultatif)</label>
        <input id="override" type="number" min={0} max={100} className="field" value={override} onChange={(e) => setOverride(e.target.value)} placeholder={`Note de la grille : ${rubricScore}`} />
        <p className="subtle mt-1 text-xs">La note de la grille est conservée ; l'ajustement est affiché à côté et inscrit au journal d'audit.</p>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary w-full" disabled={busy || !comment.trim()} onClick={save}>
        {busy ? "Enregistrement…" : "Enregistrer le commentaire"}
      </button>
    </div>
  );
}
