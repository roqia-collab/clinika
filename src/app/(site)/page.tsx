import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { LiveDemo } from "@/components/site/live-demo";
import { Hero } from "@/components/site/hero";
import { PromoFilm } from "@/components/site/promo-film";
import { CaseDeck, ReliabilityPanel, StepsTimeline, TeacherVoices, type DeckCase } from "@/components/site/home-sections";
import { DEMO_CASES } from "@/lib/cases/demo-cases";
import { difficultyLabel, specialtyName } from "@/lib/catalog";
import { CountUp, ParallaxPhoto, Photo, Reveal } from "@/components/motion";
import { SPECIALTIES } from "@/lib/catalog";
import { SPECIALTY_PHOTO } from "@/lib/photos";

const DECK: DeckCase[] = DEMO_CASES.map((c) => ({
  title: c.title,
  specialty: specialtyName(c.specialty),
  level: difficultyLabel(c.difficulty),
  setting: c.content.setting.replace(/ — .*$/, ""),
  patient: `${c.content.patient.name}, ${c.content.patient.age} ans`,
  complaint: c.content.chiefComplaint.fr ?? c.content.chiefComplaint.en,
}));

const STEPS: [string, string][] = [
  ["Choisir un patient", "Spécialité, niveau et cas, dans une bibliothèque relue par des experts."],
  ["Interroger", "À l'écrit ou à la voix, en français, en arabe ou en anglais."],
  ["Examiner", "35 gestes d'examen, tensiomètre et glucomètre, résultats tirés du dossier."],
  ["Demander des examens", "Biologie, ECG, imagerie — les examens inutiles coûtent des points."],
  ["Raisonner", "Diagnostics différentiels, diagnostic retenu, arguments."],
  ["Prendre en charge", "Traitement, surveillance, orientation ; gestes dangereux signalés."],
  ["Recevoir sa note", "Détail point par point selon la grille, avec points pédagogiques."],
];

export default function Home() {
  return (
    <>
      <Hero />

      {/* ───────────── CHIFFRES ───────────── */}
      <section className="border-b border-[rgb(var(--line))] pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-[rgb(var(--line))] px-4 sm:px-6 md:grid-cols-4 md:divide-x">
          {[[10, "", "spécialités couvertes"], [35, "", "gestes d'examen clinique"], [34, "", "examens complémentaires"], [3, "", "langues de consultation"]].map(([n, s, l], i) => (
            <Reveal key={l as string} delay={i * 0.1} className="py-8 md:px-8 first:md:pl-0">
              <p className="font-display text-5xl font-bold text-[#1f6fe0] dark:text-[#6fb1ff]"><CountUp to={n as number} suffix={s as string} /></p>
              <p className="muted mt-1 text-sm">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── FILM ───────────── */}
      <section className="relative overflow-hidden bg-[#050c1a] py-24 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[#0a5be0]/20 blur-[140px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Le film · 1 minute</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">Au début, on ne peut pas s&apos;entraîner sur un vrai patient.</h2>
            <p className="mt-4 text-lg text-white/65">Voici comment Clinika comble ce vide entre les cours et le lit du malade.</p>
          </Reveal>
          <Reveal className="mt-12">
            <PromoFilm />
          </Reveal>
        </div>
      </section>

      {/* ───────────── DÉMO ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal><p className="eyebrow-light">Démo</p></Reveal>
            <Reveal><h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Posez vos questions à Mourad.</h2></Reveal>
            <Reveal>
              <p className="muted mt-4 text-lg leading-relaxed">58 ans, routier, réveillé par une douleur dans la poitrine. Il ne répond qu&apos;à ce que vous lui demandez. Essayez en français, en arabe ou même en darija : « wach bik ? ».</p>
            </Reveal>
            <Reveal>
              <ul className="mt-6 divide-y divide-[rgb(var(--line))] border-y border-[rgb(var(--line))] text-sm">
                {["Le patient ne connaît pas son diagnostic : il ne peut pas le révéler.", "Ses réponses viennent du dossier du cas, jamais inventées.", "La démo publique est gratuite et sans inscription."].map((t) => (
                  <li key={t} className="flex gap-3 py-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1f6fe0]" /> {t}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal>
            <div id="demo" className="scroll-mt-28 rounded-2xl border border-[rgb(var(--line))] bg-[rgb(var(--panel-2))] p-2">
              <LiveDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── ALGÉRIE ───────────── */}
      <section className="relative overflow-hidden bg-[#071026] py-24 text-white">
        <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-[#38e1ff]/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Reveal><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Pensé pour l&apos;Algérie</p></Reveal>
            <Reveal><h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">Des cas qui ressemblent à vos stages.</h2></Reveal>
            <Reveal>
              <p className="mt-5 text-lg leading-relaxed text-white/65">Urgences d&apos;un CHU d&apos;Alger à 2 h du matin, consultation de pédiatrie dans un EPSP d&apos;Oran, polyclinique de Blida… Les situations aussi sont familières : jeûne du Ramadan chez un diabétique, chemma, allergie au Bactrim, thrombolyse quand la salle de cathétérisme est trop loin.</p>
            </Reveal>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                ["Cursus", "Cas fondamentaux, intermédiaires et avancés, de l'externat au résidanat."],
                ["Langues", "Interface en français ; consultation en français, arabe ou anglais."],
                ["Validation", "Chaque faculté fait relire ses cas par ses propres experts avant de les assigner."],
                ["Tarifs", "Formule gratuite, Étudiant Pro à 1 200 DA par mois, licence faculté sur devis."],
              ].map(([t, d]) => (
                <Reveal key={t}>
                  <dt className="font-semibold text-white">{t}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-white/60">{d}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
          <Reveal>
            <CaseDeck cases={DECK} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── DÉROULÉ ───────────── */}
      <section className="bg-[#050c1a] py-24 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Déroulé d&apos;une simulation</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">Le même enchaînement qu&apos;en consultation réelle.</h2>
            <p className="mt-4 text-lg text-white/60">Sept étapes, environ 15 à 25 minutes par cas.</p>
          </Reveal>
          <StepsTimeline steps={STEPS} />
          <Reveal className="mt-14 text-center">
            <Link href="/features" className="btn-primary px-6 py-3.5 text-[15px] font-semibold">Voir toutes les fonctionnalités <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* ───────────── PHOTO ───────────── */}
      <section className="relative">
        <ParallaxPhoto photo="hallwayDoctors" className="h-[460px]" strength={30} />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
            <p className="max-w-2xl font-display text-3xl font-semibold leading-snug text-white sm:text-4xl">« Chaque grand clinicien a d&apos;abord été un externe stressé face à son premier patient. »</p>
          </div>
        </div>
      </section>

      {/* ───────────── SPÉCIALITÉS ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Reveal><p className="eyebrow-light">Spécialités</p></Reveal>
            <Reveal><h2 className="mt-4 text-3xl font-bold sm:text-4xl">Dix spécialités, un seul outil.</h2></Reveal>
          </div>
          <Link href="/specialties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">Toutes les spécialités <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALTIES.map((s) => (
            <Link key={s.key} href={`/specialties#${s.key}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Photo photo={SPECIALTY_PHOTO[s.key]} className="absolute inset-0" sizes="(max-width:640px) 100vw, 25vw" w={800} />
              </div>
              <h3 className="mt-3 font-semibold group-hover:text-brand-600">{s.name}</h3>
              <p className="muted mt-0.5 text-sm">{s.blurb}</p>
            </Link>
          ))}
          <Link href="/register" className="flex flex-col justify-center rounded-xl border border-dashed border-[rgb(var(--line))] p-6 hover:border-brand-500">
            <p className="font-semibold">Votre faculté a ses propres cas ?</p>
            <p className="muted mt-1 text-sm">Les enseignants peuvent rédiger, faire valider et publier leurs scénarios.</p>
          </Link>
        </div>
      </section>

      {/* ───────────── FIABILITÉ ───────────── */}
      <section className="relative overflow-hidden bg-[#071026] py-24 text-white">
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[460px] w-[460px] rounded-full bg-[#0a5be0]/20 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Fiabilité</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">La note vient d&apos;une grille, pas d&apos;une impression.</h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">Chaque point gagné ou perdu correspond à un critère écrit par un enseignant. Le commentaire automatique explique la note ; il ne la décide jamais.</p>
          </Reveal>
          <div className="mt-12">
            <ReliabilityPanel />
          </div>
        </div>
      </section>

      {/* ───────────── ENSEIGNANTS ───────────── */}
      <section className="relative overflow-hidden bg-[#050c1a] pb-32 pt-24 text-white">
        <div className="pointer-events-none absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-[#2f86ff]/15 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">Ce que demandent les enseignants</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">Conçu avec les attentes des facultés en tête.</h2>
            <p className="mt-4 text-white/60">Trois besoins que nous entendons le plus souvent chez les enseignants.</p>
          </Reveal>
          <div className="mt-14">
            <TeacherVoices />
          </div>
          <p className="mt-16 text-center text-xs text-white/35">Propos illustratifs, à remplacer par des témoignages vérifiés de facultés pilotes avant le lancement.</p>
        </div>
      </section>

    </>
  );
}
