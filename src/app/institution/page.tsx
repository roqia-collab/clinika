import Link from "next/link";
import { Activity, BookOpenCheck, GraduationCap, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { average, categoryAverages, effectiveScore, specialtyAverages, weeklyTrend } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { Card, CardTitle, Empty, Stat } from "@/components/ui";
import { WelcomeBanner } from "@/components/welcome-banner";
import { BarsChart, SkillRadar, TrendChart } from "@/components/charts";

export const metadata = { title: "Vue d'ensemble de la faculté" };

export default async function InstitutionPage() {
  const user = await requireUser({ permission: "institution:analytics" });
  const uniId = user.universityId ?? "__none__";
  const [students, teachers, groups, results] = await Promise.all([
    prisma.user.count({ where: { universityId: uniId, roleKey: "STUDENT" } }),
    prisma.user.count({ where: { universityId: uniId, roleKey: "TEACHER" } }),
    prisma.studentGroup.findMany({ where: { universityId: uniId }, include: { teacher: true, members: { select: { userId: true } } } }),
    prisma.assessmentResult.findMany({ where: { session: { user: { universityId: uniId } } }, include: { session: { include: { case: true } } } }),
  ]);
  const activeStudents = new Set(results.filter((r) => r.createdAt.getTime() > Date.now() - 30 * 864e5).map((r) => r.session.userId)).size;
  const groupStats = groups.map((g) => {
    const ids = new Set(g.members.map((m) => m.userId));
    const rs = results.filter((r) => ids.has(r.session.userId));
    return { g, avg: average(rs.map(effectiveScore)), n: rs.length };
  });

  return (
    <>
      <WelcomeBanner photo="maqam" eyebrow={user.university?.name ?? "Faculté"} title="Vue d'ensemble de la faculté" sub="Utilisation de la plateforme et compétences cliniques à l'échelle de la faculté." actions={<Link href="/institution/people" className="btn-primary">Gérer les comptes</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Étudiants" value={students} hint={`${activeStudents} actif(s) ces 30 derniers jours`} icon={<GraduationCap className="h-5 w-5" />} />
        <Stat label="Enseignants" value={teachers} icon={<BookOpenCheck className="h-5 w-5" />} tone="teal" />
        <Stat label="Groupes" value={groups.length} icon={<Users className="h-5 w-5" />} tone="amber" />
        <Stat label="Simulations terminées" value={results.length} hint={`Moyenne ${average(results.map(effectiveScore))}/100`} icon={<Activity className="h-5 w-5" />} tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="Note moyenne hebdomadaire">Évolution de la faculté</CardTitle>
          {results.length ? <TrendChart data={weeklyTrend(results.map((r) => ({ createdAt: r.createdAt, score: effectiveScore(r) })))} /> : <Empty title="Pas de données" />}
        </Card>
        <Card>
          <CardTitle sub="% des points de la grille">Profil de compétences</CardTitle>
          {results.length ? <SkillRadar data={categoryAverages(results)} /> : <Empty title="Pas de données" />}
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Note moyenne par spécialité">Résultats par spécialité</CardTitle>
          {results.length ? <BarsChart data={specialtyAverages(results).map((s) => ({ label: specialtyName(s.key).split(" ")[0], value: s.value }))} /> : <Empty title="Pas de données" />}
        </Card>
        <Card>
          <CardTitle>Groupes</CardTitle>
          <ul className="divide-y divide-[rgb(var(--line))]">
            {groupStats.map(({ g, avg, n }) => (
              <li key={g.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-medium">{g.name}</span>
                  <span className="subtle block text-xs">{g.teacher.name} · {g.members.length} étudiant(s)</span>
                </span>
                <span className="text-right">
                  <span className="font-semibold">{n ? avg : "—"}</span>
                  <span className="subtle block text-xs">{n} simulation(s)</span>
                </span>
              </li>
            ))}
            {groups.length === 0 && <li className="subtle py-4 text-sm">Aucun groupe.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
