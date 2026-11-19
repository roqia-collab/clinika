"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Plus, Save, Trash2 } from "@/components/icons";
import { DIFFICULTIES, INVESTIGATIONS, PHYSICAL_EXAMS, SPECIALTIES, TOPICS } from "@/lib/catalog";
import { api } from "@/lib/client";
import type { CaseContent, Difficulty, Emotion } from "@/lib/sim/types";
import { PatientAvatar } from "@/components/sim/patient-avatar";

export interface EditorValue {
  meta: { slug: string; title: string; specialty: string; difficulty: Difficulty; summary: string; objectives: string[]; minutes: number; freeTier: boolean };
  content: CaseContent;
}

const TABS = ["Général", "Patient", "Interrogatoire", "Examen clinique", "Examens compl.", "Diagnostic", "Prise en charge et grille"] as const;
const EMOTIONS: Emotion[] = ["neutral", "anxious", "pain", "distressed", "tired", "relieved", "irritated"];
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function CaseEditor({ initial, id, readOnly }: { initial: EditorValue; id?: string; readOnly?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<EditorValue>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Général");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const upd = (fn: (d: EditorValue) => void) =>
    setV((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  const c = v.content;
  const r = c.rubric;
  const weightSum = Object.values(r.weights).reduce((a, b) => a + Number(b || 0), 0);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const payload = { id, meta: { ...v.meta, objectives: v.meta.objectives.filter(Boolean) }, content: v.content };
      const res = await api<{ id: string; status: string; version: number }>("/api/cases", "POST", payload);
      setMsg({ ok: true, text: `Enregistré en v${res.version} (${res.status === "DRAFT" ? "brouillon" : res.status.toLowerCase()}).` });
      if (!id) router.push(`/teach/cases/${res.id}`);
      else router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel sticky top-16 z-10 flex flex-wrap items-center gap-2 p-2">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-brand-600 text-white" : "muted hover:bg-[rgb(var(--panel-2))]"}`}>
              {t}
            </button>
          ))}
        </div>
        {!readOnly && (
          <button className="btn-primary" disabled={busy} onClick={save}>
            <Save className="h-4 w-4" /> {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>
        )}
      </div>
      {msg && <p className={`rounded-xl px-4 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" : "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200"}`}>{msg.text}</p>}

      <fieldset disabled={readOnly} className="panel space-y-5 p-6">
        {tab === "Général" && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <F label="Titre">
                <input className="field" value={v.meta.title} onChange={(e) => upd((d) => { d.meta.title = e.target.value; if (!id && !initial.meta.slug) d.meta.slug = slugify(e.target.value); })} />
              </F>
              <F label="Identifiant (URL)">
                <input className="field font-mono" value={v.meta.slug} onChange={(e) => upd((d) => void (d.meta.slug = slugify(e.target.value)))} />
              </F>
              <F label="Spécialité">
                <select className="field" value={v.meta.specialty} onChange={(e) => upd((d) => void (d.meta.specialty = e.target.value))}>
                  {SPECIALTIES.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                </select>
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Niveau">
                  <select className="field" value={v.meta.difficulty} onChange={(e) => upd((d) => void (d.meta.difficulty = e.target.value as Difficulty))}>
                    {DIFFICULTIES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                  </select>
                </F>
                <F label="Minutes">
                  <input type="number" min={5} max={120} className="field" value={v.meta.minutes} onChange={(e) => upd((d) => void (d.meta.minutes = Number(e.target.value)))} />
                </F>
              </div>
            </div>
            <F label="Résumé affiché à l'étudiant (sans le diagnostic !)">
              <textarea className="field" rows={2} value={v.meta.summary} onChange={(e) => upd((d) => void (d.meta.summary = e.target.value))} />
            </F>
            <F label="Objectifs pédagogiques (un par ligne)">
              <textarea className="field" rows={4} value={v.meta.objectives.join("\n")} onChange={(e) => upd((d) => void (d.meta.objectives = e.target.value.split("\n")))} />
            </F>
            <div className="grid gap-4 md:grid-cols-2">
              <F label="Symptômes pour la recherche (séparés par des virgules)">
                <input className="field" value={c.symptoms.join(", ")} onChange={(e) => upd((d) => void (d.content.symptoms = csv(e.target.value)))} />
              </F>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" checked={v.meta.freeTier} onChange={(e) => upd((d) => void (d.meta.freeTier = e.target.checked))} /> Disponible dans la formule Gratuit
              </label>
            </div>
          </>
        )}

        {tab === "Patient" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <F label="Nom fictif"><input className="field" value={c.patient.name} onChange={(e) => upd((d) => void (d.content.patient.name = e.target.value))} /></F>
                <F label="Âge"><input type="number" className="field" value={c.patient.age} onChange={(e) => upd((d) => void (d.content.patient.age = Number(e.target.value)))} /></F>
                <F label="Sexe">
                  <select className="field" value={c.patient.sex} onChange={(e) => upd((d) => void (d.content.patient.sex = e.target.value as "F" | "M"))}>
                    <option value="F">Femme</option>
                    <option value="M">Homme</option>
                  </select>
                </F>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <F label="Profession"><input className="field" value={c.patient.occupation} onChange={(e) => upd((d) => void (d.content.patient.occupation = e.target.value))} /></F>
                <F label="Lieu"><input className="field" value={c.setting} onChange={(e) => upd((d) => void (d.content.setting = e.target.value))} placeholder="ex. Urgences d'un CHU d'Oran — 02h10" /></F>
              </div>
              <F label="Caractère et façon de parler (guide le personnage IA)">
                <textarea className="field" rows={3} value={c.patient.personality} onChange={(e) => upd((d) => void (d.content.patient.personality = e.target.value))} />
              </F>
              <div className="grid gap-4 md:grid-cols-4">
                <F label="Émotion de base">
                  <select className="field" value={c.patient.baselineEmotion} onChange={(e) => upd((d) => void (d.content.patient.baselineEmotion = e.target.value as Emotion))}>
                    {EMOTIONS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </F>
                <F label="Teint"><input type="color" className="field h-10 p-1" value={c.patient.avatar.skin} onChange={(e) => upd((d) => void (d.content.patient.avatar.skin = e.target.value))} /></F>
                <F label="Couleur des cheveux"><input type="color" className="field h-10 p-1" value={c.patient.avatar.hair} onChange={(e) => upd((d) => void (d.content.patient.avatar.hair = e.target.value))} /></F>
                <F label="Coiffure">
                  <select className="field" value={c.patient.avatar.hairStyle} onChange={(e) => upd((d) => void (d.content.patient.avatar.hairStyle = e.target.value as "short"))}>
                    {["short", "long", "bald", "child"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </F>
              </div>
              <F label="Première phrase (motif, tel que dit par le patient)">
                <input className="field" value={c.chiefComplaint.fr ?? c.chiefComplaint.en} onChange={(e) => upd((d) => void (d.content.chiefComplaint = { ...d.content.chiefComplaint, fr: e.target.value, en: d.content.chiefComplaint.en || e.target.value }))} />
              </F>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                {(["hr", "sbp", "dbp", "rr", "spo2", "temp"] as const).map((k) => (
                  <F key={k} label={k.toUpperCase()}>
                    <input type="number" step={k === "temp" ? 0.1 : 1} className="field" value={c.vitals[k]} onChange={(e) => upd((d) => void (d.content.vitals[k] = Number(e.target.value)))} />
                  </F>
                ))}
              </div>
              {(["pastMedical", "medications", "allergies", "family", "social"] as const).map((k) => (
                <F key={k} label={`Antécédents · ${({ pastMedical: "médicaux", medications: "traitements", allergies: "allergies", family: "familiaux", social: "mode de vie" } as Record<string, string>)[k]} (un par ligne)`}>
                  <textarea className="field" rows={2} value={c.history[k].join("\n")} onChange={(e) => upd((d) => void (d.content.history[k] = lines(e.target.value)))} />
                </F>
              ))}
            </div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 to-white dark:from-navy-800 dark:to-navy-900">
              <PatientAvatar config={c.patient.avatar} emotion={c.patient.baselineEmotion} speaking={false} age={c.patient.age} sex={c.patient.sex} />
            </div>
          </div>
        )}

        {tab === "Interrogatoire" && (
          <>
            <p className="subtle text-sm">Rédigez la réponse du patient pour chaque thème. Laissez vide pour une réponse négative plausible. Le champ EN est la base obligatoire ; FR et AR sont utilisés par le moteur hors ligne (le moteur IA traduit automatiquement).</p>
            {TOPICS.map((t) => {
              const val = c.interview[t.key];
              return (
                <div key={t.key} className="rounded-xl border border-[rgb(var(--line))] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{t.label} <span className="subtle text-xs font-normal">· {t.group}</span></p>
                    <select className="field w-auto py-1 text-xs" value={c.topicEmotions?.[t.key] ?? ""} onChange={(e) => upd((d) => { d.content.topicEmotions ??= {}; if (e.target.value) d.content.topicEmotions[t.key] = e.target.value as Emotion; else delete d.content.topicEmotions[t.key]; })} aria-label={`Émotion pour le thème ${t.label}`}>
                      <option value="">émotion : de base</option>
                      {EMOTIONS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    {(["en", "fr", "ar"] as const).map((l) => (
                      <textarea
                        key={l}
                        dir={l === "ar" ? "rtl" : "ltr"}
                        className="field text-xs"
                        rows={2}
                        placeholder={l === "en" ? `EN — ${t.fallback.en}` : l === "fr" ? (t.fallback.fr ?? "FR") : "AR (facultatif)"}
                        value={val?.[l] ?? ""}
                        onChange={(e) =>
                          upd((d) => {
                            const cur = d.content.interview[t.key] ?? { en: "" };
                            cur[l] = e.target.value;
                            if (!cur.en && !cur.fr && !cur.ar) delete d.content.interview[t.key];
                            else d.content.interview[t.key] = cur;
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "Examen clinique" && (
          <FindingsEditor
            catalog={PHYSICAL_EXAMS}
            values={Object.fromEntries(Object.entries(c.exam).map(([k, x]) => [k, { text: x.finding, abnormal: x.abnormal }]))}
            essential={r.essentialExams}
            onChange={(code, val) => upd((d) => { if (val) d.content.exam[code] = { finding: val.text, abnormal: val.abnormal }; else delete d.content.exam[code]; })}
            onEssential={(code, on) => upd((d) => void (d.content.rubric.essentialExams = on ? [...new Set([...d.content.rubric.essentialExams, code])] : d.content.rubric.essentialExams.filter((x) => x !== code)))}
          />
        )}

        {tab === "Examens compl." && (
          <FindingsEditor
            catalog={INVESTIGATIONS}
            values={Object.fromEntries(Object.entries(c.investigations).map(([k, x]) => [k, { text: x.result, abnormal: x.abnormal }]))}
            essential={r.essentialInvestigations}
            unnecessary={r.unnecessaryInvestigations}
            onChange={(code, val) => upd((d) => { if (val) d.content.investigations[code] = { result: val.text, abnormal: val.abnormal }; else delete d.content.investigations[code]; })}
            onEssential={(code, on) => upd((d) => { d.content.rubric.essentialInvestigations = on ? [...new Set([...d.content.rubric.essentialInvestigations, code])] : d.content.rubric.essentialInvestigations.filter((x) => x !== code); if (on) d.content.rubric.unnecessaryInvestigations = d.content.rubric.unnecessaryInvestigations.filter((x) => x !== code); })}
            onUnnecessary={(code, on) => upd((d) => { d.content.rubric.unnecessaryInvestigations = on ? [...new Set([...d.content.rubric.unnecessaryInvestigations, code])] : d.content.rubric.unnecessaryInvestigations.filter((x) => x !== code); if (on) d.content.rubric.essentialInvestigations = d.content.rubric.essentialInvestigations.filter((x) => x !== code); })}
          />
        )}

        {tab === "Diagnostic" && (
          <>
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Cette section n'est jamais transmise au moteur du patient. Elle sert uniquement à la notation et au feedback après soumission.
            </div>
            <F label="Diagnostic attendu"><input className="field" value={c.answer.diagnosis} onChange={(e) => upd((d) => void (d.content.answer.diagnosis = e.target.value))} /></F>
            <F label="Termes et synonymes acceptés (séparés par des virgules, toutes langues)"><input className="field" value={c.answer.acceptedTerms.join(", ")} onChange={(e) => upd((d) => void (d.content.answer.acceptedTerms = csv(e.target.value)))} /></F>
            <div>
              <p className="label">Diagnostics différentiels à évoquer</p>
              {c.answer.differentials.map((dd, i) => (
                <div key={i} className="mb-2 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                  <input className="field" placeholder="Nom" value={dd.name} onChange={(e) => upd((d) => void (d.content.answer.differentials[i].name = e.target.value))} />
                  <input className="field" placeholder="Termes acceptés, séparés par des virgules" value={dd.terms.join(", ")} onChange={(e) => upd((d) => void (d.content.answer.differentials[i].terms = csv(e.target.value)))} />
                  <button type="button" className="btn-ghost px-3" onClick={() => upd((d) => void d.content.answer.differentials.splice(i, 1))} aria-label="Retirer le différentiel"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={() => upd((d) => void d.content.answer.differentials.push({ name: "", terms: [] }))}><Plus className="h-3.5 w-3.5" /> Ajouter un différentiel</button>
            </div>
            <F label="Points pédagogiques (un par ligne)"><textarea className="field" rows={5} value={c.answer.teachingPoints.join("\n")} onChange={(e) => upd((d) => void (d.content.answer.teachingPoints = lines(e.target.value)))} /></F>
          </>
        )}

        {tab === "Prise en charge et grille" && (
          <>
            <div>
              <p className="label">Options de prise en charge proposées à l&apos;étudiant</p>
              {r.management.options.map((o, i) => (
                <div key={i} className="mb-2 grid gap-2 rounded-xl border border-[rgb(var(--line))] p-2 md:grid-cols-[140px_2fr_150px_2fr_auto]">
                  <input className="field font-mono text-xs" placeholder="code" value={o.code} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].code = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")))} />
                  <input className="field" placeholder="Libellé" value={o.label} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].label = e.target.value))} />
                  <select className="field" value={o.kind} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].kind = e.target.value as "essential"))}>
                    {([["essential", "essentielle"], ["appropriate", "appropriée"], ["neutral", "neutre"], ["contraindicated", "contre-indiquée"]] as const).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <input className="field" placeholder="Justification (affichée dans le feedback)" value={o.rationale} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].rationale = e.target.value))} />
                  <button type="button" className="btn-ghost px-3" onClick={() => upd((d) => void d.content.rubric.management.options.splice(i, 1))} aria-label="Retirer l'option"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={() => upd((d) => void d.content.rubric.management.options.push({ code: `option_${d.content.rubric.management.options.length + 1}`, label: "", kind: "appropriate", rationale: "" }))}><Plus className="h-3.5 w-3.5" /> Ajouter une option</button>
            </div>
            <div>
              <p className="label">Thèmes clés de l&apos;interrogatoire et pondérations</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TOPICS.filter((t) => t.key !== "greeting").map((t) => {
                  const kt = r.keyTopics.find((x) => x.topic === t.key);
                  return (
                    <label key={t.key} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--line))] px-3 py-1.5 text-sm">
                      <input type="checkbox" checked={!!kt} onChange={(e) => upd((d) => void (d.content.rubric.keyTopics = e.target.checked ? [...d.content.rubric.keyTopics, { topic: t.key, weight: 1 }] : d.content.rubric.keyTopics.filter((x) => x.topic !== t.key)))} />
                      <span className="flex-1">{t.label}</span>
                      {kt && <input type="number" min={1} max={10} className="field w-16 px-2 py-1 text-xs" value={kt.weight} onChange={(e) => upd((d) => void (d.content.rubric.keyTopics.find((x) => x.topic === t.key)!.weight = Number(e.target.value)))} aria-label={`Pondération pour ${t.label}`} />}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="label">Pondération des catégories (total 100 — actuellement <span className={weightSum === 100 ? "text-success" : "text-danger"}>{weightSum}</span>)</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {(Object.keys(r.weights) as (keyof typeof r.weights)[]).map((k) => (
                  <F key={k} label={({ history: "interrogatoire", exam: "examen", investigations: "examens compl.", diagnosis: "diagnostic", management: "prise en charge" } as Record<string, string>)[k]}>
                    <input type="number" min={0} max={100} className="field" value={r.weights[k]} onChange={(e) => upd((d) => void (d.content.rubric.weights[k] = Number(e.target.value)))} />
                  </F>
                ))}
              </div>
            </div>
          </>
        )}
      </fieldset>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function FindingsEditor({
  catalog, values, essential, unnecessary, onChange, onEssential, onUnnecessary,
}: {
  catalog: { code: string; name: string; category: string; normal: string }[];
  values: Record<string, { text: string; abnormal: boolean }>;
  essential: string[];
  unnecessary?: string[];
  onChange: (code: string, v: { text: string; abnormal: boolean } | null) => void;
  onEssential: (code: string, on: boolean) => void;
  onUnnecessary?: (code: string, on: boolean) => void;
}) {
  return (
    <>
      <p className="subtle text-sm">Les éléments sans résultat personnalisé renvoient le résultat normal du catalogue. Marquez les éléments essentiels (récompensés){onUnnecessary ? " ou inutiles (pénalisés)" : ""}.</p>
      <div className="space-y-2">
        {catalog.map((it) => {
          const v = values[it.code];
          return (
            <div key={it.code} className="rounded-xl border border-[rgb(var(--line))] p-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex-1 text-sm font-semibold">
                  {it.name} <span className="subtle text-xs font-normal">· {it.category}</span>
                </p>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={essential.includes(it.code)} onChange={(e) => onEssential(it.code, e.target.checked)} /> Essentiel</label>
                {onUnnecessary && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!unnecessary?.includes(it.code)} onChange={(e) => onUnnecessary(it.code, e.target.checked)} /> Inutile</label>}
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!v?.abnormal} disabled={!v} onChange={(e) => onChange(it.code, { text: v!.text, abnormal: e.target.checked })} /> Anormal</label>
              </div>
              <textarea className="field mt-2 text-xs" rows={v ? 2 : 1} placeholder={`Par défaut : ${it.normal}`} value={v?.text ?? ""} onChange={(e) => onChange(it.code, e.target.value ? { text: e.target.value, abnormal: v?.abnormal ?? true } : null)} />
            </div>
          );
        })}
      </div>
    </>
  );
}
