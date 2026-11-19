import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, CardTitle, PageHeader, fmtDate } from "@/components/ui";
import { formatDA } from "@/lib/billing/plans";

export const metadata = { title: "Abonnements" };

export default async function AdminSubscriptions() {
  await requireUser({ permission: "platform:subscriptions" });
  const [subs, payments] = await Promise.all([
    prisma.subscription.findMany({ include: { user: true }, orderBy: { updatedAt: "desc" } }),
    prisma.payment.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Facturation" title="Abonnements et paiements" sub="Point d'intégration du prestataire de paiement : src/lib/billing/providers.ts (prestataire de démonstration actif)." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-x-auto">
          <CardTitle>Abonnements ({subs.length})</CardTitle>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="subtle text-left text-xs uppercase tracking-wide"><tr><th className="py-2">Utilisateur</th><th>Formule</th><th>Statut</th><th>Prestataire</th><th>Renouvellement</th></tr></thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.user.name}</td>
                  <td><Badge tone={s.plan === "FREE" ? "grey" : s.plan === "STUDENT_PRO" ? "blue" : "teal"}>{({ FREE: "Gratuit", STUDENT_PRO: "Étudiant Pro", UNIVERSITY: "Faculté" } as Record<string, string>)[s.plan] ?? s.plan}</Badge></td>
                  <td className="muted text-xs">{s.status.toLowerCase()}</td>
                  <td className="muted text-xs">{s.provider}</td>
                  <td className="muted text-xs">{fmtDate(s.currentPeriodEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="overflow-x-auto">
          <CardTitle>Paiements récents</CardTitle>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="subtle text-left text-xs uppercase tracking-wide"><tr><th className="py-2">Date</th><th>Utilisateur</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="muted py-2 text-xs">{fmtDate(p.createdAt)}</td>
                  <td>{p.user.name}</td>
                  <td className="font-mono">{formatDA(p.amountCents / 100)}</td>
                  <td><Badge tone={p.status === "SUCCEEDED" ? "green" : "amber"}>{p.status === "DEMO" ? "démo" : p.status === "SUCCEEDED" ? "payé" : p.status.toLowerCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
