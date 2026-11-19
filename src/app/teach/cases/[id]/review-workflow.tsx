"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, CheckCircle2, RotateCcw, Send, ShieldCheck } from "@/components/icons";
import { api } from "@/lib/client";

const STEPS = ["DRAFT", "IN_REVIEW", "PUBLISHED"];
const ATTESTATIONS = [
  ["fictional", "Toutes les données patients sont fictives ou correctement anonymisées"],
  ["factsConsistent", "Les faits, signes et résultats du cas sont cliniquement cohérents"],
  ["rubricReviewed", "La grille, les termes acceptés et les justifications ont été relus"],
  ["safetyChecked", "Les options de prise en charge et les points pédagogiques sont sûrs et à jour"],
] as const;

export function ReviewWorkflow(p: { id: string; status: string; canReview: boolean; canEdit: boolean; reviewedBy: string | null; reviewedAt: string | null; reviewNotes: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [notes, setNotes] = useState("");
  const [att, setAtt] = useState<Record<string, boolean>>({});

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/cases/${p.id}/status`, "POST", body);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const allAttested = ATTESTATIONS.every(([k]) => att[k]);

  return (
    <div className="panel p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-teal-500" /> Circuit de validation
      </p>
      <ol className="mb-4 flex items-center gap-1 text-[11px] font-semibold">
        {STEPS.map((s, i) => {
          const idx = STEPS.indexOf(p.status);
          const done = idx >= i;
          return (
            <li key={s} className={`flex-1 rounded-md px-2 py-1 text-center ${done ? "bg-teal-500 text-white" : "bg-[rgb(var(--panel-2))] subtle"}`}>
              {({ DRAFT: "brouillon", IN_REVIEW: "validation", PUBLISHED: "publié" } as Record<string, string>)[s]}
            </li>
          );
        })}
      </ol>

      {p.status === "DRAFT" && p.canEdit && (
        <button className="btn-primary w-full" disabled={busy} onClick={() => act({ action: "submit_review" })}>
          <Send className="h-4 w-4" /> Soumettre à la validation clinique
        </button>
      )}

      {p.status === "IN_REVIEW" &&
        (p.canReview ? (
          <div className="space-y-3">
            <label className="block">
              <span className="label">Nom et qualité de l&apos;expert</span>
              <input className="field" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="ex. Pr S. Benali — Professeur en cardiologie, CHU" />
            </label>
            <div className="space-y-1.5">
              {ATTESTATIONS.map(([k, label]) => (
                <label key={k} className="flex items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5" checked={!!att[k]} onChange={(e) => setAtt({ ...att, [k]: e.target.checked })} /> {label}
                </label>
              ))}
            </div>
            <textarea className="field text-xs" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Remarques de validation (facultatif)" />
            <button className="btn-teal w-full" disabled={busy || !allAttested || reviewer.trim().length < 5} onClick={() => act({ action: "publish", reviewer, notes, attestations: att })}>
              <CheckCircle2 className="h-4 w-4" /> Valider et publier
            </button>
            <button className="btn-ghost w-full" disabled={busy} onClick={() => act({ action: "return_to_draft", notes })}>
              <RotateCcw className="h-4 w-4" /> Demander des modifications
            </button>
          </div>
        ) : (
          <p className="subtle text-sm">En attente de validation par un expert clinique.</p>
        ))}

      {p.status === "PUBLISHED" && (
        <div className="space-y-3 text-sm">
          <p>
            <span className="subtle">Validé par</span> <strong>{p.reviewedBy}</strong>
            {p.reviewedAt && <span className="subtle"> le {new Date(p.reviewedAt).toLocaleDateString("fr-DZ")}</span>}
          </p>
          {p.reviewNotes && <p className="subtle text-xs">{p.reviewNotes}</p>}
          <p className="subtle text-xs">Toute modification enregistrée renvoie le cas en brouillon et exige une nouvelle validation.</p>
          {p.canEdit && (
            <button className="btn-ghost w-full" disabled={busy} onClick={() => confirm("Archiver ce cas ? Les étudiants ne le verront plus.") && act({ action: "archive" })}>
              <Archive className="h-4 w-4" /> Archiver
            </button>
          )}
        </div>
      )}
      {p.status === "ARCHIVED" && p.canEdit && (
        <button className="btn-ghost w-full" disabled={busy} onClick={() => act({ action: "return_to_draft" })}>
          <RotateCcw className="h-4 w-4" /> Restaurer en brouillon
        </button>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
