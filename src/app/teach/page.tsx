import Link from "next/link";
import { ClipboardList, FolderHeart, Gauge, Plus, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { visibleStudentIds } from "@/lib/access";
import { average, categoryAverages, effectiveScore, specialtyAverages, weeklyTrend } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { Badge, Card, CardTitle, Empty, ScoreRing, Stat, StatusBadge, fmtDate } from "@/components/ui";
import { WelcomeBanner } from "@/components/welcome-banner";
import { BarsChart, SkillRadar, TrendChart } from "@/components/charts";

export const metadata = { title: "Tableau de bord enseignant" };

export default async function TeacherDashboard() {
  const user = await requireUser({ permission: "student:review" });
  const studentIds = await visibleStudentIds(user);
  const [results, groups, assignments, reviewQueue] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { session: { userId: { in: studentIds } } }, include: { session: { include: { case: true, user: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.studentGroup.findMany({ where: user.roleKey === "TEACHER" ? { teacherId: user.id } : { universityId: user.universityId ?? undefined }, include: { _count: { select: { members: true } } } }),
    prisma.assignment.findMany({ where: user.roleKey === "TEACHER" ? { creatorId: user.id } : {}, include: { case: true, group: { include: { _count: { select: { members: true } } } }, sessions: { where: { status: "COMPLETED" }, select: { userId: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.clinicalCase.findMany({ where: { status: { in: ["DRAFT", "IN_REVIEW"] }, ...(user.roleKey === "TEACHER" ? { authorId: user.id } : {}) }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  const recent30 = results.filter((r) => r.createdAt.getTime() > Date.now() - 30 * 864e5);
  const awaitingFeedback = results.filter((r) => !r.teacherComment).slice(0, 6);

  return (
    <>
      <WelcomeBanner photo="lectureCrowd"
        eyebrow="Enseignement"
        title={`Bienvenue, ${user.name}`}
        sub="Suivez les résultats de vos promotions, relisez les consultations et gérez vos cas cliniques."
        actions={
          <>
            <Link href="/teach/assignments" className="btn-ghost">
              <ClipboardList className="h-4 w-4" /> Nouveau devoir
            </Link>
            <Link href="/teach/cases/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Nouveau cas
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Étudiants" value={studentIds.length} hint={`${groups.length} groupe(s)`} icon={<Users className="h-5 w-5" />} />
        <Stat label="Simulations (30 jours)" value={recent30.length} hint={`${results.length} au total`} icon={<ClipboardList className="h-5 w-5" />} tone="teal" />
        <Stat label="Moyenne de la promo" value={results.length ? average(results.map(effectiveScore)) : "—"} hint="Sur 100" icon={<Gauge className="h-5 w-5" />} tone="green" />
        <Stat label="Cas en préparation" value={reviewQueue.length} hint="Brouillons ou en validation" icon={<FolderHeart className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="Note moyenne hebdomadaire de vos étudiants">Évolution de la promotion</CardTitle>
          {results.length ? <TrendChart data={weeklyTrend(results.map((r) => ({ createdAt: r.createdAt, score: effectiveScore(r) })))} /> : <Empty title="Aucune simulation" />}
        </Card>
        <Card>
          <CardTitle sub="% des points de la grille, toute la promo">Profil de compétences</CardTitle>
          {results.length ? <SkillRadar data={categoryAverages(results)} /> : <Empty title="Pas de données" />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Note moyenne par spécialité">Statistiques de la promo</CardTitle>
          {results.length ? <BarsChart data={specialtyAverages(results).map((s) => ({ label: specialtyName(s.key).split(" ")[0], value: s.value }))} /> : <Empty title="Pas de données" />}
        </Card>
        <Card>
          <CardTitle action={<Link href="/teach/students" className="text-sm font-semibold text-brand-600 hover:underline">Tous les étudiants</Link>} sub="Consultations terminées sans commentaire">
            À relire
          </CardTitle>
          {awaitingFeedback.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {awaitingFeedback.map((r) => (
                <li key={r.id}>
                  <Link href={`/teach/review/${r.sessionId}`} className="flex items-center gap-3 py-2.5 hover:opacity-90">
                    <ScoreRing value={effectiveScore(r)} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.session.user.name}</p>
                      <p className="subtle truncate text-xs">{r.session.case.title} · {fmtDate(r.createdAt)}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-600">Relire →</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Tout est à jour" />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/teach/assignments" className="text-sm font-semibold text-brand-600 hover:underline">Gérer</Link>}>Devoirs</CardTitle>
          {assignments.length ? (
            <ul className="space-y-3">
              {assignments.map((a) => {
                const done = new Set(a.sessions.map((s) => s.userId)).size;
                const total = a.group._count.members || 1;
                return (
                  <li key={a.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{a.title}</span>
                      <span className="subtle">{done}/{a.group._count.members} · échéance {fmtDate(a.dueAt)}</span>
                    </div>
                    <p className="subtle text-xs">{a.case.title} · {a.group.name}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[rgb(var(--panel-2))]">
                      <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title="Aucun devoir" action={<Link href="/teach/assignments" className="btn-primary">En créer un</Link>} />
          )}
        </Card>
        <Card>
          <CardTitle action={<Link href="/teach/cases" className="text-sm font-semibold text-brand-600 hover:underline">Tous les cas</Link>}>Cas en préparation</CardTitle>
          {reviewQueue.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {reviewQueue.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/teach/cases/${c.id}`} className="text-sm font-medium hover:text-brand-600">{c.title}</Link>
                  <StatusBadge s={c.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Aucun brouillon en cours" body="Créez un cas pour enrichir votre bibliothèque." />
          )}
          <p className="subtle mt-4 text-xs">
            <Badge tone="amber">Validation</Badge> Un cas doit être relu et attesté par un expert clinique avant de pouvoir être assigné.
          </p>
        </Card>
      </div>
    </>
  );
}
