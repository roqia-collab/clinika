import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 text-5xl font-bold">404</h1>
        <p className="muted mt-2">Cette page est introuvable.</p>
        <Link href="/" className="btn-primary mt-6">Retour à l'accueil</Link>
      </div>
    </div>
  );
}
