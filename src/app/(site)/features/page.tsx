import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Box, CheckCircle2, FileText, Globe2, Lock, Mic, ShieldCheck, Stethoscope, Users } from "@/components/icons";
import { PageHero } from "@/components/site/page-hero";
import { Photo, Reveal, TiltCard } from "@/components/motion";
import { HeartScene } from "@/components/three";
import type { PhotoKey } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Fonctionnalités — patients virtuels, consultation simulée, examens et évaluation",
  description: "Comment Clinika simule une consultation : patient virtuel verrouillé sur le cas, examen clinique, examens complémentaires, raisonnement et évaluation par grille.",
};

const SECTIONS: { id: string; icon: typeof Users; title: string; nav: string; body: string; points: string[]; photo?: PhotoKey; three?: boolean }[] = [
  { id: "patients", nav: "Patients virtuels", icon: Users, photo: "bedside2", title: "Des patients virtuels avec une vraie personnalité", body: "Chaque cas définit un patient fictif — âge, profession, caractère, état émotionnel — et sa réponse à chaque thème de l'interrogatoire. Le patient réagit (douleur, angoisse, agacement) et son avatar l'exprime en temps réel.", points: ["Réponses guidées par le profil (stoïque, anxieux, accompagné d'un parent…)", "Avatar qui change d'expression selon l'émotion", "Moniteur au lit du patient avec dégradation programmée"] },
  { id: "consultation", nav: "Consultation", icon: BrainCircuit, photo: "consultation", title: "Un patient qui ne trahit jamais le cas", body: "Le moteur de conversation ne reçoit que ce que le patient est censé savoir. Le diagnostic, la grille et les résultats ne lui sont jamais transmis. Si le service d'IA est indisponible, un moteur hors ligne répond mot pour mot à partir du dossier.", points: ["Historique de consultation persistant et contextuel", "Résistant aux tentatives de faire sortir le patient de son rôle", "Mode démonstration clairement signalé sans clé d'IA"] },
  { id: "exams", nav: "Examens", icon: Stethoscope, photo: "vitalsMonitor", title: "Examen clinique et examens complémentaires", body: "35 gestes d'examen et 34 examens complémentaires — biologie, ECG, imagerie, microbiologie, actes. Les résultats viennent du cas ; les systèmes non concernés renvoient des résultats normaux.", points: ["Résultats anormaux signalés comme dans un vrai logiciel de résultats", "Examens inutiles comptabilisés et pénalisés", "Délais affichés pour apprendre le coût et le temps"] },
  { id: "assessment", nav: "Évaluation", icon: FileText, photo: "bookStethoscope", title: "Une évaluation clinique transparente", body: "La note est calculée de façon déterministe à partir d'une grille explicite : interrogatoire, examen, examens complémentaires, diagnostic, prise en charge. Le feedback narratif par IA (Pro et Faculté) explique la note — il ne la fixe jamais.", points: ["Chaque point rattaché à un critère nommé", "Choix dangereux pénalisés et expliqués", "Rapports PDF, commentaires et ajustement de note par l'enseignant"] },
  { id: "review", nav: "Validation", icon: ShieldCheck, photo: "medicalTeam", title: "Circuit de validation par des experts", body: "Un cas passe de Brouillon → En validation → Publié. La publication exige un expert nommé et l'attestation que le cas est fictif, cohérent, sûr et que sa grille a été relue. Toute modification ultérieure le renvoie en brouillon.", points: ["Cas et grilles versionnés", "Journal d'audit de chaque publication et modification", "Seuls les cas publiés peuvent être assignés"] },
  { id: "languages", nav: "Langues", icon: Globe2, photo: "algiersSunset", title: "Français, arabe et anglais", body: "Interface en français et consultations en français, en arabe (affichage de droite à gauche) ou en anglais. En mode IA, le patient parle comme un patient algérien et traduit fidèlement les faits du dossier.", points: ["Conversation adaptée à l'arabe (RTL)", "Le moteur hors ligne comprend aussi quelques mots de darija", "Langue enregistrée pour chaque consultation"] },
  { id: "voice", nav: "Voix", icon: Mic, photo: "doctorPortrait", title: "Consultation vocale", body: "Parlez au patient et écoutez ses réponses grâce à la reconnaissance et à la synthèse vocales du navigateur. La salle vous prévient si votre navigateur ne les prend pas en charge.", points: ["Micro en appuyer-pour-parler", "Lecture vocale des réponses du patient", "Fournisseurs vocaux serveur intégrables plus tard"] },
  { id: "3d", nav: "3D", icon: Box, three: true, title: "Prêt pour la 3D", body: "L'avatar passe par une interface de rendu interchangeable, pilotée par le flux d'émotions du moteur. Aujourd'hui : un patient illustré dans la salle et de l'anatomie 3D en temps réel sur la plateforme. Demain : des patients 3D animés.", points: ["Interface de rendu documentée dans le code", "Émotion et parole déjà transmises par le moteur"] },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Fonctionnalités" photo="surgeonsLooking" title={<>Tout ce qu&apos;exige une consultation. <span className="text-gradient">Sans aucun risque.</span></>} sub="Clinika est une plateforme de simulation pédagogique. Ce n'est pas un dispositif médical et elle ne pose aucun diagnostic pour de vrais patients.">
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="glass rounded-full px-4 py-2 text-sm text-white/80 transition hover:bg-white/15 hover:text-white">{s.nav}</a>
          ))}
        </nav>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-24 px-4 py-20 sm:space-y-32 sm:px-6">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className={i % 2 ? "lg:order-2" : ""}>
              <TiltCard className="rounded-2xl" intensity={6}>
                {s.three ? (
                  <div className="noise relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-950">
                    <div className="aurora absolute inset-0" />
                    <HeartScene className="absolute inset-0" />
                  </div>
                ) : (
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Photo photo={s.photo!} className="absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-navy-950/70 via-transparent to-transparent" />
                    <span className="glass absolute bottom-5 left-5 grid h-12 w-12 place-items-center rounded-2xl text-white"><s.icon className="h-6 w-6" /></span>
                  </div>
                )}
              </TiltCard>
            </Reveal>
            <div className={i % 2 ? "lg:order-1" : ""}>
              <Reveal><p className="font-mono text-sm text-teal-600 dark:text-teal-400">0{i + 1} / 0{SECTIONS.length}</p></Reveal>
              <Reveal delay={0.08}><h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{s.title}</h2></Reveal>
              <Reveal delay={0.16}><p className="muted mt-4 text-lg leading-relaxed">{s.body}</p></Reveal>
              <Reveal delay={0.24}>
                <ul className="mt-6 space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" /> {p}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>
        ))}

        <Reveal>
          <div className="ring-gradient panel flex flex-wrap items-center justify-between gap-6 rounded-2xl p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/15"><Lock className="h-6 w-6" /></span>
              <p className="max-w-2xl text-[15px]"><strong>Sécurité dès la conception :</strong> contrôle d&apos;accès par rôle, mots de passe chiffrés, sessions httpOnly, validation de chaque requête, journal d&apos;audit et limitation du nombre de requêtes.</p>
            </div>
            <Link href="/register" className="btn-primary">Essayer gratuitement <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
