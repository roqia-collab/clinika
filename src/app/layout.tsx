import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Clinika — Simulation de patients virtuels pour les études de médecine en Algérie", template: "%s · Clinika" },
  description:
    "Clinika permet aux étudiants en médecine d'interroger des patients virtuels, de les examiner, de demander des examens, de raisonner jusqu'au diagnostic et de recevoir un feedback pédagogique fondé sur une grille d'évaluation.",
  keywords: ["patient virtuel", "simulation médicale", "raisonnement clinique", "études de médecine Algérie", "ECOS", "externat", "internat", "résidanat"],
  openGraph: { type: "website", siteName: "Clinika", locale: "fr_DZ", title: "Clinika — Simulation de patients virtuels", description: "Entraînez votre raisonnement clinique avec des patients virtuels réalistes." },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg?v=3", apple: "/favicon.svg?v=3" }, // ?v= forces browsers to refresh the cached icon
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#070D1F" },
  ],
};

// Applies the saved/OS theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('medsim-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-DZ" className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
