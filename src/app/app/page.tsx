import Link from "next/link";
import { ArrowRight, Award, CalendarClock, CheckCircle2, ClipboardList, Gauge, Lock, PlayCircle, Target, TrendingUp } from "@/components/icons";
import { prisma, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { achievements, average, categoryAverages, effectiveScore, weeklyTrend } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { monthlyUsage } from "@/lib/sim/service";
import { Badge, Card, CardTitle, DifficultyBadge, Empty, PageHeader, ScoreRing, Stat, fmtDate, scoreTone } from "@/components/ui";
import { SkillRadar, TrendChart } from "@/components/charts";
import { WelcomeBanner } from "@/components/welcome-banner";
import type { ScoreBreakdown } from "@/lib/sim/types";

export const metadata = { title: "Tableau de bord" };

export default async function StudentDashboard() {
  const user = await requireUser();
  const [results, inProgress, memberships, used] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, include: { session: { include: { case: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.consultationSession.findMany({ where: { userId: user.id, status: "IN_PROGRESS" }, include: { case: true }, orderBy: { startedAt: "desc" }, take: 3 }),
    prisma.groupMembership.findMany({ where: { userId: user.id }, include: { group: { include: { assignments: { include: { case: true, sessions: { where: { userId: user.id, status: "COMPLETED" } } }, orderBy: { dueAt: "asc" } } } } } }),
    monthlyUsage(user.id),
  ]);

  const scores = results.map(effectiveScore);
  const cats = categoryAverages(results);
  const sorted = [...cats].filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const trend = weeklyTrend(results.map((r) => ({ createdAt: r.createdAt, score: effectiveScore(r) })));
  const badges = achievements(results);
  const totalMinutes = results.reduce((s, r) => s + parseJson<ScoreBreakdown>(r.breakdown, { durationMinutes: 0 } as ScoreBreakdown).durationMinutes, 0);
  const assignments = memberships.flatMap((m) => m.group.assignments.map((a) => ({ ...a, groupName: m.group.name })));
  const pending = assignments.filter((a) => a.sessions.length === 0);

  // Recommendations: cases not yet completed, prioritising the weakest specialty.
  const doneCaseIds = new Set(results.map((r) => r.session.caseId));
  const specAvg = new Map<string, number[]>();
  results.forEach((r) => specAvg.set(r.session.case.specialty, [...(specAvg.get(r.session.case.specialty) ?? []), effectiveScore(r)]));
  const published = await prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, orderBy: { difficulty: "asc" } });
  const recommended = published
    .filter((c) => !doneCaseIds.has(c.id))
    .map((c) => ({ c, priority: specAvg.has(c.specialty) ? average(specAvg.get(c.specialty)!) : 60, locked: !c.freeTier && !user.plan.limits.fullLibrary }))
    .sort((a, b) => Number(a.locked) - Number(b.locked) || a.priority - b.priority)
    .slice(0, 3);
  const limit = user.plan.limits.simulationsPerMonth;

  return (
    <>
      <WelcomeBanner
        photo="studentLaptop"
        eyebrow={`${user.yearOfStudy ? `${user.yearOfStudy}e année` : "—"} · ${user.plan.name}`}
        title={<>Bienvenue, <span className="text-gradient">{user.name.split(" ")[0]}</span></>}
        sub="Reprenez où vous en étiez, terminez vos devoirs ou relevez le défi d'un nouveau patient."
        actions={
          <Link href="/app/cases" className="btn-glow">
            <PlayCircle className="h-4 w-4" /> Lancer une simulation
          </Link>
        }
        stat={results.length ? { label: "Note moyenne", value: average(scores) } : undefined}
      />

      {limit !== null && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
          <span>
            Il vous reste <strong>{Math.max(0, limit - used)}</strong> simulation(s) gratuite(s) sur {limit} ce mois-ci.
          </span>
          <Link href="/app/billing" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Passer à Étudiant Pro →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Simulations terminées" value={results.length} hint={`${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min d'entraînement`} icon={<CheckCircle2 className="h-5 w-5" />} tone="blue" />
        <Stat label="Note moyenne" value={results.length ? `${average(scores)}` : "—"} hint="Selon la grille, sur 100" icon={<Gauge className="h-5 w-5" />} tone="teal" />
        <Stat label="Meilleure note" value={results.length ? Math.max(...scores) : "—"} hint={results[0] ? `Dernière : ${effectiveScore(results[0])} le ${fmtDate(results[0].createdAt)}` : "Aucune tentative"} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <Stat label="Devoirs à rendre" value={pending.length} hint={pending[0]?.dueAt ? `Prochaine échéance : ${fmtDate(pending[0].dueAt)}` : "Rien à rendre"} icon={<ClipboardList className="h-5 w-5" />} tone="amber" />
      </div>

      {inProgress.length > 0 && (
        <Card className="mt-6 border-brand-200 dark:border-brand-500/30">
          <CardTitle sub="Votre consultation est enregistrée automatiquement.">Reprendre une consultation</CardTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {inProgress.map((s) => (
              <Link key={s.id} href={`/app/consult/${s.id}`} className="flex items-center justify-between rounded-xl border border-[rgb(var(--line))] p-3 hover:border-brand-400">
                <span>
                  <span className="block text-sm font-semibold">{s.case.title}</span>
                  <span className="subtle text-xs">Commencée le {fmtDate(s.startedAt)}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-brand-600" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="Note moyenne par semaine">Progression</CardTitle>
          {results.length ? <TrendChart data={trend} /> : <Empty title="Pas encore de données" body="Terminez une simulation pour suivre votre progression." />}
        </Card>
        <Card>
          <CardTitle sub="% des points de la grille obtenus">Profil de compétences</CardTitle>
          {results.length ? (
            user.plan.limits.analytics || results.length < 3 ? (
              <SkillRadar data={cats} />
            ) : (
              <LockedPanel text="Les statistiques détaillées font partie d'Étudiant Pro." />
            )
          ) : (
            <Empty title="Pas encore de données" />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Points forts et points faibles</CardTitle>
          {sorted.length ? (
            <div className="space-y-3">
              {sorted.map((c, i) => (
                <div key={c.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">
                      {c.label} {i === 0 && <Badge tone="green">point fort</Badge>} {i === sorted.length - 1 && sorted.length > 1 && <Badge tone="red">à travailler</Badge>}
                    </span>
                    <span className="subtle">{c.value} %</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgb(var(--panel-2))]">
                    <div className={`h-2 rounded-full ${c.value >= 75 ? "bg-success" : c.value >= 50 ? "bg-brand-600" : "bg-danger"}`} style={{ width: `${c.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Terminez un cas pour voir votre profil" />
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle action={<Link href="/app/reports" className="text-sm font-semibold text-brand-600 hover:underline">Tous les rapports</Link>}>Consultations récentes</CardTitle>
          {results.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {results.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link href={`/app/reports/${r.sessionId}`} className="flex items-center gap-4 py-3 hover:opacity-90">
                    <ScoreRing value={effectiveScore(r)} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.session.case.title}</p>
                      <p className="subtle text-xs">
                        {specialtyName(r.session.case.specialty)} · {fmtDate(r.createdAt)} {r.teacherComment && "· commentaire de l'enseignant"}
                      </p>
                    </div>
                    <Badge tone={scoreTone(effectiveScore(r))}>{effectiveScore(r) >= 75 ? "Très bien" : effectiveScore(r) >= 50 ? "En progrès" : "À revoir"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Aucune consultation" action={<Link href="/app/cases" className="btn-primary">Parcourir les cas</Link>} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="De vos groupes">Devoirs</CardTitle>
          {assignments.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {assignments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <CalendarClock className="h-5 w-5 text-brand-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="subtle text-xs">
                      {a.case.title} · {a.groupName} · à rendre le {fmtDate(a.dueAt)}
                    </p>
                  </div>
                  {a.sessions.length ? (
                    <Badge tone="green">Rendu</Badge>
                  ) : (
                    <Link href={`/app/cases/${a.case.slug}?assignment=${a.id}`} className="btn-primary px-3 py-1.5 text-xs">
                      Commencer
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Aucun devoir" body="Les cas assignés par vos enseignants apparaîtront ici." />
          )}
        </Card>
        <Card>
          <CardTitle sub="Selon vos points faibles">Recommandés pour vous</CardTitle>
          <div className="space-y-3">
            {recommended.map(({ c, locked }) => (
              <Link key={c.id} href={locked ? "/app/billing" : `/app/cases/${c.slug}`} className="block rounded-xl border border-[rgb(var(--line))] p-3 hover:border-brand-400">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{c.title}</p>
                  {locked ? <Lock className="h-4 w-4 text-[rgb(var(--ink-3))]" /> : <Target className="h-4 w-4 text-teal-500" />}
                </div>
                <p className="subtle mt-1 flex items-center gap-2 text-xs">
                  {specialtyName(c.specialty)} <DifficultyBadge d={c.difficulty} />
                </p>
              </Link>
            ))}
            {recommended.length === 0 && <Empty title="Vous avez terminé tous les cas !" />}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle sub={`${badges.filter((b) => b.earned).length} sur ${badges.length} obtenus`}>Badges</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {badges.map((b) => (
            <div key={b.key} className={`rounded-xl border p-3 text-center ${b.earned ? "border-teal-300 bg-teal-50 dark:border-teal-500/40 dark:bg-teal-500/10" : "border-[rgb(var(--line))] opacity-55"}`} title={b.description}>
              <Award className={`mx-auto h-6 w-6 ${b.earned ? "text-teal-600" : "text-[rgb(var(--ink-3))]"}`} />
              <p className="mt-2 text-xs font-semibold">{b.title}</p>
              <p className="subtle mt-0.5 text-[11px] leading-tight">{b.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function LockedPanel({ text }: { text: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-xl bg-[rgb(var(--panel-2))] text-center">
      <div>
        <Lock className="mx-auto h-6 w-6 text-brand-600" />
        <p className="mt-2 text-sm">{text}</p>
        <Link href="/app/billing" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Passer à Pro
        </Link>
      </div>
    </div>
  );
}
