import { Activity, CreditCard, FolderHeart, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { aiMode } from "@/lib/sim/engines";
import { groqModel } from "@/lib/sim/engines/groq";
import { anthropicModel } from "@/lib/sim/engines/anthropic";
import { paymentProvider } from "@/lib/billing/providers";
import { formatDA } from "@/lib/billing/plans";
import { weeklyTrend } from "@/lib/analytics";
import { Badge, Card, CardTitle, Stat } from "@/components/ui";
import { WelcomeBanner } from "@/components/welcome-banner";
import { BarsChart, TrendChart } from "@/components/charts";

export const metadata = { title: "Vue d'ensemble de la plateforme" };

export default async function AdminOverview() {
  await requireUser({ permission: "platform:analytics" });
  const [users, byRole, subs, cases, sessions, completed, payments, contacts] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["roleKey"], _count: true }),
    prisma.subscription.groupBy({ by: ["plan"], _count: true, where: { status: "ACTIVE" } }),
    prisma.clinicalCase.groupBy({ by: ["status"], _count: true }),
    prisma.consultationSession.count(),
    prisma.assessmentResult.findMany({ select: { createdAt: true, totalScore: true } }),
    prisma.payment.aggregate({ _sum: { amountCents: true } }),
    prisma.contactRequest.count({ where: { handled: false } }),
  ]);
  const mode = aiMode();
  const provider = paymentProvider();
  return (
    <>
      <WelcomeBanner photo="medicalTeam" eyebrow="Administration" title="Vue d'ensemble de la plateforme" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Utilisateurs" value={users} hint={byRole.map((r) => `${r._count} ${({ STUDENT: "étudiants", TEACHER: "enseignants", UNIVERSITY_ADMIN: "admin faculté", PLATFORM_ADMIN: "admin" } as Record<string, string>)[r.roleKey] ?? r.roleKey}`).join(" · ")} icon={<Users className="h-5 w-5" />} />
        <Stat label="Consultations" value={sessions} hint={`${completed.length} évaluée(s)`} icon={<Activity className="h-5 w-5" />} tone="teal" />
        <Stat label="Cas cliniques" value={cases.reduce((s, c) => s + c._count, 0)} hint={cases.map((c) => `${c._count} ${({ DRAFT: "brouillon(s)", IN_REVIEW: "en validation", PUBLISHED: "publié(s)", ARCHIVED: "archivé(s)" } as Record<string, string>)[c.status] ?? c.status}`).join(" · ")} icon={<FolderHeart className="h-5 w-5" />} tone="amber" />
        <Stat label="Chiffre d'affaires enregistré" value={formatDA((payments._sum.amountCents ?? 0) / 100)} hint={provider.live ? "Prestataire réel" : "Paiements de démonstration"} icon={<CreditCard className="h-5 w-5" />} tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub="Moyenne hebdomadaire, toute la plateforme">Évolution des notes</CardTitle>
          <TrendChart data={weeklyTrend(completed.map((r) => ({ createdAt: r.createdAt, score: r.totalScore })))} />
        </Card>
        <Card>
          <CardTitle>État du système</CardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="muted">Moteur patient</dt>
              <dd>{mode === "anthropic" ? <Badge tone="green">IA en direct · {anthropicModel()}</Badge> : mode === "groq" ? <Badge tone="green">IA en direct · Groq {groqModel()}</Badge> : <Badge tone="amber">Démo (hors ligne)</Badge>}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">Paiements</dt>
              <dd><Badge tone={provider.live ? "green" : "amber"}>{provider.label}</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">Voix</dt>
              <dd><Badge tone="blue">Web Speech du navigateur</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">Avatar 3D</dt>
              <dd><Badge tone="grey">Rendu 2D · interface prête pour la 3D</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">Demandes de contact en attente</dt>
              <dd className="font-semibold">{contacts}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle sub="Abonnements actifs par formule">Abonnements</CardTitle>
        <BarsChart data={subs.map((s) => ({ label: ({ FREE: "Gratuit", STUDENT_PRO: "Étudiant Pro", UNIVERSITY: "Faculté" } as Record<string, string>)[s.plan] ?? s.plan, value: s._count }))} height={200} />
      </Card>
    </>
  );
}
