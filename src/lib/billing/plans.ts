export type PlanKey = "FREE" | "STUDENT_PRO" | "UNIVERSITY";

/** Prix en dinars algériens (DA / DZD). */
export const CURRENCY = "DZD";
export const formatDA = (amount: number) => `${new Intl.NumberFormat("fr-DZ").format(amount)} DA`;

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceMonthly: number; // DA
  priceYearly: number; // DA
  tagline: string;
  features: string[];
  limits: {
    simulationsPerMonth: number | null; // null = illimité
    fullLibrary: boolean;
    aiFeedback: boolean;
    analytics: boolean;
    pdfReports: boolean;
    voice: boolean;
    institution: boolean;
  };
}

export const PLANS: PlanDef[] = [
  {
    key: "FREE",
    name: "Gratuit",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Commencez à entraîner votre raisonnement clinique dès aujourd'hui.",
    features: ["5 simulations par mois", "Bibliothèque de cas fondamentaux", "Notation par grille d'évaluation", "Tableau de bord étudiant"],
    limits: { simulationsPerMonth: 5, fullLibrary: false, aiFeedback: false, analytics: false, pdfReports: false, voice: false, institution: false },
  },
  {
    key: "STUDENT_PRO",
    name: "Étudiant Pro",
    priceMonthly: 1200,
    priceYearly: 11000,
    tagline: "Le service hospitalier virtuel complet pour l'externat et l'internat.",
    features: ["Simulations illimitées", "Toute la bibliothèque, toutes spécialités", "Commentaire détaillé après chaque cas", "Statistiques détaillées et radar de compétences", "Rapports PDF téléchargeables", "Consultation vocale (navigateur)"],
    limits: { simulationsPerMonth: null, fullLibrary: true, aiFeedback: true, analytics: true, pdfReports: true, voice: true, institution: false },
  },
  {
    key: "UNIVERSITY",
    name: "Faculté",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Simulation et évaluation à l'échelle de la faculté ou du CHU.",
    features: ["Comptes enseignants et étudiants illimités", "Tableau de bord de l'établissement", "Cas cliniques personnalisés", "Gestion des devoirs et des évaluations", "Circuit de validation par des experts", "Rapports avancés et journal d'audit"],
    limits: { simulationsPerMonth: null, fullLibrary: true, aiFeedback: true, analytics: true, pdfReports: true, voice: true, institution: true },
  },
];

export const planByKey = (k: string | null | undefined): PlanDef => PLANS.find((p) => p.key === k) ?? PLANS[0];
