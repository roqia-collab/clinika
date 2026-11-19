import Link from "next/link";
import { ArrowRight, ArrowUpRight, GraduationCap, ShieldCheck, UsersRound } from "@/components/icons";
import { Logo } from "@/components/ui";
import { Photo } from "@/components/motion";

const COLS = [
  { title: "Produit", links: [["Fonctionnalités", "/features"], ["Spécialités", "/specialties"], ["Tarifs", "/pricing"], ["FAQ", "/faq"]] },
  { title: "Facultés et CHU", links: [["Demander une démo", "/contact?type=demo"], ["Formule Faculté", "/pricing#university"], ["Validation par des experts", "/features#review"]] },
  { title: "Clinika", links: [["À propos", "/about"], ["Contact", "/contact"], ["Conditions et confidentialité", "/legal"], ["Avertissement pédagogique", "/legal#disclaimer"]] },
];

const TRUST = [
  { icon: GraduationCap, t: "Externat, internat, ECOS" },
  { icon: ShieldCheck, t: "Notation par grille validée" },
  { icon: UsersRound, t: "Patients 100 % fictifs" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 bg-[#040a17] text-white">
      {/* ── Closing call to action ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative -mb-px overflow-hidden rounded-3xl border border-white/10">
          <Photo photo="bedside2" className="absolute inset-0 opacity-45" sizes="(max-width:1280px) 100vw, 1280px" w={1800} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050c1a] via-[#050c1a]/90 to-[#0a3a8c]/40" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#2f86ff]/25 blur-[100px]" />
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full opacity-60" aria-hidden>
            <path
              d="M0 80 H360 l14 -10 l12 10 h22 l10 26 l14 -96 l14 90 l10 -26 H760 l14 -10 l12 10 h22 l10 26 l14 -96 l14 90 l10 -26 H1200"
              fill="none"
              stroke="#38e1ff"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeDasharray="1000"
              style={{ animation: "ecg 4s linear infinite" }}
            />
          </svg>
          <div className="relative grid gap-10 px-7 py-14 sm:px-14 sm:py-20 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Commencez aujourd&apos;hui</p>
              <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Entraînez-vous sur des patients virtuels.
                <br />
                <span className="bg-gradient-to-r from-[#3d9bff] to-[#38e1ff] bg-clip-text text-transparent">Soignez les vrais.</span>
              </h2>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
                {TRUST.map((x) => (
                  <li key={x.t} className="flex items-center gap-2"><x.icon className="h-4 w-4 text-[#6fb1ff]" /> {x.t}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <Link href="/register" className="btn-primary group w-full justify-center px-7 py-4 text-base font-semibold sm:w-auto lg:w-72">
                Créer un compte gratuit <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/contact?type=demo" className="btn-glass w-full justify-center sm:w-auto lg:w-72">Démo pour votre faculté</Link>
              <p className="text-center text-xs text-white/45 lg:w-72">5 simulations offertes chaque mois · sans carte bancaire</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Links ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">La consultation simulée pour les étudiants et les facultés de médecine d&apos;Algérie : de la première question à la prise en charge, avec une note expliquée critère par critère.</p>
            <div className="mt-5 flex flex-wrap gap-1.5 text-xs">
              {["Français", "العربية", "English"].map((l) => (
                <span key={l} className="rounded-full border border-white/10 px-2.5 py-1 text-white/60">{l}</span>
              ))}
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold text-white">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="group inline-flex items-center gap-1 text-white/55 transition hover:text-white">
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Clinika · Outil pédagogique : tous les cas sont fictifs et ne remplacent pas un avis médical.</p>
          <p>
            Photographies : <a href="https://unsplash.com" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">Unsplash</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
