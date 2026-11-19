import Link from "next/link";
import { Copy, Plus } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { specialtyName } from "@/lib/catalog";
import { DifficultyBadge, Empty, PageHeader, StatusBadge, fmtDate } from "@/components/ui";

export const metadata = { title: "Cas cliniques" };

export default async function TeacherCases({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser({ permission: "case:write" });
  const { status } = await searchParams;
  const cases = await prisma.clinicalCase.findMany({
    where: status ? { status } : {},
    include: { author: { select: { name: true } }, _count: { select: { sessions: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const tabs = [["", "Tous"], ["DRAFT", "Brouillons"], ["IN_REVIEW", "En validation"], ["PUBLISHED", "Publiés"], ["ARCHIVED", "Archivés"]];

  return (
    <>
      <PageHeader
        eyebrow="Gestion des contenus"
        title="Cas cliniques"
        sub="Créez, modifiez, faites valider et publiez vos scénarios. Toute modification renvoie le cas en brouillon pour une nouvelle validation."
        actions={
          <Link href="/teach/cases/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Nouveau cas
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1">
        {tabs.map(([k, l]) => (
          <Link key={k} href={k ? `/teach/cases?status=${k}` : "/teach/cases"} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status === k || (!status && !k) ? "bg-brand-600 text-white" : "muted hover:bg-[rgb(var(--panel-2))]"}`}>
            {l}
          </Link>
        ))}
      </div>
      {cases.length === 0 ? (
        <Empty title="Aucun cas ici" action={<Link href="/teach/cases/new" className="btn-primary">Créer un cas</Link>} />
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Cas</th>
                <th className="px-4 py-3">Spécialité</th>
                <th className="px-4 py-3">Niveau</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Consultations</th>
                <th className="px-4 py-3">Modifié</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {cases.map((c) => {
                const editable = user.roleKey !== "TEACHER" || c.authorId === user.id;
                return (
                  <tr key={c.id} className="hover:bg-[rgb(var(--panel-2))]">
                    <td className="px-4 py-3">
                      <Link href={`/teach/cases/${c.id}`} className="font-semibold hover:text-brand-600">{c.title}</Link>
                      <p className="subtle text-xs">par {c.author?.name ?? "—"}</p>
                    </td>
                    <td className="muted px-4 py-3">{specialtyName(c.specialty)}</td>
                    <td className="px-4 py-3"><DifficultyBadge d={c.difficulty} /></td>
                    <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                    <td className="muted px-4 py-3">v{c.version}</td>
                    <td className="muted px-4 py-3">{c._count.sessions}</td>
                    <td className="muted px-4 py-3">{fmtDate(c.updatedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/teach/cases/${c.id}`} className="font-semibold text-brand-600 hover:underline">{editable ? "Ouvrir" : "Voir"}</Link>
                      <Link href={`/teach/cases/new?from=${c.id}`} className="subtle ml-3 inline-flex items-center gap-1 hover:text-brand-600" title="Dupliquer en nouveau brouillon">
                        <Copy className="h-3.5 w-3.5" /> Dupliquer
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
