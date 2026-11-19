import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = { title: "Conditions, confidentialité et avertissement pédagogique", description: "Conditions d'utilisation, résumé de la politique de confidentialité et avertissement d'usage pédagogique de Clinika." };

export default function LegalPage() {
  return (
    <>
      <PageHero eyebrow="Mentions légales" photo="hospitalLobby" title="Conditions, confidentialité et avertissement pédagogique" sub="Textes types pour cette version — à faire relire par un juriste avant le lancement (notamment au regard de la loi algérienne n° 18-07 sur la protection des données personnelles)." />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="prose-medsim space-y-8">
          <section id="disclaimer" className="scroll-mt-28 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
            <h2 className="mb-2 text-lg font-bold">Avertissement d&apos;usage pédagogique</h2>
            <p>Clinika est une plateforme de simulation pédagogique. Tous les patients virtuels sont fictifs. La plateforme ne pose pas de diagnostic, ne traite pas et ne conseille pas de vrais patients ; elle ne doit pas servir à une décision clinique.</p>
            <p>Les notes reposent sur les grilles propres à chaque cas. Le feedback narratif produit par IA n&apos;est pas validé médicalement de façon indépendante. Les cas destinés à une formation formelle doivent être relus par des experts cliniques qualifiés de la faculté qui les utilise.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold">Conditions d&apos;utilisation</h2>
            <p>Vous ne devez saisir aucune information sur de vrais patients, aucune donnée de santé personnelle ni aucune donnée identifiante de tiers. Vous êtes responsable de la confidentialité de vos identifiants. Les facultés sont responsables des contenus qu&apos;elles rédigent et publient.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold">Résumé de confidentialité</h2>
            <p>Nous conservons les informations de votre compte, les transcriptions de consultation, vos actions et vos résultats afin de fournir le service et de permettre le suivi par votre faculté. Les mots de passe sont stockés sous forme chiffrée (hachage salé). Les consultations ne sont visibles que par vous, vos enseignants, les administrateurs de votre faculté et ceux de la plateforme. En mode IA, le texte des consultations est transmis, via notre serveur, au fournisseur de modèle de langage configuré afin de générer les réponses.</p>
          </section>
        </div>
      </div>
    </>
  );
}
