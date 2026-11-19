import { AlertTriangle, BookOpen, CheckCircle2, Circle, GraduationCap, Lightbulb, MessageSquareQuote, MinusCircle, Target } from "@/components/icons";
import type { AssessmentResult, ClinicalCase, ConversationMessage, ConsultationSession, DiagnosisSubmission, MedicalExamination, User } from "@prisma/client";
import { parseJson } from "@/lib/db";
import { specialtyName } from "@/lib/catalog";
import type { CaseContent, EducationalFeedback, ScoreBreakdown } from "@/lib/sim/types";
import { Badge, Card, CardTitle, DifficultyBadge, ScoreRing, fmtDate, scoreTone } from "@/components/ui";

export type FullSession = ConsultationSession & {
  case: ClinicalCase;
  user: User;
  result: AssessmentResult | null;
  diagnosis: DiagnosisSubmission | null;
  messages: ConversationMessage[];
  examinations: MedicalExamination[];
};

export function ReportView({ s, content, actions }: { s: FullSession; content: CaseContent; actions?: React.ReactNode }) {
  const r = s.result!;
  const score = parseJson<ScoreBreakdown>(r.breakdown, { total: 0, categories: [], durationMinutes: 0, questionsAsked: 0 });
  const fb = parseJson<EducationalFeedback>(r.feedback, {} as EducationalFeedback);
  const ddx = parseJson<string[]>(s.diagnosis?.differentials, []);
  const mgmt = parseJson<string[]>(s.diagnosis?.managementActions, []);
  const finalScore = r.teacherScoreOverride ?? r.totalScore;
  const optLabel = (code: string) => content.rubric.management.options.find((o) => o.code === code);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-6 p-6">
        <ScoreRing value={finalScore} size={104} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{specialtyName(s.case.specialty)}</Badge>
            <DifficultyBadge d={s.case.difficulty} />
            <Badge tone={scoreTone(finalScore)}>{finalScore >= 75 ? "Très bonne prestation" : finalScore >= 50 ? "En progrès" : "À retravailler"}</Badge>
            {r.teacherScoreOverride != null && <Badge tone="amber">Ajustée par l&apos;enseignant (grille : {r.totalScore})</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold">{s.case.title}</h1>
          <p className="subtle mt-1 text-sm">
            {s.user.name} · {fmtDate(s.completedAt)} · {score.durationMinutes} min · {score.questionsAsked} questions · {s.language.toUpperCase()} · grille v{r.rubricVersion}
          </p>
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardTitle sub="Chaque point est rattaché à un critère explicite de la grille">Détail de la note</CardTitle>
          <div className="space-y-5">
            {score.categories.map((c) => (
              <details key={c.key} className="group" open={c.score < c.max * 0.75}>
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{c.label}</span>
                    <span className="font-mono">
                      {c.score} / {c.max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[rgb(var(--panel-2))]">
                    <div className={`h-2 rounded-full ${c.score >= c.max * 0.75 ? "bg-success" : c.score >= c.max * 0.5 ? "bg-brand-600" : "bg-danger"}`} style={{ width: `${c.max ? (Math.max(0, c.score) / c.max) * 100 : 0}%` }} />
                  </div>
                </summary>
                <ul className="mt-3 space-y-1.5 border-l-2 border-[rgb(var(--line))] pl-4">
                  {c.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {it.points < 0 ? <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> : it.achieved ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--ink-3))]" />}
                      <span className="flex-1">
                        <span className={it.points < 0 ? "text-danger" : it.achieved ? "" : "muted"}>{it.label}</span>
                        {it.note && (it.points < 0 || !it.achieved) && <span className="subtle block text-xs">{it.note}</span>}
                      </span>
                      <span className={`font-mono text-xs ${it.points < 0 ? "text-danger" : "subtle"}`}>
                        {it.points > 0 ? "+" : ""}
                        {it.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-teal-500" /> Diagnostic
              </span>
            </CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">Votre diagnostic</dt>
                <dd className="mt-0.5 font-medium">{s.diagnosis?.finalDiagnosis}</dd>
              </div>
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">Diagnostic du cas</dt>
                <dd className="mt-0.5 font-semibold text-teal-700 dark:text-teal-300">{fb.correctDiagnosis}</dd>
              </div>
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">Vos différentiels</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{ddx.length ? ddx.map((d) => <span key={d} className="chip bg-[rgb(var(--panel-2))]">{d}</span>) : <span className="subtle">Aucun</span>}</dd>
              </div>
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">Différentiels à évoquer</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{content.answer.differentials.map((d) => <span key={d.name} className="chip bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{d.name}</span>)}</dd>
              </div>
            </dl>
            {fb.reasoningComment && <p className="muted mt-4 rounded-xl bg-[rgb(var(--panel-2))] p-3 text-sm leading-relaxed">{fb.reasoningComment}</p>}
          </Card>

          {r.teacherComment && (
            <Card className="border-amber-300 dark:border-amber-500/40">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-amber-500" /> Commentaire de l&apos;enseignant
                </span>
              </CardTitle>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.teacherComment}</p>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardTitle sub={r.feedbackSource.startsWith("rubric+") ? "Analyse par grille et commentaire détaillé" : "Feedback issu de la grille"}>
          <span className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-600" /> Feedback pédagogique
          </span>
        </CardTitle>
        <p className="text-[15px] leading-relaxed">{fb.summary}</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Points forts
            </p>
            <ul className="space-y-1.5 text-sm">{fb.strengths?.map((x, i) => <li key={i}>• {x}</li>)}</ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
              <AlertTriangle className="h-4 w-4" /> Axes d&apos;amélioration
            </p>
            <ul className="space-y-1.5 text-sm">{fb.improvements?.length ? fb.improvements.map((x, i) => <li key={i}>• {x}</li>) : <li className="subtle">Rien de majeur — bravo.</li>}</ul>
          </div>
        </div>
        {fb.missedFindings?.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">Éléments clés non recherchés</p>
            <ul className="grid gap-2 md:grid-cols-2">
              {fb.missedFindings.map((x, i) => (
                <li key={i} className="rounded-lg bg-[rgb(var(--panel-2))] px-3 py-2 text-xs">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 rounded-xl bg-teal-50 p-4 dark:bg-teal-500/10">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-teal-800 dark:text-teal-200">
            <Lightbulb className="h-4 w-4" /> Points pédagogiques
          </p>
          <ul className="space-y-1.5 text-sm">{fb.teachingPoints?.map((x, i) => <li key={i}>• {x}</li>)}</ul>
        </div>
        <p className="subtle mt-4 text-xs">{fb.disclaimer}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Examens réalisés</CardTitle>
          <ul className="space-y-2 text-sm">
            {s.examinations.length === 0 && <li className="subtle">Aucun examen.</li>}
            {s.examinations.map((e) => (
              <li key={e.id} className={`rounded-lg border-l-4 bg-[rgb(var(--panel-2))] px-3 py-2 ${e.abnormal ? "border-danger" : "border-success"}`}>
                <p className="text-xs font-semibold">
                  {e.kind === "PHYSICAL" ? "Examen" : "Analyse"} · {e.name}
                </p>
                <p className="text-xs">{e.result}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Prise en charge</CardTitle>
          <ul className="space-y-1.5 text-sm">
            {mgmt.length === 0 && <li className="subtle">Aucune action choisie.</li>}
            {mgmt.map((code) => {
              const o = optLabel(code);
              return (
                <li key={code} className="flex items-start gap-2">
                  {o?.kind === "contraindicated" ? <MinusCircle className="mt-0.5 h-4 w-4 text-danger" /> : o?.kind === "neutral" ? <Circle className="mt-0.5 h-4 w-4 text-amber-500" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />}
                  <span>
                    {o?.label ?? code}
                    {o && <span className="subtle block text-xs">{o.rationale}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {s.diagnosis?.managementNotes && <p className="muted mt-4 whitespace-pre-wrap rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm">{s.diagnosis.managementNotes}</p>}
        </Card>
      </div>

      <Card>
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-4 w-4 text-brand-600" /> Transcription de la consultation ({s.messages.length} messages)
            </span>
            <span className="subtle text-xs">Afficher / masquer</span>
          </summary>
          <div className="mt-4 space-y-2" dir="auto">
            {s.messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                <div dir="auto" className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "student" ? "bg-brand-600 text-white" : "bg-[rgb(var(--panel-2))]"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          {s.diagnosis?.justification && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Argumentation de l&apos;étudiant</p>
              <p className="muted mt-1 whitespace-pre-wrap text-sm">{s.diagnosis.justification}</p>
            </div>
          )}
          {s.notes && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Notes cliniques</p>
              <pre className="muted mt-1 whitespace-pre-wrap rounded-lg bg-[rgb(var(--panel-2))] p-3 font-mono text-xs">{s.notes}</pre>
            </div>
          )}
        </details>
      </Card>
    </div>
  );
}
