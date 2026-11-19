import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "FAQ — questions fréquentes",
  description: "Réponses sur les patients virtuels Clinika, le comportement de l'IA, la notation, les langues, la protection des données et l'offre pour les facultés.",
};

const FAQ = [
  ["Clinika est-il un outil de diagnostic ?", "Non. Clinika est une plateforme de simulation pédagogique. Tous les patients sont fictifs et rien de ce qu'elle produit n'est un avis médical applicable à de vrais patients."],
  ["Comment le patient virtuel répond-il à mes questions ?", "En mode IA, un modèle de langage joue le rôle du patient à partir des seules informations qu'il est censé connaître. En mode démonstration (sans clé d'IA configurée), un moteur hors ligne répond mot pour mot à partir du dossier. La salle indique toujours le mode actif."],
  ["L'IA peut-elle révéler le diagnostic ou modifier le cas ?", "Non. Le diagnostic, la grille et les résultats d'examens ne sont jamais transmis au moteur de conversation. Le cas est la seule source de vérité et il est figé pour chaque consultation."],
  ["Comment ma note est-elle calculée ?", "De façon déterministe, à partir de la grille propre à chaque cas : thèmes d'interrogatoire abordés, gestes et examens essentiels, diagnostic et différentiels, choix de prise en charge (avec pénalités pour les gestes dangereux ou inutiles). Chaque point apparaît dans votre rapport."],
  ["Le feedback de l'IA est-il validé par des médecins ?", "Les cas et les grilles sont relus par des cliniciens avant publication. Le commentaire narratif qui explique votre note est produit automatiquement et n'est pas validé médicalement de façon indépendante : utilisez-le comme aide à l'apprentissage et discutez-en avec vos enseignants."],
  ["Les cas sont-ils adaptés au contexte algérien ?", "Oui. Les patients, les villes, les structures (CHU, EPSP, polycliniques), les habitudes (chemma, jeûne du Ramadan) et les stratégies de prise en charge tiennent compte de la pratique en Algérie. Chaque faculté peut aussi rédiger ses propres cas."],
  ["Quelles langues sont disponibles ?", "L'interface est en français. Les consultations se déroulent en français, en arabe ou en anglais. En mode IA, le patient s'exprime comme un patient algérien ; le moteur hors ligne comprend aussi quelques expressions de darija."],
  ["La voix fonctionne-t-elle ?", "La voix utilise la reconnaissance et la synthèse vocales de votre navigateur (de préférence Chrome ou Edge). Elle est disponible avec les formules Étudiant Pro et Faculté."],
  ["Qui peut voir mes consultations ?", "Vous, les enseignants de vos groupes, les administrateurs de votre faculté et les administrateurs de la plateforme. Chaque action d'administration est inscrite au journal d'audit."],
  ["Le paiement est-il réel ?", "Pas dans cette version : les abonnements fonctionnent en mode démonstration clairement signalé, sans aucun débit. La facturation est prête à être reliée à un prestataire de paiement (CIB / Edahabia ou autre)."],
];

export default function FaqPage() {
  return (
    <>
      <PageHero align="center" eyebrow="FAQ" photo="bookStethoscope" title={<>Des questions ? <span className="text-gradient">Des réponses.</span></>} sub="Tout sur les patients virtuels, l'IA, la notation, les langues et la protection des données." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="panel group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="muted mt-3 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
        <p className="muted mt-8 text-sm">
          Une autre question ? <Link className="font-semibold text-brand-600 hover:underline" href="/contact">Contactez-nous</Link>.
        </p>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "fr-DZ", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }),
          }}
        />
      </div>
    </>
  );
}
