"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, PlayCircle } from "@/components/icons";
import { api } from "@/lib/client";
import { LANGS, type Lang } from "@/lib/sim/types";

export function StartCase({ caseId, assignmentId, aiMode, defaultLang = "fr" }: { caseId: string; assignmentId?: string; aiMode: "anthropic" | "groq" | "demo"; defaultLang?: Lang }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ url: string }>("/api/sessions", "POST", { caseId, language: lang, assignmentId });
      router.push(r.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold">Langue de la consultation</p>
      <div className="relative mt-3 grid grid-cols-3 rounded-xl border border-white/10 bg-white/[0.04] p-1" role="radiogroup" aria-label="Langue de la consultation">
        {LANGS.map((l) => (
          <button key={l.code} type="button" role="radio" aria-checked={lang === l.code} onClick={() => setLang(l.code)} className="relative z-10 rounded-lg py-2 text-sm font-semibold">
            {lang === l.code && <motion.span layoutId="lang-pill" className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-b from-[#1f7bff] to-[#0a5be0]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            {l.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-white/55">Le patient ne répond qu&apos;à partir des faits de son dossier.</p>
      {error && <p className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
      <button onClick={start} disabled={busy} className="btn-primary mt-5 w-full py-3.5 text-[15px] font-semibold">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" weight="fill" />} {busy ? "Préparation de la salle…" : "Entrer dans la salle de consultation"}
      </button>
    </div>
  );
}
