import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PLANS, formatDA } from "@/lib/billing/plans";
import { paymentProvider } from "@/lib/billing/providers";
import { monthlyUsage } from "@/lib/sim/service";
import { fmtDate } from "@/components/ui";
import { FileText, ShieldCheck } from "@/components/icons";
import { PlanActions } from "./plan-actions";
import { UsageRing } from "./usage-ring";

export const metadata = { title: "Formule et paiement" };

const FAQ = [
  ["Puis-je résilier à tout moment ?", "Oui. Vous repassez en formule Gratuit quand vous voulez et gardez tous vos rapports."],
  ["Quels moyens de paiement ?", "Carte CIB, carte Edahabia et BaridiMob, via la page sécurisée de votre banque."],
  ["Ma faculté a une licence ?", "Rattachez votre compte à votre faculté : toutes les fonctions sont alors incluses."],
];

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgrade?: string }> }) {
  const user = await requireUser();
  const { upgrade } = await searchParams;
  const [payments, used] = await Promise.all([prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }), monthlyUsage(user.id)]);
  const provider = paymentProvider();
  const sub = user.subscription;
  const institutional = sub?.plan === "UNIVERSITY";
  const limit = user.plan.limits.simulationsPerMonth;

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] px-4 py-10 text-white sm:-mx-6 sm:-my-8 sm:px-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="pointer-events-none absolute -top-20 right-0 h-[360px] w-[520px] rounded-full bg-[#2f86ff]/15 blur-[120px]" />

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Abonnement</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">Formule et paiement</h1>
        <p className="mt-3 max-w-2xl text-white/60">Gérez votre formule, payez en dinars avec votre carte algérienne et retrouvez vos reçus.</p>


        {/* Current plan */}
        <section className="relative mt-8 grid gap-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2350] via-[#0a1830] to-[#081427] p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <span className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full bg-[#38e1ff]/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-white/55">Votre formule actuelle</p>
            <p className="mt-1 font-display text-4xl font-bold">{user.plan.name}</p>
            <p className="mt-1 text-white/60">{user.plan.tagline}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-white/45">Statut</dt><dd className="mt-0.5 flex items-center gap-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {sub?.status === "ACTIVE" || !sub ? "Active" : sub.status.toLowerCase()}</dd></div>
              <div><dt className="text-white/45">Facturation</dt><dd className="mt-0.5 font-medium">{institutional ? "Par la faculté" : sub?.plan === "STUDENT_PRO" ? (sub.interval === "YEAR" ? "Annuelle" : "Mensuelle") : "Gratuite"}</dd></div>
              <div><dt className="text-white/45">Renouvellement</dt><dd className="mt-0.5 font-medium">{sub?.currentPeriodEnd && sub.plan === "STUDENT_PRO" ? fmtDate(sub.currentPeriodEnd) : "—"}</dd></div>
            </dl>
          </div>
          <UsageRing used={used} limit={limit} />
        </section>

        {/* Plans + checkout */}
        <section className="mt-12">
          <PlanActions current={sub?.plan ?? "FREE"} institutional={institutional} plans={PLANS.filter((p) => p.key !== "UNIVERSITY")} highlight={!!upgrade} live={provider.live} />
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Receipts */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-semibold">Historique des paiements</h2>
            {payments.length === 0 ? (
              <div className="mt-6 grid place-items-center py-8 text-center text-white/50">
                <FileText className="h-10 w-10 text-white/25" />
                <p className="mt-2 text-sm">Aucun paiement pour l&apos;instant.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 py-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2f86ff]/15 text-[#6fb1ff]"><FileText className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.description}</p>
                      <p className="text-xs text-white/45">{fmtDate(p.createdAt)}</p>
                    </div>
                    <span className="font-mono text-sm">{formatDA(p.amountCents / 100)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${p.status === "SUCCEEDED" ? "bg-emerald-500/15 text-emerald-200" : p.status === "DEMO" ? "bg-amber-500/15 text-amber-200" : "bg-red-500/15 text-red-200"}`}>
                      {p.status === "DEMO" ? "Démo" : p.status === "SUCCEEDED" ? "Payé" : p.status.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* FAQ */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-[#6fb1ff]" /> Questions fréquentes</h2>
            <div className="mt-4 divide-y divide-white/10">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                    {q}
                    <span className="text-lg leading-none text-white/40 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-white/60">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
