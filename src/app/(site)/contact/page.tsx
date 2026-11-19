import type { Metadata } from "next";
import { Building2, Mail, MessageSquare } from "@/components/icons";
import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact et demande de démo", description: "Contactez l'équipe Clinika ou demandez une démonstration pour votre faculté." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Contact" photo="hallwayDoctors" title={<>Parlons <span className="text-gradient">simulation.</span></>} sub="Questions, partenariats ou démonstration pour votre faculté ou votre CHU — nous répondons généralement sous deux jours ouvrés." />
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 className="mb-6 text-2xl font-bold">Comment pouvons-nous vous aider ?</h2>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Building2 className="h-5 w-5 text-teal-500" />
            <span>
              <strong>Démo pour une faculté</strong>
              <br />
              <span className="muted">Une présentation guidée de la rédaction de cas, des devoirs et des statistiques pour votre équipe pédagogique.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <MessageSquare className="h-5 w-5 text-teal-500" />
            <span>
              <strong>Étudiants</strong>
              <br />
              <span className="muted">Consultez d&apos;abord la FAQ : la plupart des questions sur les comptes y trouvent une réponse.</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Mail className="h-5 w-5 text-teal-500" />
            <span>
              <strong>Messages conservés en toute sécurité</strong>
              <br />
              <span className="muted">et traités par l&apos;équipe depuis la console d&apos;administration.</span>
            </span>
          </li>
        </ul>
      </div>
      <ContactForm initialKind={type === "demo" ? "DEMO" : "CONTACT"} />
    </div>
    </>
  );
}
