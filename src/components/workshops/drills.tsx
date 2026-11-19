"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, X } from "@/components/icons";
import { BloodPressureTool, DripBag, dropsPerMin } from "@/components/sim/bedside-tools";

// ───────────────────────── Blood pressure: 3 patients ─────────────────────────

const BP_CASES = [
  { who: "Femme de 34 ans, bilan de routine", sbp: 118, dbp: 76, hr: 72 },
  { who: "Homme de 61 ans, céphalées", sbp: 164, dbp: 98, hr: 84 },
  { who: "Homme de 25 ans, malaise", sbp: 96, dbp: 58, hr: 110 },
];

export function BloodPressureWorkshop() {
  const [round, setRound] = useState(0);
  const [reads, setReads] = useState<({ sys: number | null; dia: number | null } | null)[]>([null, null, null]);
  const c = BP_CASES[round];
  const done = reads.every(Boolean);
  const errors = reads.map((r, k) => (r && r.sys !== null && r.dia !== null ? Math.abs(r.sys - BP_CASES[k].sbp) + Math.abs(r.dia - BP_CASES[k].dbp) : null));
  const score = Math.round(errors.reduce<number>((a, e) => a + (e === null ? 0 : Math.max(0, 100 - e * 6)), 0) / 3);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Patient {round + 1} / 3 · <span className="text-white/60">{c.who}</span></p>
          <div className="flex gap-1.5">
            {BP_CASES.map((_, k) => (
              <button key={k} onClick={() => setRound(k)} className={`h-2 w-8 rounded-full ${k === round ? "bg-[#38e1ff]" : reads[k] ? "bg-emerald-400/70" : "bg-white/15"}`} aria-label={`Patient ${k + 1}`} />
            ))}
          </div>
        </div>
        <BloodPressureTool key={round} sbp={c.sbp} dbp={c.dbp} hr={c.hr} onDone={(r) => setReads((v) => v.map((x, k) => (k === round ? r : x)))} />
        {reads[round] && round < 2 && (
          <button className="btn-primary mt-5" onClick={() => setRound(round + 1)}>Patient suivant <ArrowRight className="h-4 w-4" /></button>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
        <h3 className="font-display text-lg font-bold">Méthode</h3>
        <ol className="mt-3 space-y-1.5 text-sm text-white/70">
          <li>1. Patient assis, au repos depuis 5 minutes, bras soutenu.</li>
          <li>2. Brassard adapté, 2 cm au-dessus du pli du coude.</li>
          <li>3. Gonfler 30 mmHg au-delà de la disparition du pouls radial.</li>
          <li>4. Dégonfler à 2–3 mmHg par seconde.</li>
          <li>5. Systolique = 1ᵉʳ bruit ; diastolique = disparition des bruits.</li>
        </ol>
        {done && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-white/10 pt-5">
            <p className="flex items-end justify-between"><span className="font-semibold">Précision</span><span className="font-display text-4xl font-bold">{score}<span className="text-base text-white/50">/100</span></span></p>
            <ul className="mt-3 space-y-1 text-sm text-white/70">
              {errors.map((e, k) => <li key={k}>Patient {k + 1} : {e === null ? "lecture incomplète" : `écart total ${e} mmHg`}</li>)}
            </ul>
            <button className="btn-ghost mt-4 w-full" onClick={() => { setReads([null, null, null]); setRound(0); }}><RotateCcw className="h-4 w-4" /> Recommencer</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── IV drip rates ─────────────────────────

const DRIP_Q = [
  { serum: "Sérum salé 0,9 %", ml: 500, h: 1, ctx: "Remplissage d'un patient déshydraté" },
  { serum: "Sérum glucosé 5 %", ml: 1000, h: 8, ctx: "Garde-veine sur la nuit" },
  { serum: "Ringer lactate", ml: 500, h: 2, ctx: "Entretien post-opératoire" },
  { serum: "Sérum salé 0,9 %", ml: 250, h: 0.5, ctx: "Bolus rapide sur prescription" },
  { serum: "Sérum glucosé 5 %", ml: 1000, h: 24, ctx: "Apports de base sur 24 h" },
];

export function DripWorkshop() {
  const [k, setK] = useState(0);
  const [val, setVal] = useState("");
  const [results, setResults] = useState<(boolean | null)[]>(DRIP_Q.map(() => null));
  const q = DRIP_Q[k];
  const right = dropsPerMin(q.ml, q.h);
  const answered = results[k] !== null;
  const typed = Number(val.replace(",", "."));
  const shownRate = answered ? right : Number.isFinite(typed) && typed > 0 ? typed : 0;
  const score = useMemo(() => results.filter(Boolean).length, [results]);
  const finished = results.every((r) => r !== null);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-semibold">Prescription {k + 1} / {DRIP_Q.length}</p>
          <div className="flex gap-1.5">
            {results.map((r, j) => <span key={j} className={`h-2 w-6 rounded-full ${j === k ? "bg-[#38e1ff]" : r === null ? "bg-white/15" : r ? "bg-emerald-400/80" : "bg-red-400/80"}`} />)}
          </div>
        </div>
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <DripBag label={q.serum} rate={shownRate} running={shownRate > 0} />
          <div>
            <p className="text-sm text-white/55">{q.ctx}</p>
            <p className="mt-1 font-display text-2xl font-bold">{q.serum} · {q.ml} mL en {q.h < 1 ? "30 min" : `${q.h} h`}</p>
            <p className="mt-2 text-sm text-white/65">Perfuseur standard : 20 gouttes = 1 mL. Combien de gouttes par minute ?</p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!val || answered) return;
                setResults((r) => r.map((x, j) => (j === k ? Math.abs(typed - right) <= 2 : x)));
              }}
            >
              <input value={val} onChange={(e) => setVal(e.target.value)} disabled={answered} inputMode="decimal" placeholder="gouttes/min" className="w-40 rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-white placeholder:text-white/30 focus:border-[#2f86ff] focus:outline-none" aria-label="Gouttes par minute" />
              <button className="btn-primary" disabled={!val || answered}>Vérifier</button>
            </form>
            {answered && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-lg px-4 py-3 text-sm ${results[k] ? "bg-emerald-500/15 text-emerald-100" : "bg-red-500/15 text-red-100"}`}>
                <p className="flex items-center gap-2 font-semibold">{results[k] ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {results[k] ? "Correct" : `Réponse attendue : ${right} gouttes/min`}</p>
                <p className="mt-1 font-mono text-xs opacity-80">{q.ml} mL × 20 ÷ ({q.h} h × 60 min) = {(q.ml * 20) / (q.h * 60)} ≈ {right} gouttes/min · soit {Math.round(q.ml / q.h)} mL/h</p>
              </motion.div>
            )}
            {answered && k < DRIP_Q.length - 1 && (
              <button className="btn-primary mt-4" onClick={() => { setK(k + 1); setVal(""); }}>Prescription suivante <ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
        <h3 className="font-display text-lg font-bold">La formule</h3>
        <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-center font-mono text-sm">gouttes/min = volume (mL) × 20 ÷ durée (min)</p>
        <p className="mt-3 text-sm text-white/65">Astuce : 1 000 mL sur 24 h ≈ 14 gouttes/min ; 500 mL sur 1 h ≈ 167 gouttes/min (trop rapide pour un réglage à l&apos;œil : pompe ou débitmètre conseillés).</p>
        {finished && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 border-t border-white/10 pt-5">
            <p className="flex items-end justify-between"><span className="font-semibold">Score</span><span className="font-display text-4xl font-bold">{score}<span className="text-base text-white/50">/{DRIP_Q.length}</span></span></p>
            <button className="btn-ghost mt-4 w-full" onClick={() => { setK(0); setVal(""); setResults(DRIP_Q.map(() => null)); }}><RotateCcw className="h-4 w-4" /> Recommencer</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
