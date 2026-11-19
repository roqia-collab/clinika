import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Baby, Brain, ClipboardPlus, Clock, Eye, HeartPulse, ScanFace, Siren, Stethoscope, Wind } from "@/components/icons";
import { prisma } from "@/lib/db";
import { SPECIALTIES } from "@/lib/catalog";
import { SPECIALTY_PHOTO } from "@/lib/photos";
import { DifficultyBadge } from "@/components/ui";
import { PageHero } from "@/components/site/page-hero";
import { Photo, Reveal, Stagger, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "Spécialités — cardiologie, neurologie, pédiatrie, urgences et plus",
  description: "Cas de patients virtuels en cardiologie, neurologie, pédiatrie, médecine d'urgence, médecine interne, dermatologie et médecine générale.",
};
export const dynamic = "force-dynamic";

const ICONS = { HeartPulse, Brain, Baby, Siren, Stethoscope, ScanFace, ClipboardPlus, Eye, Wind } as const;

export default async function SpecialtiesPage() {
  const cases = await prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, select: { title: true, specialty: true, difficulty: true, patientAge: true, patientSex: true, estimatedMinutes: true } });
  return (
    <>
      <PageHero eyebrow="Spécialités médicales" photo="mri" title={<>Tous vos stages. <span className="text-gradient">Un seul service virtuel.</span></>} sub="Chaque spécialité propose des cas de niveau Fondamental, Intermédiaire et Avancé. Les facultés peuvent rédiger autant de cas qu'elles le souhaitent." />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-16 sm:px-6">
        {SPECIALTIES.map((s, i) => {
          const Icon = ICONS[s.icon as keyof typeof ICONS];
          const list = cases.filter((c) => c.specialty === s.key);
          return (
            <Reveal key={s.key}>
              <section id={s.key} className="panel group grid scroll-mt-28 overflow-hidden rounded-2xl p-0 md:grid-cols-[1.1fr_1fr]">
                <div className={`relative min-h-[280px] ${i % 2 ? "md:order-2" : ""}`}>
                  <Photo photo={SPECIALTY_PHOTO[s.key]} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent" />
                  <div className="absolute bottom-0 p-7 text-white">
                    <span className="glass grid h-12 w-12 place-items-center rounded-2xl"><Icon className="h-6 w-6" /></span>
                    <h2 className="mt-3 text-3xl font-bold">{s.name}</h2>
                  </div>
                  <span className="absolute right-6 top-5 font-display text-7xl font-bold text-white/15">0{i + 1}</span>
                </div>
                <div className="p-7 sm:p-9">
                  <p className="muted text-lg">{s.blurb}</p>
                  <Stagger className="mt-6 space-y-2">
                    {list.length === 0 && <p className="subtle text-sm">Nouveaux cas bientôt disponibles.</p>}
                    {list.map((c) => (
                      <StaggerItem key={c.title}>
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line))] px-4 py-3 transition hover:border-brand-400">
                          <div>
                            <p className="font-semibold">{c.title}</p>
                            <p className="subtle flex items-center gap-2 text-xs"><span>{c.patientAge} ans · {c.patientSex === "F" ? "F" : "H"}</span><Clock className="h-3 w-3" /> {c.estimatedMinutes} min</p>
                          </div>
                          <DifficultyBadge d={c.difficulty} />
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                  <Link href="/register" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">S&apos;entraîner en {s.name.toLowerCase()} <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </section>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
