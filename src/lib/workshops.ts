export const WORKSHOPS = [
  {
    slug: "ecg",
    title: "ECG à interpréter",
    sub: "Dix tracés 12 dérivations à lire avec méthode : rythme, fréquence, PR, QRS, repolarisation, conclusion et conduite à tenir.",
    minutes: 15,
    level: "Externat",
    skills: ["Lecture systématique", "Compas", "Urgences ECG"],
  },
  {
    slug: "suture",
    title: "Suture d'une plaie simple",
    sub: "Antisepsie, anesthésie locale, choix du fil, points simples mesurés au millimètre, nœuds et pansement.",
    minutes: 10,
    level: "Externat",
    skills: ["Points simples", "Asepsie", "Anesthésie locale"],
  },
  {
    slug: "tension",
    title: "Mesure de la tension artérielle",
    sub: "Tensiomètre manuel et bruits de Korotkoff : mesurez la tension de trois patients et comparez à la référence.",
    minutes: 6,
    level: "Fondamental",
    skills: ["Brassard", "Korotkoff", "Précision"],
  },
  {
    slug: "perfusion",
    title: "Perfusions et débits",
    sub: "Sérum salé, glucosé, Ringer : calculez le débit en gouttes par minute pour cinq prescriptions.",
    minutes: 8,
    level: "Fondamental",
    skills: ["Débit", "Gouttes/min", "mL/h"],
  },
] as const;

export type WorkshopSlug = (typeof WORKSHOPS)[number]["slug"];
