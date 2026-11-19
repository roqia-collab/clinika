import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, fmtDate } from "@/components/ui";
import { UserControls } from "./user-controls";

export const metadata = { title: "Utilisateurs" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const me = await requireUser({ permission: "platform:users" });
  const { q, role } = await searchParams;
  const users = await prisma.user.findMany({
    where: { ...(role ? { roleKey: role } : {}), ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}) },
    include: { subscription: true, university: true, _count: { select: { sessions: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader eyebrow="Administration" title="Utilisateurs" sub="Modifiez rôles, formules et statut des comptes. Chaque modification est inscrite au journal d'audit." />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="field max-w-xs" placeholder="Nom ou e-mail" aria-label="Rechercher un utilisateur" />
        <select name="role" defaultValue={role ?? ""} className="field w-auto" aria-label="Filtrer par rôle">
          <option value="">Tous les rôles</option>
          {([["STUDENT", "Étudiant"], ["TEACHER", "Enseignant"], ["UNIVERSITY_ADMIN", "Admin faculté"], ["PLATFORM_ADMIN", "Admin plateforme"]] as const).map(([r, l]) => <option key={r} value={r}>{l}</option>)}
        </select>
        <button className="btn-ghost">Filtrer</button>
      </form>
      <div className="panel overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Faculté</th>
              <th className="px-4 py-3">Consultations</th>
              <th className="px-4 py-3">Inscription</th>
              <th className="px-4 py-3">Rôle · Formule · Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--line))]">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{u.name}</p>
                  <p className="subtle text-xs">{u.email}</p>
                </td>
                <td className="muted px-4 py-2.5 text-xs">{u.university?.name ?? "—"}</td>
                <td className="px-4 py-2.5">{u._count.sessions}</td>
                <td className="muted px-4 py-2.5 text-xs">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <UserControls id={u.id} self={u.id === me.id} role={u.roleKey} plan={u.subscription?.plan ?? "FREE"} active={u.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
