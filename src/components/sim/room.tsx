"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Brain, Check, CheckCircle2, ClipboardCheck, Clock, Baby, Drop, EyeIcon, Eyeglasses, FlaskConical, Flashlight, Gauge, GenderFemale, HandPalm, Hammer, Info, MagnifyingGlassPlus, Syringe, Wind, Loader2, MessagesSquare, Mic, MicOff, NotebookPen, Plus, Activity, Send, SignOut, Stethoscope, Trash2, Volume2, VolumeX, X,
} from "@/components/icons";
import { INVESTIGATIONS, PHYSICAL_EXAMS, TOPICS } from "@/lib/catalog";
import { api } from "@/lib/client";
import { LANGS, type Emotion, type Lang, type Vitals } from "@/lib/sim/types";
import { type AvatarConfig } from "./patient-avatar";
import dynamic from "next/dynamic";

const PatientAvatar3D = dynamic(() => import("./patient-avatar-3d").then((m) => m.PatientAvatar3D), { ssr: false, loading: () => <div className="grid h-full w-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div> });
import { Photo } from "@/components/motion";
import type { PhotoKey } from "@/lib/photos";
import { VitalsMonitor } from "./vitals-monitor";
import { BloodPressureTool, DripBag, GlucoseTool, PeakFlowTool, dropsPerMin } from "./bedside-tools";
import { ecgSpecFromText } from "@/lib/ecg/from-text";

const EcgPaper = dynamic(() => import("@/components/ecg/ecg-paper").then((m) => m.EcgPaper), { ssr: false });
import { browserVoice, type VoiceProvider } from "./voice";

export interface RoomProps {
  session: { id: string; stage: string; language: Lang; aiMode: "anthropic" | "groq" | "demo"; startedAt: string; notes: string; topicsCovered: string[] };
  caseInfo: { title: string; slug: string; setting: string; minutes: number; specialty: string; pregnant?: boolean };
  patient: { name: string; age: number; sex: "F" | "M"; occupation: string; avatar: AvatarConfig; baselineEmotion: Emotion };
  vitals: Vitals;
  history: { pastMedical: string[]; medications: string[]; allergies: string[]; family: string[]; social: string[] };
  messages: { id: string; role: "student" | "patient"; content: string; emotion: string | null }[];
  exams: { code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; at: string }[];
  managementOptions: { code: string; label: string }[];
  voiceAllowed: boolean;
}

const EMOTION_FR: Record<string, string> = { neutral: "calme", anxious: "anxieux", pain: "douloureux", distressed: "en détresse", tired: "fatigué", relieved: "soulagé", irritated: "agacé" };

/** Stages persisted on the session (unchanged server contract). */
const STAGES = [
  { key: "INTERVIEW", label: "Interrogatoire" },
  { key: "EXAM", label: "Examen clinique" },
  { key: "INVESTIGATIONS", label: "Examens compl." },
  { key: "REASONING", label: "Raisonnement" },
  { key: "MANAGEMENT", label: "Prise en charge" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

type IconT = React.ComponentType<{ className?: string; weight?: "regular" | "fill" | "duotone" }>;
/** Left tool rail. A tool maps to a stage and, for the bedside exam, to catalogue categories and/or exam codes. */
type ToolKey =
  | "talk" | "observe" | "palpate" | "auscultate" | "neuro" | "vitals" | "bp" | "glucose" | "care"
  | "acuity" | "slitlamp" | "ophthalmoscope" | "tonometer" | "obstetric" | "speculum" | "tv" | "percuss" | "peakflow"
  | "labs" | "dx" | "plan";
type Tool = { key: ToolKey; label: string; icon: IconT; stage: StageKey; categories?: string[]; codes?: string[] };

const ALL_TOOLS: Record<ToolKey, Tool> = {
  talk: { key: "talk", label: "Dialogue", icon: MessagesSquare, stage: "INTERVIEW" },
  observe: { key: "observe", label: "Observer", icon: EyeIcon, stage: "EXAM", categories: ["Général", "Dermatologie", "ORL", "Endocrinien", "Ophtalmologique"] },
  palpate: { key: "palpate", label: "Palper", icon: HandPalm, stage: "EXAM", categories: ["Abdominal", "Gynécologique", "Ostéo-articulaire"] },
  auscultate: { key: "auscultate", label: "Ausculter", icon: Stethoscope, stage: "EXAM", categories: ["Cardiovasculaire", "Respiratoire"] },
  neuro: { key: "neuro", label: "Neuro", icon: Hammer, stage: "EXAM", categories: ["Neurologique"] },
  vitals: { key: "vitals", label: "Constantes", icon: Activity, stage: "EXAM" },
  bp: { key: "bp", label: "Tension", icon: Gauge, stage: "EXAM" },
  glucose: { key: "glucose", label: "Glycémie", icon: Drop, stage: "EXAM" },
  care: { key: "care", label: "Soins", icon: Syringe, stage: "MANAGEMENT" },
  // Ophtalmologie
  acuity: { key: "acuity", label: "Monoyer", icon: Eyeglasses, stage: "EXAM", codes: ["eye_acuity"] },
  slitlamp: { key: "slitlamp", label: "Lampe à fente", icon: MagnifyingGlassPlus, stage: "EXAM", codes: ["eye_slitlamp"] },
  ophthalmoscope: { key: "ophthalmoscope", label: "Ophtalmo­scope", icon: Flashlight, stage: "EXAM", codes: ["eye_pupils", "eye_fundus"] },
  tonometer: { key: "tonometer", label: "Tonomètre", icon: Gauge, stage: "EXAM", codes: ["eye_iop"] },
  // Gynécologie-obstétrique
  obstetric: { key: "obstetric", label: "Obstétrique", icon: Baby, stage: "EXAM", codes: ["obs_exam"] },
  speculum: { key: "speculum", label: "Spéculum", icon: GenderFemale, stage: "EXAM", codes: ["gyn_speculum"] },
  tv: { key: "tv", label: "Toucher vaginal", icon: HandPalm, stage: "EXAM", codes: ["gyn_tv"] },
  // Pneumologie
  percuss: { key: "percuss", label: "Percuter", icon: Hammer, stage: "EXAM", codes: ["resp_percussion"] },
  peakflow: { key: "peakflow", label: "Débitmètre", icon: Wind, stage: "EXAM" },
  labs: { key: "labs", label: "Examens", icon: FlaskConical, stage: "INVESTIGATIONS" },
  dx: { key: "dx", label: "Diagnostic", icon: Brain, stage: "REASONING" },
  plan: { key: "plan", label: "Conduite", icon: ClipboardCheck, stage: "MANAGEMENT" },
};

type KitItem = ToolKey | (Partial<Tool> & { key: ToolKey });
const END: ToolKey[] = ["labs", "dx", "plan"];
/** Each specialty gets the instruments a clinician would actually pick up for that patient. */
const KITS: Record<string, KitItem[]> = {
  default: ["talk", "observe", "palpate", "auscultate", "neuro", "vitals", "bp", "glucose", "care", ...END],
  ophthalmology: ["talk", "acuity", "slitlamp", "ophthalmoscope", "tonometer", { key: "observe", label: "Inspection", categories: ["Général", "ORL"] }, "neuro", "vitals", { key: "care", label: "Traitements" }, ...END],
  gynecology: ["talk", { key: "observe", label: "Inspection", categories: ["Général"] }, "bp", { key: "palpate", label: "Abdomen", categories: ["Abdominal"] }, "obstetric", "speculum", "tv", { key: "neuro", label: "Réflexes" }, "vitals", "care", ...END],
  pulmonology: ["talk", { key: "observe", label: "Inspection", categories: ["Général"], codes: ["resp_insp"] }, { key: "auscultate", categories: ["Cardiovasculaire"], codes: ["resp_ausc"] }, "percuss", "peakflow", { key: "vitals", label: "Oxymétrie" }, { key: "care", label: "Traitements" }, ...END],
  dermatology: ["talk", { key: "observe", label: "Dermatoscope", icon: MagnifyingGlassPlus, categories: ["Dermatologie", "Général"] }, "palpate", "vitals", "care", ...END],
};
const toolsFor = (specialty: string): Tool[] => (KITS[specialty] ?? KITS.default).map((k) => (typeof k === "string" ? ALL_TOOLS[k] : { ...ALL_TOOLS[k.key], ...k }));
const toolMatches = (t: { codes?: string[]; categories?: string[] }, code: string) => !!t.codes?.includes(code) || !!t.categories?.includes(PHYSICAL_EXAMS.find((x) => x.code === code)?.category ?? "");
const BEDSIDE_STAGES: StageKey[] = ["INTERVIEW", "EXAM"];
const INSTRUMENTS: ToolKey[] = ["bp", "glucose", "care", "peakflow"];

const QUICK: Record<Lang, string[]> = {
  en: ["What brings you in today?", "When did it start?", "Can you describe it?", "Any other symptoms?", "Do you have any medical conditions?", "Do you take any medications?", "Any allergies?", "Do you smoke or drink alcohol?", "Any illnesses in your family?", "What are you most worried about?"],
  fr: ["Bonjour, je suis l'étudiant(e) en médecine. Qu'est-ce qui vous amène ?", "Depuis quand ?", "Pouvez-vous décrire la douleur ?", "Est-ce que ça irradie ?", "Avez-vous d'autres symptômes ?", "Avez-vous des antécédents médicaux ?", "Prenez-vous des médicaments ?", "Avez-vous des allergies ?", "Vous fumez ? La chemma ?", "Des maladies dans la famille ?", "Qu'est-ce qui vous inquiète ?"],
  ar: ["ما الذي أتى بك اليوم؟", "متى بدأ ذلك؟", "هل يمكنك أن تصف الألم؟", "هل لديك أعراض أخرى؟", "هل لديك أمراض مزمنة؟", "هل تتناول أي أدوية؟", "هل لديك حساسية؟", "هل تدخن؟", "هل هناك أمراض في العائلة؟", "ما الذي يقلقك أكثر؟"],
};

export function ConsultationRoom(props: RoomProps) {
  const router = useRouter();
  const { session, patient } = props;
  const initialStage = (STAGES.find((s) => s.key === session.stage)?.key ?? "INTERVIEW") as StageKey;
  const TOOLS = useMemo(() => toolsFor(props.caseInfo.specialty), [props.caseInfo.specialty]);
  const [tool, setTool] = useState<ToolKey>(TOOLS.find((t) => t.stage === initialStage)?.key ?? "talk");
  const [messages, setMessages] = useState(props.messages);
  const [exams, setExams] = useState(props.exams);
  const [covered, setCovered] = useState<string[]>(session.topicsCovered);
  const baseEmotion = (props.messages.filter((m) => m.role === "patient").at(-1)?.emotion as Emotion) ?? patient.baselineEmotion;
  const [emotion, setEmotion] = useState<Emotion>(baseEmotion);
  const [lang, setLang] = useState<Lang>(session.language);
  const [error, setError] = useState("");
  const [engineNote, setEngineNote] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [side, setSide] = useState<"chat" | "file" | "notes">("chat");
  const [speaking, setSpeaking] = useState(false);
  const [lastResult, setLastResult] = useState<RoomProps["exams"][number] | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reasoning & management drafts (kept locally until submission).
  const draftKey = `medsim-draft-${session.id}`;
  const [ddx, setDdx] = useState<string[]>([]);
  const [finalDx, setFinalDx] = useState("");
  const [justification, setJustification] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [mgmtNotes, setMgmtNotes] = useState("");
  const [careLog, setCareLog] = useState<string[]>([]);
  const logCare = (line: string) => {
    const at = new Date().toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" });
    setCareLog((l) => [...l, `${at} — ${line}`]);
    setMgmtNotes((n) => `${n ? `${n}\n` : ""}• Soin (${at}) : ${line}`);
  };
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      if (d) {
        setDdx(d.ddx ?? []);
        setFinalDx(d.finalDx ?? "");
        setJustification(d.justification ?? "");
        setActions(d.actions ?? []);
        setMgmtNotes(d.mgmtNotes ?? "");
      }
    } catch {}
  }, [draftKey]);
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ddx, finalDx, justification, actions, mgmtNotes }));
    } catch {}
  }, [draftKey, ddx, finalDx, justification, actions, mgmtNotes]);

  const current = TOOLS.find((t) => t.key === tool) ?? TOOLS[0];
  const stage = current.stage;
  const lastStage = useRef<StageKey>(initialStage);
  const pickTool = useCallback(
    (k: ToolKey) => {
      const t = TOOLS.find((x) => x.key === k);
      if (!t) return; // not part of this case's kit
      setTool(k);
      const s = t.stage;
      if (s !== lastStage.current) {
        lastStage.current = s;
        api(`/api/sessions/${session.id}`, "PATCH", { stage: s }).catch(() => {});
      }
      if (k === "talk") {
        setSide("chat");
        // On phones the dialogue sits below the patient: bring it into view.
        if (typeof window !== "undefined" && window.innerWidth < 1024) setTimeout(() => document.getElementById("patient-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    },
    [session.id, TOOLS],
  );
  const changeLang = (l: Lang) => {
    setLang(l);
    api(`/api/sessions/${session.id}`, "PATCH", { language: l }).catch(() => {});
  };

  const physical = exams.filter((e) => e.kind === "PHYSICAL");
  const investigations = exams.filter((e) => e.kind === "INVESTIGATION");
  const questions = messages.filter((m) => m.role === "student").length;
  const lastPatient = messages.filter((m) => m.role === "patient").at(-1);
  const toolIdx = TOOLS.findIndex((t) => t.key === tool);

  function onExamDone(e: RoomProps["exams"][number]) {
    setExams((x) => [...x, e]);
    setLastResult(e);
    // The patient reacts to an examination that finds something (e.g. a tender abdomen).
    if (e.abnormal && e.kind === "PHYSICAL") {
      setEmotion("pain");
      if (reactTimer.current) clearTimeout(reactTimer.current);
      reactTimer.current = setTimeout(() => setEmotion((cur) => (cur === "pain" ? baseEmotion : cur)), 3500);
    }
  }

  async function submit() {
    setError("");
    try {
      const r = await api<{ url: string }>(`/api/sessions/${session.id}/submit`, "POST", { differentials: ddx, finalDiagnosis: finalDx, justification, managementActions: actions, managementNotes: mgmtNotes });
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.push(r.url);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setShowSubmit(false);
    }
  }

  async function abandon() {
    if (!confirm("Quitter cette consultation ? Elle sera marquée comme abandonnée et ne sera pas notée.")) return;
    await api(`/api/sessions/${session.id}`, "DELETE").catch(() => {});
    router.push(`/app/cases/${props.caseInfo.slug}`);
  }

  const bedside = BEDSIDE_STAGES.includes(current.stage) || INSTRUMENTS.includes(current.key);

  return (
    <div className="dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#050c1a] text-[rgb(var(--ink))] lg:overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center gap-x-2 border-b border-white/10 bg-[#081427] px-3 py-2.5 sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:px-5">
        <button onClick={abandon} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white" title="Quitter la consultation (non notée)">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Quitter</span>
        </button>
        <div className="hidden h-6 w-px bg-white/10 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold text-white">{props.caseInfo.title}</p>
          <p className="truncate text-xs text-white/50">{props.caseInfo.setting}</p>
        </div>
        <Timer startedAt={session.startedAt} minutes={props.caseInfo.minutes} />
        <select value={lang} onChange={(e) => changeLang(e.target.value as Lang)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white" aria-label="Langue de la consultation">
          {LANGS.map((l) => (
            <option key={l.code} value={l.code} className="bg-[#081427]">{l.label}</option>
          ))}
        </select>
        <button onClick={() => setShowSubmit(true)} aria-label="Terminer la consultation" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-500/70 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
          <SignOut className="h-4 w-4" /> <span className="hidden sm:inline">Terminer</span>
        </button>
      </header>

      <div className="grid gap-3 p-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[84px_minmax(0,1fr)_380px]">
        {/* ── Tool rail ── */}
        <nav className="sticky top-0 z-30 flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0a1830] p-1.5 shadow-lg [scrollbar-width:none] lg:static lg:flex-col lg:overflow-y-auto lg:bg-[#0a1830]/90 lg:shadow-none" aria-label="Outils de consultation">
          {TOOLS.map((t, i) => {
            const on = t.key === tool;
            const done =
              t.key === "dx" ? finalDx.trim().length > 1
              : t.key === "plan" ? actions.length > 0
              : t.key === "labs" ? investigations.length > 0
              : t.key === "talk" ? questions > 0
              : t.key === "bp" ? physical.some((x) => x.code === "bp_manual")
              : t.key === "glucose" ? investigations.some((x) => x.code === "glucose")
              : t.key === "care" ? careLog.length > 0
              : t.key === "peakflow" ? investigations.some((x) => x.code === "peak_flow")
              : t.codes || t.categories ? physical.some((p) => toolMatches(t, p.code))
              : false;
            return (
              <div key={t.key} className="contents">
                {t.key === "labs" && i > 0 && <div className="mx-2 my-1 hidden h-px shrink-0 bg-white/10 lg:block" />}
                <button onClick={() => pickTool(t.key)} aria-current={on ? "true" : undefined} className={`relative flex min-w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-[11px] font-medium transition ${on ? "bg-[#0a5be0]/25 text-white ring-1 ring-[#2f86ff]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                  <t.icon className={`h-6 w-6 ${on ? "text-[#6fb1ff]" : ""}`} weight={on ? "duotone" : "regular"} />
                  {t.label}
                  {done && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label="fait" />}
                </button>
              </div>
            );
          })}
        </nav>

        {/* ── Centre ── */}
        <section className="relative flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830] sm:min-h-[520px]">
          {error && (
            <div className="absolute inset-x-3 top-3 z-30 flex items-start gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/40 backdrop-blur" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} aria-label="Fermer"><X className="h-4 w-4" /></button>
            </div>
          )}
          {bedside ? (
            <BedsideStage
              {...props}
              emotion={emotion}
              speaking={speaking}
              bubble={tool === "talk" || speaking ? lastPatient?.content : undefined}
              tool={current}
              kit={TOOLS}
              onPickTool={pickTool}
              care={<CarePanel options={props.managementOptions} actions={actions} setActions={setActions} log={careLog} onLog={logCare} />}
              doneCodes={new Set(physical.map((p) => p.code))}
              onExamDone={onExamDone}
              lastResult={lastResult}
              clearResult={() => setLastResult(null)}
              setError={setError}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {stage === "INVESTIGATIONS" && <ExamPanel sessionId={session.id} kind="INVESTIGATION" done={investigations} onDone={onExamDone} setError={setError} />}
              {stage === "REASONING" && <ReasoningPanel ddx={ddx} setDdx={setDdx} finalDx={finalDx} setFinalDx={setFinalDx} justification={justification} setJustification={setJustification} />}
              {stage === "MANAGEMENT" && <ManagementPanel options={props.managementOptions} actions={actions} setActions={setActions} notes={mgmtNotes} setNotes={setMgmtNotes} />}
            </div>
          )}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-[#081427] px-3 py-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-30" disabled={toolIdx === 0} onClick={() => pickTool(TOOLS[toolIdx - 1].key)}>
              <ArrowLeft className="h-3.5 w-3.5" /> {toolIdx > 0 ? TOOLS[toolIdx - 1].label : "Précédent"}
            </button>
            <ol className="hidden items-center gap-1.5 sm:flex" aria-label="Étapes">
              {STAGES.map((s) => (
                <li key={s.key} title={s.label} className={`h-1.5 rounded-full transition-all ${s.key === stage ? "w-6 bg-[#2f86ff]" : "w-1.5 bg-white/20"}`} />
              ))}
            </ol>
            {toolIdx < TOOLS.length - 1 ? (
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => pickTool(TOOLS[toolIdx + 1].key)}>
                {TOOLS[toolIdx + 1].label} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setShowSubmit(true)}>
                Terminer et évaluer <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ── Patient side panel ── */}
        <aside id="patient-panel" className="flex h-[78vh] min-h-[520px] scroll-mt-20 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830]/95 lg:h-auto lg:min-h-0">
          <PatientTile patient={patient} emotion={emotion} speaking={speaking} />
          <div className="grid grid-cols-3 border-b border-white/10 text-sm" role="tablist">
            {([["chat", "Dialogue"], ["file", "Dossier"], ["notes", "Notes"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={side === k} onClick={() => setSide(k)} className={`-mb-px border-b-2 py-2.5 font-medium transition ${side === k ? "border-[#2f86ff] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {side === "chat" && (
              <ChatPanel
                sessionId={session.id}
                lang={lang}
                messages={messages}
                setMessages={setMessages}
                onPatient={(e, topics, note, reply) => {
                  if (reply) {
                    setSpeaking(true);
                    if (speakTimer.current) clearTimeout(speakTimer.current);
                    speakTimer.current = setTimeout(() => setSpeaking(false), Math.min(9000, 900 + reply.length * 55));
                  }
                  setEmotion(e);
                  setCovered(topics);
                  setEngineNote(note ?? "");
                }}
                engineNote={engineNote}
                voiceAllowed={props.voiceAllowed}
                setError={setError}
              />
            )}
            {side === "file" && (
              <div className="h-full space-y-4 overflow-y-auto p-4">
                <PatientFile {...props} covered={covered} />
                <FindingsPanel exams={exams} />
              </div>
            )}
            {side === "notes" && (
              <div className="h-full overflow-y-auto p-4">
                <NotesPanel sessionId={session.id} initial={session.notes} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {showSubmit && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmit(false)} />
          <div className="panel relative w-full max-w-lg p-6">
            <h2 id="submit-title" className="text-xl font-bold">Terminer la consultation ?</h2>
            <p className="muted mt-1 text-sm">Vos réponses seront notées selon la grille du cas. Vous ne pourrez plus les modifier.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <Check2 ok={questions >= 5} label={`${questions} question(s) posée(s)`} />
              <Check2 ok={physical.length > 0} label={`${physical.length} geste(s) d'examen réalisé(s)`} />
              <Check2 ok={investigations.length > 0} label={`${investigations.length} examen(s) complémentaire(s) demandé(s)`} warn />
              <Check2 ok={ddx.length > 0} label={`${ddx.length} diagnostic(s) différentiel(s)`} />
              <Check2 ok={finalDx.trim().length >= 2} label={finalDx ? `Diagnostic retenu : ${finalDx}` : "Diagnostic retenu manquant (obligatoire)"} />
              <Check2 ok={actions.length > 0} label={`${actions.length} action(s) de prise en charge`} />
            </ul>
            {finalDx.trim().length < 2 && (
              <button className="mt-3 text-sm font-medium text-[#6fb1ff] hover:underline" onClick={() => { setShowSubmit(false); pickTool("dx"); }}>
                Saisir mon diagnostic →
              </button>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setShowSubmit(false)}>Continuer</button>
              <SubmitButton disabled={finalDx.trim().length < 2} onClick={submit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Bedside stage ─────────────────────────

type Zone = { key: string; label: string; tool: ToolKey; categories?: string[]; codes?: string[]; at: [number, number] };
type Scene = { photo: PhotoKey; ratio: number; zones: Zone[]; bubbleAt: [number, number]; kind: "body" | "eye" | "pregnancy" };

/** Body zones on a bedside photo; positions measured on each image, in %. */
const body = (pos: Record<"head" | "heart" | "lungs" | "abdomen" | "limbs", [number, number]>): Zone[] => [
  { key: "head", label: "Tête et cou", tool: "observe", categories: ["Général", "ORL", "Ophtalmologique", "Dermatologie", "Endocrinien"], at: pos.head },
  { key: "heart", label: "Cœur", tool: "auscultate", categories: ["Cardiovasculaire"], at: pos.heart },
  { key: "lungs", label: "Poumons", tool: "auscultate", categories: ["Respiratoire"], at: pos.lungs },
  { key: "abdomen", label: "Abdomen et pelvis", tool: "palpate", categories: ["Abdominal", "Gynécologique"], at: pos.abdomen },
  { key: "limbs", label: "Membres · neuro", tool: "neuro", categories: ["Neurologique", "Ostéo-articulaire"], at: pos.limbs },
];

/** Real photographs (see lib/photos.ts). */
const SCENES: Record<"man" | "woman" | "child" | "eye" | "pregnancy", Scene> = {
  man: { kind: "body", photo: "bedMan", ratio: 4 / 3, bubbleAt: [52, 13], zones: body({ head: [52, 13], heart: [37, 40], lungs: [26, 33], abdomen: [15, 58], limbs: [50, 64] }) },
  woman: { kind: "body", photo: "bedWoman", ratio: 3 / 2, bubbleAt: [47, 38], zones: body({ head: [47, 38], heart: [55, 64], lungs: [40, 64], abdomen: [50, 80], limbs: [72, 86] }) },
  child: { kind: "body", photo: "bedChild", ratio: 3 / 2, bubbleAt: [34, 45], zones: body({ head: [34, 45], heart: [50, 54], lungs: [43, 50], abdomen: [62, 64], limbs: [80, 58] }) },
  // Ophthalmology: close-up of the eye, each zone opens the matching gesture.
  eye: {
    kind: "eye",
    photo: "eyeClose",
    ratio: 3 / 2,
    bubbleAt: [8, 6],
    zones: [
      { key: "acuity", label: "Acuité visuelle", tool: "acuity", codes: ["eye_acuity"], at: [72, 84] },
      { key: "pupil", label: "Pupille · fond d'œil", tool: "ophthalmoscope", codes: ["eye_pupils", "eye_fundus"], at: [51, 48] },
      { key: "cornea", label: "Cornée · chambre antérieure", tool: "slitlamp", codes: ["eye_slitlamp"], at: [67, 35] },
      { key: "conj", label: "Conjonctive", tool: "slitlamp", codes: ["eye_slitlamp"], at: [18, 56] },
      { key: "globe", label: "Globe · tonus oculaire", tool: "tonometer", codes: ["eye_iop"], at: [86, 52] },
    ],
  },
  // Obstetrics: pregnant abdomen in profile.
  pregnancy: {
    kind: "pregnancy",
    photo: "pregnantBelly",
    ratio: 3 / 2,
    bubbleAt: [64, 8],
    zones: [
      { key: "fundus", label: "Hauteur utérine", tool: "obstetric", codes: ["obs_exam"], at: [37, 16] },
      { key: "fhr", label: "Bruits du cœur fœtal", tool: "obstetric", codes: ["obs_exam"], at: [44, 58] },
      { key: "abdomen", label: "Palpation abdominale", tool: "palpate", codes: ["abdo_palp"], at: [22, 40] },
      { key: "pelvis", label: "Examen au spéculum", tool: "speculum", codes: ["gyn_speculum"], at: [33, 86] },
      { key: "tv", label: "Toucher vaginal", tool: "tv", codes: ["gyn_tv"], at: [46, 84] },
    ],
  },
};
const bodyScene = (age: number, sex: "F" | "M") => SCENES[age < 12 ? "child" : sex === "F" ? "woman" : "man"];

function BedsideStage(p: RoomProps & {
  emotion: Emotion; speaking: boolean; bubble?: string; tool: Tool; kit: Tool[]; doneCodes: Set<string>; onPickTool: (k: ToolKey) => void; care: React.ReactNode;
  onExamDone: (e: RoomProps["exams"][number]) => void; lastResult: RoomProps["exams"][number] | null; clearResult: () => void; setError: (s: string) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [zoneKey, setZone] = useState<string | null>(null);
  // The case decides the scene: an eye close-up, a pregnant belly, or the patient in bed.
  const special: "eye" | "pregnancy" | null = p.caseInfo.specialty === "ophthalmology" ? "eye" : p.caseInfo.pregnant ? "pregnancy" : null;
  const [view, setView] = useState<"special" | "body">(special ? "special" : "body");
  const base = view === "special" && special ? SCENES[special] : bodyScene(p.patient.age, p.patient.sex);
  // Only zones whose instrument belongs to this case's kit are shown.
  const kitKeys = new Set(p.kit.map((t) => t.key));
  const scene = { ...base, zones: base.zones.filter((z) => kitKeys.has(z.tool)) };
  // A zone narrows the dock only while its tool is the active one.
  const zone = scene.zones.find((z) => z.key === zoneKey && z.tool === p.tool.key) ?? null;
  const sel = zone ?? p.tool;
  const items = sel.codes || sel.categories ? PHYSICAL_EXAMS.filter((x) => toolMatches(sel, x.code)) : [];

  async function perform(code: string) {
    setPending(code);
    p.setError("");
    try {
      const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${p.session.id}/exam`, "POST", { kind: "PHYSICAL", code });
      p.onExamDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
    } catch (e) {
      p.setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  const res = p.lastResult && p.lastResult.kind === "PHYSICAL" && items.some((i) => i.code === p.lastResult!.code) ? p.lastResult : null;
  const head = scene.bubbleAt;

  return (
    <div className="relative flex-1 overflow-hidden bg-black">
      {/* Same photo, blurred, fills the letterbox around the framed scene. */}
      <Photo photo={scene.photo} className="absolute inset-0 scale-110 opacity-40 blur-2xl" sizes="40vw" w={600} />

      <div className="absolute inset-x-0 bottom-[96px] top-0 grid place-items-center [container-type:size]">
        <div className="relative overflow-hidden rounded-xl shadow-2xl" style={{ aspectRatio: String(scene.ratio), width: `min(100cqw, ${100 * scene.ratio}cqh)` }}>
          <Photo photo={scene.photo} className="absolute inset-0" sizes="(min-width:1024px) 60vw, 100vw" w={1600} priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

          {/* Clickable body zones */}
          {scene.zones.map((z) => {
            const [x, y] = z.at;
            const k = z.key;
            const relevant = p.tool.key === z.tool;
            const on = zone?.key === k;
            return (
              <button
                key={k}
                onClick={() => {
                  setZone(k);
                  if (p.tool.key !== z.tool) p.onPickTool(z.tool);
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`Examiner : ${z.label}`}
              >
                <span className={`relative grid place-items-center rounded-full transition-all ${on ? "h-14 w-14" : relevant ? "h-10 w-10" : "h-6 w-6"}`}>
                  {(on || relevant) && <span className="absolute inset-0 animate-ping rounded-full bg-[#38e1ff]/30" />}
                  <span className={`absolute inset-0 rounded-full border-2 ${on ? "border-[#38e1ff] bg-[#38e1ff]/20 shadow-[0_0_24px_rgba(56,225,255,0.7)]" : relevant ? "border-[#38e1ff]/80 bg-[#0a5be0]/25" : "border-white/70 bg-white/20"}`} />
                  <span className={`relative rounded-full bg-white ${on ? "h-2.5 w-2.5" : "h-1.5 w-1.5"}`} />
                </span>
                <span className={`pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#081427]/90 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur transition ${on || relevant ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {z.label}
                </span>
              </button>
            );
          })}

          <AnimatePresence>
            {p.bubble && (
              <motion.div
                key={p.bubble}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute max-w-[min(300px,45%)] rounded-2xl rounded-bl-md bg-white/95 px-4 py-2.5 text-sm leading-relaxed text-[#0b132b] shadow-xl"
                style={head[1] < 30 ? { left: `${Math.min(head[0] + 7, 55)}%`, top: `${Math.max(head[1] - 8, 3)}%` } : { left: `${Math.min(head[0] + 6, 55)}%`, bottom: `${100 - head[1] + 6}%` }}
                dir="auto"
              >
                {p.bubble.length > 180 ? `${p.bubble.slice(0, 180)}…` : p.bubble}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tool hint, like « Palpation superficielle » in the mockups */}
          {special && (
            <div className="absolute right-3 top-3 flex rounded-lg bg-[#081427]/85 p-0.5 text-xs font-medium text-white backdrop-blur">
              {([["special", special === "eye" ? "Œil" : "Grossesse"], ["body", "Patient"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => { setView(k); setZone(null); }} className={`rounded-md px-2.5 py-1 ${view === k ? "bg-[#1f6fe0]" : "text-white/70 hover:text-white"}`}>{l}</button>
              ))}
            </div>
          )}
          {zone && (
            <span className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-[#081427]/85 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur">
              <p.tool.icon className="h-4 w-4 text-[#6fb1ff]" /> {p.tool.label} · {zone.label}
              <button onClick={() => setZone(null)} className="ml-1 text-white/50 hover:text-white" aria-label="Tous les gestes"><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
        </div>
      </div>

      {/* Monitor */}
      <div className={`absolute left-3 top-3 max-w-[calc(100%-1.5rem)] ${p.tool.key === "vitals" ? "w-[460px]" : "hidden w-[250px] xl:block"}`}>
        <VitalsMonitor vitals={p.vitals} startedAt={p.session.startedAt} compact={p.tool.key !== "vitals"} />
      </div>

      {/* Bedside instruments */}
      <AnimatePresence mode="wait">
        {INSTRUMENTS.includes(p.tool.key) && (
          <motion.div key={p.tool.key} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.35 }} className="absolute bottom-[100px] right-3 top-3 z-20 w-[min(560px,calc(100%-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#081427]/[0.97] p-5 text-white shadow-2xl backdrop-blur-md">
            <p className="mb-4 flex items-center gap-2 font-semibold">
              <p.tool.icon className="h-5 w-5 text-[#6fb1ff]" weight="duotone" />
              {p.tool.key === "bp" ? "Tensiomètre manuel" : p.tool.key === "glucose" ? "Glycémie capillaire (glucomètre)" : p.tool.key === "peakflow" ? "Débitmètre de pointe (peak-flow)" : "Soins : voie veineuse, perfusion, injections"}
            </p>
            {p.tool.key === "bp" && (
              <BloodPressureTool
                sbp={p.vitals.sbp}
                dbp={p.vitals.dbp}
                hr={p.vitals.hr}
                onDone={(r) => {
                  if (r.sys !== null && r.dia !== null && !p.doneCodes.has("bp_manual")) perform("bp_manual");
                }}
              />
            )}
            {p.tool.key === "glucose" && (
              <GlucoseTool
                measure={async () => {
                  const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${p.session.id}/exam`, "POST", { kind: "INVESTIGATION", code: "glucose" });
                  p.onExamDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
                  return r.result;
                }}
              />
            )}
            {p.tool.key === "peakflow" && (
              <PeakFlowTool
                sex={p.patient.sex}
                measure={async () => {
                  const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${p.session.id}/exam`, "POST", { kind: "INVESTIGATION", code: "peak_flow" });
                  p.onExamDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
                  return r.result;
                }}
              />
            )}
            {p.tool.key === "care" && p.care}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exam result */}
      <AnimatePresence>
        {res && (
          <motion.div key={res.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute inset-x-3 bottom-[108px] z-10 mx-auto max-w-xl rounded-xl border bg-[#081427]/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur ${res.abnormal ? "border-red-400/50" : "border-emerald-400/40"}`}>
            <div className="flex items-center gap-2">
              <p className="flex-1 font-semibold">{res.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${res.abnormal ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}>{res.abnormal ? "Anormal" : "Normal"}</span>
              <button onClick={p.clearResult} className="text-white/40 hover:text-white" aria-label="Fermer"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-white/80">{res.result}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div className="absolute inset-x-3 bottom-2 flex h-[88px] items-end">
        {["talk", "vitals", ...INSTRUMENTS].includes(p.tool.key) ? (
          <p className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#081427]/90 px-4 py-2 text-xs text-white/75 backdrop-blur">
            <Info className="h-4 w-4 shrink-0 text-[#6fb1ff]" />
            {p.tool.key === "talk"
              ? "Interrogez le patient à droite, puis touchez une zone du corps pour l'examiner."
              : p.tool.key === "vitals"
                ? "Données simulées : le moniteur évolue si le patient n'est pas traité."
                : p.tool.key === "bp"
                  ? "Activez le son : les bruits de Korotkoff sont synthétisés dans votre navigateur."
                  : p.tool.key === "glucose"
                    ? "Le résultat vient du dossier du cas et s'ajoute à vos examens."
                    : p.tool.key === "peakflow"
                    ? "Trois essais, on retient la meilleure valeur : comparez-la à la valeur théorique."
                    : "Les soins s'ajoutent à votre prise en charge et sont notés."}
          </p>
        ) : (
          <div className="mx-auto w-fit max-w-full rounded-2xl border border-white/10 bg-[#081427]/95 p-1.5 backdrop-blur">
            <div className="flex gap-1 overflow-x-auto">
              {items.map((it) => {
                const done = p.doneCodes.has(it.code);
                return (
                  <button key={it.code} onClick={() => !done && perform(it.code)} disabled={pending !== null || done} className={`flex min-w-[100px] max-w-[140px] shrink-0 flex-col items-center gap-1 rounded-xl px-2.5 py-2 text-center text-[11px] font-medium leading-tight transition ${done ? "bg-emerald-500/10 text-emerald-200" : "text-white/80 hover:bg-[#0a5be0]/25 hover:text-white hover:ring-1 hover:ring-[#2f86ff]"}`} title={done ? "Déjà réalisé" : `Réaliser : ${it.name}`}>
                    {pending === it.code ? <Loader2 className="h-5 w-5 animate-spin" /> : done ? <Check className="h-5 w-5" /> : <p.tool.icon className="h-5 w-5 text-[#6fb1ff]" />}
                    {it.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Live 3D face of the patient, shown like a video tile in the dialogue panel. */
function PatientTile({ patient, emotion, speaking }: { patient: RoomProps["patient"]; emotion: Emotion; speaking: boolean }) {
  return (
    <div className="relative h-44 overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#1a2c4d] to-[#0a1830]">
      <PatientAvatar3D config={patient.avatar} emotion={emotion} speaking={speaking} age={patient.age} sex={patient.sex} />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[#0a1830] to-transparent px-4 pb-2.5 pt-8">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{patient.name}</p>
          <p className="truncate text-xs text-white/60">{patient.age} ans · {patient.sex === "F" ? "Femme" : "Homme"} · {EMOTION_FR[emotion] ?? emotion}</p>
        </div>
        {speaking ? (
          <span className="flex h-6 shrink-0 items-center gap-[3px]" aria-label="Le patient parle">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="w-[3px] animate-pulse rounded-full bg-[#38e1ff]" style={{ height: `${8 + ((i * 7) % 5) * 4}px`, animationDelay: `${i * 90}ms`, animationDuration: "600ms" }} />
            ))}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] text-white/40">Patient 3D</span>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ disabled, onClick }: { disabled: boolean; onClick: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-primary"
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        await onClick();
        setBusy(false);
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {busy ? "Évaluation…" : "Soumettre pour évaluation"}
    </button>
  );
}

function Check2({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warn ? "text-amber-500" : "text-danger"}`} />}
      <span className={ok ? "" : "muted"}>{label}</span>
    </li>
  );
}

function Timer({ startedAt, minutes }: { startedAt: string; minutes: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = now === null ? 0 : Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const over = secs > minutes * 60;
  const fmt = `${String(Math.floor(secs / 3600))}:${String(Math.floor((secs % 3600) / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-sm ${over ? "text-amber-300" : "text-white/85"}`} title={`Objectif : ${minutes} minutes`} aria-label={`Temps écoulé ${fmt}`}>
      <Clock className="h-4 w-4" /> {fmt}
    </span>
  );
}

// ───────────────────────── Patient file ─────────────────────────

function PatientFile(props: RoomProps & { covered: string[] }) {
  const { history, covered } = props;
  const revealed: [string, string, string[]][] = [
    ["pmh", "Antécédents médicaux", history.pastMedical],
    ["medications", "Traitements", history.medications],
    ["allergies", "Allergies", history.allergies],
    ["family", "Antécédents familiaux", history.family],
    ["smoking", "Mode de vie", history.social],
  ];
  const groups = [...new Set(TOPICS.map((t) => t.group))];
  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-1 text-sm font-semibold">Dossier du patient</p>
        <p className="subtle mb-3 text-xs">Se complète au fil de l&apos;interrogatoire.</p>
        <dl className="space-y-2.5 text-xs">
          {revealed.map(([topic, label, items]) => (
            <div key={label}>
              <dt className="subtle font-semibold">{label}</dt>
              <dd className="mt-0.5">{covered.includes(topic) ? items.join(" · ") || "Aucun" : <span className="subtle italic">Pas encore demandé</span>}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-2 text-sm font-semibold">Couverture de l&apos;interrogatoire</p>
        {groups.map((g) => (
          <div key={g} className="mb-2">
            <p className="subtle mb-1 text-[11px] font-semibold">{g}</p>
            <div className="flex flex-wrap gap-1">
              {TOPICS.filter((t) => t.group === g && t.key !== "greeting").map((t) => (
                <span key={t.key} className={`chip text-[11px] ${covered.includes(t.key) ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/45"}`}>
                  {covered.includes(t.key) && <Check className="h-3 w-3" />} {t.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ───────────────────────── Chat ─────────────────────────


function ChatPanel({
  sessionId, lang, messages, setMessages, onPatient, engineNote, voiceAllowed, setError,
}: {
  sessionId: string;
  lang: Lang;
  messages: RoomProps["messages"];
  setMessages: React.Dispatch<React.SetStateAction<RoomProps["messages"]>>;
  onPatient: (e: Emotion, topics: string[], note?: string, reply?: string) => void;
  engineNote: string;
  voiceAllowed: boolean;
  setError: (s: string) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<() => void>(() => {});
  // Detected after mount so server and client render the same markup.
  const [voice, setVoice] = useState<VoiceProvider | null>(null);
  useEffect(() => setVoice(browserVoice()), []);
  const dir = LANGS.find((l) => l.code === lang)?.dir ?? "ltr";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setError("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "student", content: question, emotion: null }]);
    setText("");
    try {
      const r = await api<{ patient: { id: string; content: string; emotion: string }; topicsCovered: string[]; note?: string }>(`/api/sessions/${sessionId}/message`, "POST", { text: question });
      setMessages((m) => [...m, { id: r.patient.id, role: "patient", content: r.patient.content, emotion: r.patient.emotion }]);
      onPatient(r.patient.emotion as Emotion, r.topicsCovered, r.note, r.patient.content);
      if (speakReplies && voice?.supported.tts) voice.speak(r.patient.content, lang);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(question);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (!voice?.supported.stt) return;
    if (listening) {
      stopRef.current();
      setListening(false);
      return;
    }
    setListening(true);
    stopRef.current = voice.listen(
      lang,
      (t, final) => {
        setText(t);
        if (final) {
          setListening(false);
          send(t);
        }
      },
      () => setListening(false),
    );
  }

  return (
    <div className="flex h-full min-h-[460px] flex-col">
      <div className="flex items-center justify-between px-4 pt-2.5">
        <p className="subtle text-xs">{messages.filter((m) => m.role === "student").length} question(s)</p>
        <div className="flex items-center gap-2">
          {voiceAllowed ? (
            voice?.supported.tts ? (
              <button onClick={() => { setSpeakReplies(!speakReplies); voice.stopSpeaking(); }} className="btn-ghost px-2.5 py-1.5 text-xs" aria-pressed={speakReplies} title="Lire à voix haute les réponses du patient">
                {speakReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} Réponses vocales
              </button>
            ) : null
          ) : (
            <Link href="/app/billing" className="subtle text-xs hover:text-brand-600" title="La consultation vocale est incluse dans Étudiant Pro">
              Voix (Pro)
            </Link>
          )}
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" dir={dir}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
            <div dir="auto" className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "student" ? "rounded-ee-md bg-[#0a5be0] text-white" : "rounded-es-md bg-white/[0.07] text-white/90"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-[rgb(var(--panel-2))] px-4 py-3" aria-label="Le patient répond">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--ink-3))]" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
      {engineNote && (
        <p className="mx-4 mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {engineNote}
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2" dir={dir}>
        {QUICK[lang].map((q) => (
          <button key={q} onClick={() => send(q)} disabled={busy} className="chip shrink-0 border border-white/10 bg-white/[0.03] py-1 text-white/75 hover:border-[#2f86ff] hover:text-white">
            {q}
          </button>
        ))}
      </div>
      <form
        className="m-3 mt-1 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 focus-within:border-[#2f86ff]"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        {voiceAllowed && voice?.supported.stt && (
          <button type="button" onClick={toggleMic} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${listening ? "bg-danger text-white" : "bg-white/10 text-white/80 hover:bg-white/15"}`} aria-pressed={listening} aria-label={listening ? "Arrêter l'écoute" : "Poser la question à voix haute"}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <label htmlFor="ask" className="sr-only">Votre question au patient</label>
        <input id="ask" dir="auto" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? "Écoute…" : "Parlez à votre patient…"} maxLength={1000} autoComplete="off" />
        <button className="btn-primary h-9 w-9 shrink-0 rounded-lg p-0" disabled={busy || !text.trim()} aria-label="Envoyer la question">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {voiceAllowed && voice && !voice.supported.stt && <p className="subtle px-4 pb-2 text-[11px]">La saisie vocale n&apos;est pas prise en charge par ce navigateur (essayez Chrome ou Edge).</p>}
    </div>
  );
}

// ───────────────────────── Exams & investigations ─────────────────────────

function ExamPanel({ sessionId, kind, done, onDone, setError }: { sessionId: string; kind: "PHYSICAL" | "INVESTIGATION"; done: RoomProps["exams"]; onDone: (e: RoomProps["exams"][number]) => void; setError: (s: string) => void }) {
  const catalog = kind === "PHYSICAL" ? PHYSICAL_EXAMS : INVESTIGATIONS;
  const categories = [...new Set(catalog.map((c) => c.category))];
  const [pending, setPending] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const doneCodes = new Set(done.map((d) => d.code));

  async function perform(code: string) {
    setPending(code);
    setError("");
    try {
      const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${sessionId}/exam`, "POST", { kind, code });
      onDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{kind === "PHYSICAL" ? "Examen clinique" : "Examens complémentaires"}</h2>
            <p className="subtle text-xs">
              {kind === "PHYSICAL" ? "Choisissez les gestes que vous réaliseriez. Soyez ciblé : que pourrait confirmer ou éliminer chacun d'eux ?" : "Demandez des examens. Les examens essentiels rapportent des points ; ceux qui ajoutent coût, délai ou risque sans intérêt sont pénalisés."}
            </p>
          </div>
          <input className="field w-48 py-1.5 text-sm" placeholder="Filtrer…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrer la liste" />
        </div>
        <div className="space-y-4">
          {categories.map((cat) => {
            const items = catalog.filter((c) => c.category === cat && c.name.toLowerCase().includes(filter.toLowerCase()));
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="subtle mb-2 text-[11px] font-semibold uppercase tracking-wider">{cat}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it) => {
                    const isDone = doneCodes.has(it.code);
                    return (
                      <button key={it.code} onClick={() => !isDone && perform(it.code)} disabled={isDone || pending !== null} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${isDone ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-200" : "border-[rgb(var(--line))] hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10"}`}>
                        <span>
                          {it.name}
                          {"turnaround" in it && <span className="subtle block text-[11px]">⏱ {(it as { turnaround: string }).turnaround}</span>}
                        </span>
                        {pending === it.code ? <Loader2 className="h-4 w-4 animate-spin" /> : isDone ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-brand-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-3 font-semibold">{kind === "PHYSICAL" ? "Résultats de l'examen" : "Résultats"}</h3>
        {done.length === 0 ? (
          <p className="subtle text-sm">Rien pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-2">
            {[...done].reverse().map((d) => (
              <li key={d.code} className={`rounded-xl border-l-4 bg-[rgb(var(--panel-2))] px-4 py-3 ${d.abnormal ? "border-danger" : "border-success"}`}>
                <p className="flex items-center justify-between text-sm font-semibold">
                  {d.name}
                  <span className={`chip ${d.abnormal ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>{d.abnormal ? "Anormal" : "Normal"}</span>
                </p>
                <p className="mt-1 text-sm">{d.result}</p>
                {d.code === "ecg" && <EcgResult text={d.result} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Reasoning & management ─────────────────────────

function ReasoningPanel(p: { ddx: string[]; setDdx: (v: string[]) => void; finalDx: string; setFinalDx: (v: string) => void; justification: string; setJustification: (v: string) => void }) {
  const [item, setItem] = useState("");
  const add = () => {
    const v = item.trim();
    if (v && !p.ddx.includes(v) && p.ddx.length < 10) p.setDdx([...p.ddx, v]);
    setItem("");
  };
  return (
    <div className="panel space-y-6 p-6">
      <div>
        <h2 className="font-semibold">Diagnostics différentiels</h2>
        <p className="subtle text-xs">Listez les hypothèses envisagées, de la plus probable à la moins probable. N&apos;oubliez pas les diagnostics graves à éliminer.</p>
        <div className="mt-3 flex gap-2">
          <input className="field" value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="ex. Dissection aortique" maxLength={200} aria-label="Ajouter un diagnostic différentiel" />
          <button className="btn-ghost" onClick={add} type="button">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        <ol className="mt-3 space-y-1.5">
          {p.ddx.map((d, i) => (
            <li key={d} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--panel-2))] px-3 py-2 text-sm">
              <span className="subtle font-mono text-xs">{i + 1}</span>
              <span className="flex-1">{d}</span>
              <button onClick={() => p.setDdx(p.ddx.filter((x) => x !== d))} aria-label={`Retirer ${d}`} className="subtle hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <label className="font-semibold" htmlFor="final-dx">Diagnostic retenu</label>
        <input id="final-dx" className="field mt-2" value={p.finalDx} onChange={(e) => p.setFinalDx(e.target.value)} placeholder="Votre diagnostic le plus probable" maxLength={300} />
      </div>
      <div>
        <label className="font-semibold" htmlFor="justif">Argumentation</label>
        <p className="subtle text-xs">Quels éléments de l&apos;interrogatoire, de l&apos;examen et des examens complémentaires soutiennent votre diagnostic, et pourquoi avez-vous écarté les autres ?</p>
        <textarea id="justif" className="field mt-2" rows={6} value={p.justification} onChange={(e) => p.setJustification(e.target.value)} maxLength={5000} />
        <p className="subtle mt-1 text-right text-[11px]">{p.justification.length}/5000</p>
      </div>
    </div>
  );
}

function ManagementPanel({ options, actions, setActions, notes, setNotes }: { options: { code: string; label: string }[]; actions: string[]; setActions: (v: string[]) => void; notes: string; setNotes: (v: string) => void }) {
  const toggle = (c: string) => setActions(actions.includes(c) ? actions.filter((x) => x !== c) : [...actions, c]);
  return (
    <div className="panel space-y-6 p-6">
      <div>
        <h2 className="font-semibold">Prise en charge</h2>
        <p className="subtle text-xs">Cochez toutes les actions que vous entreprendriez maintenant. Certaines options sont inadaptées voire dangereuses pour ce patient : choisissez avec soin.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {options.map((o) => {
            const on = actions.includes(o.code);
            return (
              <label key={o.code} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${on ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-[rgb(var(--line))] hover:border-brand-300"}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(o.code)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                {o.label}
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <label className="font-semibold" htmlFor="mgmt-notes">Surveillance, suivi et consignes</label>
        <textarea id="mgmt-notes" className="field mt-2" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Orientation, surveillance, suivi, ce que vous diriez au patient…" maxLength={5000} />
      </div>
    </div>
  );
}

// ───────────────────────── Notes & findings ─────────────────────────

function NotesPanel({ sessionId, initial }: { sessionId: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState<"saved" | "saving" | "dirty">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function change(v: string) {
    setNotes(v);
    setSaved("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaved("saving");
      await api(`/api/sessions/${sessionId}`, "PATCH", { notes: v }).catch(() => {});
      setSaved("saved");
    }, 800);
  }
  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <NotebookPen className="h-4 w-4 text-brand-600" /> Notes cliniques
        </p>
        <span className="subtle text-[11px]">{saved === "saved" ? "Enregistré" : saved === "saving" ? "Enregistrement…" : "Modification"}</span>
      </div>
      <textarea className="field min-h-[220px] font-mono text-xs leading-relaxed" value={notes} onChange={(e) => change(e.target.value)} placeholder={"Motif :\nHistoire de la maladie :\nATCD :\nTraitements / allergies :\nMode de vie / ATCD familiaux :\nExamen :\nConclusion :"} maxLength={20000} aria-label="Notes cliniques" />
    </div>
  );
}

function FindingsPanel({ exams }: { exams: RoomProps["exams"] }) {
  const abnormal = exams.filter((e) => e.abnormal);
  return (
    <div className="panel p-4">
      <p className="mb-2 text-sm font-semibold">Éléments clés recueillis</p>
      {abnormal.length === 0 ? (
        <p className="subtle text-xs">Les résultats d&apos;examen et d&apos;analyses anormaux s&apos;afficheront ici.</p>
      ) : (
        <ul className="space-y-2">
          {abnormal.map((e) => (
            <li key={e.code} className="rounded-lg bg-red-50/70 px-3 py-2 text-xs dark:bg-red-500/10">
              <p className="font-semibold text-red-700 dark:text-red-300">{e.name}</p>
              <p className="mt-0.5">{e.result}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="subtle mt-3 text-[11px]">{exams.length} examen(s) réalisé(s)</p>
    </div>
  );
}

// ───────────────────────── Care: IV line, infusions, injections ─────────────────────────

const SERUMS = [
  { key: "nacl", label: "Sérum salé 0,9 %", match: /sal[ée]|nacl|0,9/i },
  { key: "g5", label: "Sérum glucosé 5 %", match: /gluco/i },
  { key: "rl", label: "Ringer lactate", match: /ringer/i },
];
const INJECTABLE = /n[ée]bulis|a[ée]rosol|\bIV\b|injection|insuline|h[ée]parine|HNF|[ée]noxaparine|morphine|t[ée]nect[ée]plase|alt[ée]plase|thrombolyse|fibrinolyse|bolus|antalgie|potass|bicarbonate/i;
const FLUID = /s[ée]rum|remplissage|perfusion/i;

function CarePanel({ options, actions, setActions, log, onLog }: { options: { code: string; label: string }[]; actions: string[]; setActions: (v: string[]) => void; log: string[]; onLog: (l: string) => void }) {
  const [line, setLine] = useState(log.some((l) => l.includes("Voie veineuse")));
  const [serum, setSerum] = useState(SERUMS[0].key);
  const [ml, setMl] = useState(500);
  const [hours, setHours] = useState(1);
  const [running, setRunning] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const injectables = options.filter((o) => INJECTABLE.test(o.label) && !FLUID.test(o.label));
  const fluids = options.filter((o) => FLUID.test(o.label));
  const rate = dropsPerMin(ml, hours);
  const S = SERUMS.find((x) => x.key === serum)!;

  const toggle = (code: string, on: boolean) => setActions(on ? [...new Set([...actions, code])] : actions.filter((a) => a !== code));

  return (
    <div className="space-y-5 text-sm">
      {/* 1. IV line */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">1. Voie veineuse périphérique</p>
            <p className="text-xs text-white/55">Garrot, antisepsie, cathéter 18G au pli du coude, fixation.</p>
          </div>
          {line ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-200"><Check className="h-3.5 w-3.5" /> Posée</span>
          ) : (
            <button className="btn-primary shrink-0 px-3 py-1.5 text-xs" onClick={() => { setLine(true); onLog("Voie veineuse périphérique posée (cathéter 18G, pli du coude)."); }}>Poser la voie</button>
          )}
        </div>
      </section>

      {/* 2. Infusion */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="font-semibold">2. Perfusion</p>
        <div className="mt-3 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {SERUMS.map((x) => (
                <button key={x.key} onClick={() => setSerum(x.key)} className={`rounded-full border px-2.5 py-1 text-xs ${serum === x.key ? "border-[#2f86ff] bg-[#2f86ff]/20 text-white" : "border-white/15 text-white/70 hover:border-white/40"}`}>{x.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-white/60">Volume
                <select value={ml} onChange={(e) => setMl(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1830] px-2 py-1.5 text-white">
                  {[250, 500, 1000].map((v) => <option key={v} value={v}>{v} mL</option>)}
                </select>
              </label>
              <label className="text-xs text-white/60">Durée
                <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1830] px-2 py-1.5 text-white">
                  {[0.5, 1, 2, 4, 8, 12].map((v) => <option key={v} value={v}>{v < 1 ? "30 min" : `${v} h`}</option>)}
                </select>
              </label>
            </div>
            <p className="rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-white/80">
              Débit : {Math.round(ml / hours)} mL/h · <b className="text-[#7fe7ff]">{rate} gouttes/min</b> <span className="text-white/45">(perfuseur 20 gouttes = 1 mL)</span>
            </p>
            <button
              className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40"
              disabled={!line || running}
              title={line ? undefined : "Posez d'abord une voie veineuse"}
              onClick={() => {
                setRunning(true);
                const opt = fluids.find((o) => S.match.test(o.label));
                if (opt) toggle(opt.code, true);
                onLog(`Perfusion de ${S.label}, ${ml} mL en ${hours < 1 ? "30 min" : `${hours} h`} (${rate} gouttes/min).`);
              }}
            >
              {running ? "Perfusion en cours" : line ? "Démarrer la perfusion" : "Voie veineuse requise"}
            </button>
          </div>
          <DripBag label={S.label} rate={rate} running={running} />
        </div>
      </section>

      {/* 3. Injections */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="font-semibold">3. Injections et traitements parentéraux</p>
        {injectables.length === 0 ? (
          <p className="mt-2 text-xs text-white/55">Aucun traitement injectable n&apos;est proposé dans ce cas : réfléchissez à la conduite à tenir dans l&apos;onglet « Conduite ».</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {injectables.map((o) => {
              const on = actions.includes(o.code);
              const needsLine = /\bIV\b|perfusion|pousse-seringue|t[ée]nect|alt[ée]p|thrombolyse|fibrinolyse/i.test(o.label);
              return (
                <li key={o.code} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${on ? "border-[#2f86ff]/60 bg-[#2f86ff]/10" : "border-white/10"}`}>
                  <span className="text-[13px]">{o.label}</span>
                  <button
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${on ? "bg-white/10 text-white/80 hover:bg-white/15" : "bg-[#1f6fe0] text-white hover:bg-[#2f86ff]"} disabled:opacity-40`}
                    disabled={!on && needsLine && !line}
                    title={!on && needsLine && !line ? "Voie veineuse requise" : undefined}
                    onClick={() => {
                      toggle(o.code, !on);
                      if (!on) {
                        setShot(o.code);
                        setTimeout(() => setShot(null), 1400);
                        onLog(`Administré : ${o.label}.`);
                      }
                    }}
                  >
                    {on ? "Annuler" : needsLine && !line ? "VVP requise" : "Administrer"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <AnimatePresence>
          {shot && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-3 text-xs text-[#7fe7ff]">
              <motion.span animate={{ x: [0, -14, 0] }} transition={{ duration: 0.9 }}><Syringe className="h-7 w-7" weight="duotone" /></motion.span>
              Injection réalisée, notée dans votre prise en charge.
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {log.length > 0 && (
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/45">Feuille de soins</p>
          <ul className="space-y-1 font-mono text-[11px] text-white/70">{log.map((l) => <li key={l}>{l}</li>)}</ul>
        </section>
      )}
    </div>
  );
}

/** ECG investigation: the written result plus a matching 12-lead tracing to read. */
function EcgResult({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  const spec = useMemo(() => ecgSpecFromText(text), [text]);
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="text-xs font-semibold text-[#6fb1ff] hover:underline">{open ? "Masquer le tracé" : "Voir le tracé ECG"}</button>
      {open && <EcgPaper spec={spec} className="mt-2" />}
    </div>
  );
}
