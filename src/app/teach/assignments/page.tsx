import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardTitle, Empty, PageHeader, fmtDate } from "@/components/ui";
import { AssignmentForm, DeleteAssignment } from "./assignment-form";
import Link from "next/link";

export const metadata = { title: "Devoirs" };

export default async function AssignmentsPage() {
  const user = await requireUser({ permission: "assignment:manage" });
  const groupWhere = user.roleKey === "TEACHER" ? { teacherId: user.id } : user.roleKey === "UNIVERSITY_ADMIN" ? { universityId: user.universityId ?? "__none__" } : {};
  const [groups, cases, assignments] = await Promise.all([
    prisma.studentGroup.findMany({ where: groupWhere, orderBy: { name: "asc" } }),
    prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.assignment.findMany({
      where: { group: groupWhere },
      include: { case: true, group: { include: { members: { include: { user: true } } } }, sessions: { where: { status: "COMPLETED" }, include: { result: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Évaluation" title="Devoirs" sub="Assignez des cas publiés et validés à vos groupes et suivez les rendus." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardTitle>Nouveau devoir</CardTitle>
          {groups.length === 0 ? (
            <Empty title="Créez d'abord un groupe" action={<Link href="/teach/groups" className="btn-primary">Groupes</Link>} />
          ) : (
            <AssignmentForm groups={groups.map((g) => ({ id: g.id, name: g.name }))} cases={cases} />
          )}
        </Card>
        <div className="space-y-4">
          {assignments.length === 0 && <Empty title="Aucun devoir" />}
          {assignments.map((a) => {
            const byUser = new Map(a.sessions.map((s) => [s.userId, s]));
            return (
              <Card key={a.id}>
                <CardTitle sub={`${a.case.title} · ${a.group.name} · échéance ${fmtDate(a.dueAt)}`} action={<DeleteAssignment id={a.id} />}>
                  {a.title}
                </CardTitle>
                {a.instructions && <p className="muted -mt-2 mb-3 text-sm">{a.instructions}</p>}
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {a.group.members.map((m) => {
                    const s = byUser.get(m.userId);
                    return (
                      <li key={m.id} className="flex items-center justify-between rounded-lg bg-[rgb(var(--panel-2))] px-3 py-2 text-sm">
                        <span className="truncate">{m.user.name}</span>
                        {s?.result ? (
                          <Link href={`/teach/review/${s.id}`} className="font-semibold text-brand-600 hover:underline">{s.result.teacherScoreOverride ?? s.result.totalScore}/100</Link>
                        ) : (
                          <span className="subtle text-xs">en attente</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
