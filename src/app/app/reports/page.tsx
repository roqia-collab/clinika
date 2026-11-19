import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { specialtyName } from "@/lib/catalog";
import { effectiveScore } from "@/lib/analytics";
import { Badge, DifficultyBadge, Empty, PageHeader, ScoreRing, fmtDate } from "@/components/ui";

export const metadata = { title: "Mes rapports" };

export default async function ReportsPage() {
  const user = await requireUser();
  const results = await prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, include: { session: { include: { case: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader eyebrow="Rapports d'évaluation" title="Mes rapports de consultation" sub="Retrouvez vos notes, feedbacks, transcriptions et commentaires d'enseignants." />
      {results.length === 0 ? (
        <Empty title="Aucun rapport" body="Terminez une simulation pour recevoir votre première évaluation." action={<Link href="/app/cases" className="btn-primary">Parcourir les cas</Link>} />
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-[rgb(var(--line))] text-left">
              <tr className="subtle text-xs uppercase tracking-wide">
                <th className="px-5 py-3">Cas</th>
                <th className="px-5 py-3">Spécialité</th>
                <th className="px-5 py-3">Niveau</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-[rgb(var(--panel-2))]">
                  <td className="px-5 py-3 font-medium">
                    {r.session.case.title} {r.teacherComment && <Badge tone="amber">commentaire</Badge>}
                  </td>
                  <td className="muted px-5 py-3">{specialtyName(r.session.case.specialty)}</td>
                  <td className="px-5 py-3"><DifficultyBadge d={r.session.case.difficulty} /></td>
                  <td className="muted px-5 py-3">{fmtDate(r.createdAt)}</td>
                  <td className="px-5 py-3"><ScoreRing value={effectiveScore(r)} size={38} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/app/reports/${r.sessionId}`} className="font-semibold text-brand-600 hover:underline">Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
