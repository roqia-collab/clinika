import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardTitle, Empty, PageHeader } from "@/components/ui";
import { AddMembersForm, CreateGroupForm } from "./group-forms";

export const metadata = { title: "Groupes" };

export default async function GroupsPage() {
  const user = await requireUser({ permission: "group:manage" });
  const where = user.roleKey === "TEACHER" ? { teacherId: user.id } : user.roleKey === "UNIVERSITY_ADMIN" ? { universityId: user.universityId ?? "__none__" } : {};
  const [groups, teachers] = await Promise.all([
    prisma.studentGroup.findMany({ where, include: { teacher: true, members: { include: { user: true } }, _count: { select: { assignments: true } } }, orderBy: { name: "asc" } }),
    user.roleKey === "TEACHER" ? Promise.resolve([]) : prisma.user.findMany({ where: { roleKey: "TEACHER", ...(user.roleKey === "UNIVERSITY_ADMIN" ? { universityId: user.universityId } : {}) }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Promotions" title="Groupes d'étudiants" sub="Organisez vos étudiants en groupes pour leur assigner des cas et suivre leurs résultats." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardTitle>Nouveau groupe</CardTitle>
          <CreateGroupForm teachers={teachers} />
        </Card>
        <div className="space-y-4">
          {groups.length === 0 && <Empty title="Aucun groupe" />}
          {groups.map((g) => (
            <Card key={g.id}>
              <CardTitle sub={`Enseignant : ${g.teacher.name} · ${g.members.length} étudiant(s) · ${g._count.assignments} devoir(s)`}>{g.name}</CardTitle>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {g.members.map((m) => (
                  <span key={m.id} className="chip bg-[rgb(var(--panel-2))]" title={m.user.email}>{m.user.name}</span>
                ))}
                {g.members.length === 0 && <span className="subtle text-sm">Aucun étudiant.</span>}
              </div>
              <AddMembersForm groupId={g.id} />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
