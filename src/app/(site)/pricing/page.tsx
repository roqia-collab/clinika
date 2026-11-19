import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "@/components/icons";
import { PLANS, formatDA } from "@/lib/billing/plans";
import { PageHero } from "@/components/site/page-hero";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";

export const metadata: Metadata = {
  title: "Tarifs — formules Gratuit, Étudiant Pro et Faculté",
  description: "Commencez gratuitement avec 5 simulations par mois. Passez à Étudiant Pro pour toute la bibliothèque, le commentaire détaillé et les rapports PDF, ou équipez votre faculté.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero align="center" eyebrow="Tarifs" photo="studentLaptop" title={<>Des formules simples. <span className="text-gradient">Un entraînement sérieux.</span></>} sub="Prix en dinars algériens (DA), TTC. Dans cette version, les paiements fonctionnent en mode démonstration : aucun débit n'est effectué." />
      <div className="mx-auto -mt-12 max-w-7xl px-4 sm:px-6">
        <Stagger className="relative z-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => {
            const featured = p.key === "STUDENT_PRO";
            return (
              <StaggerItem key={p.key}>
                <TiltCard className="h-full rounded-2xl" intensity={5}>
                  <section id={p.key === "UNIVERSITY" ? "university" : p.key.toLowerCase()} className={`relative flex h-full flex-col overflow-hidden rounded-2xl p-8 ${featured ? "noise bg-navy-950 text-white shadow-[0_40px_80px_-30px_rgba(37,99,235,0.6)]" : "panel"}`}>
                    {featured && <div className="aurora absolute inset-0 opacity-90" aria-hidden />}
                    <div className="relative flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{p.name}</h2>
                        {featured && <span className="chip bg-teal-500 text-white">Le plus choisi</span>}
                      </div>
                      <p className={`mt-1 text-sm ${featured ? "text-white/70" : "subtle"}`}>{p.tagline}</p>
                      <p className="mt-8">
                        {p.key === "UNIVERSITY" ? <span className="font-display text-5xl font-bold">Sur devis</span> : (
                          <>
                            <span className="font-display text-5xl font-bold">{p.priceMonthly === 0 ? "0 DA" : formatDA(p.priceMonthly)}</span>
                            <span className={featured ? "text-white/60" : "subtle"}> / mois</span>
                          </>
                        )}
                      </p>
                      <p className={`mt-1 text-xs ${featured ? "text-teal-300" : "subtle"}`}>
                        {p.key === "STUDENT_PRO" ? `ou ${formatDA(p.priceYearly)} par an — 2 mois offerts` : p.key === "UNIVERSITY" ? "Licence par faculté selon l'effectif des promotions" : "Gratuit, pour toujours"}
                      </p>
                      <ul className="mt-8 flex-1 space-y-3 text-sm">
                        {p.features.map((f) => (
                          <li key={f} className="flex gap-2.5">
                            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${featured ? "bg-teal-400/20 text-teal-300" : "bg-teal-50 text-teal-600 dark:bg-teal-500/15"}`}><Check className="h-3 w-3" /></span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-10">
                        {p.key === "FREE" && <Link href="/register" className="btn-ghost w-full py-3">Commencer gratuitement</Link>}
                        {p.key === "STUDENT_PRO" && <Link href="/register?plan=pro" className="btn-glow w-full justify-center">Choisir Étudiant Pro</Link>}
                        {p.key === "UNIVERSITY" && <Link href="/contact?type=demo" className="btn-primary w-full py-3">Nous contacter</Link>}
                      </div>
                    </div>
                  </section>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-20">
          <h2 className="text-center text-3xl font-bold">Comparer les formules</h2>
          <div className="panel mt-8 overflow-x-auto rounded-2xl p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--line))] text-left">
                  <th className="px-6 py-4 font-semibold">Fonctionnalité</th>
                  {PLANS.map((p) => <th key={p.key} className={`px-6 py-4 font-semibold ${p.key === "STUDENT_PRO" ? "text-brand-600" : ""}`}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--line))]">
                {(
                  [
                    ["Simulations par mois", (p) => p.limits.simulationsPerMonth ?? "Illimitées"],
                    ["Bibliothèque complète", (p) => p.limits.fullLibrary],
                    ["Commentaire détaillé après chaque cas", (p) => p.limits.aiFeedback],
                    ["Statistiques détaillées", (p) => p.limits.analytics],
                    ["Rapports PDF", (p) => p.limits.pdfReports],
                    ["Consultation vocale", (p) => p.limits.voice],
                    ["Tableau de bord et rédaction de cas", (p) => p.limits.institution],
                  ] as [string, (p: (typeof PLANS)[number]) => string | number | boolean][]
                ).map(([label, fn]) => (
                  <tr key={label} className="transition hover:bg-[rgb(var(--panel-2))]">
                    <td className="muted px-6 py-4">{label}</td>
                    {PLANS.map((p) => {
                      const v = fn(p);
                      return (
                        <td key={p.key} className="px-6 py-4">
                          {typeof v === "boolean" ? (v ? <Check className="h-5 w-5 text-teal-500" aria-label="Inclus" /> : <Minus className="h-5 w-5 text-[rgb(var(--ink-3))]" aria-label="Non inclus" />) : <span className="font-semibold">{v}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </>
  );
}
