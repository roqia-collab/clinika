import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo";
import { googleEnabled } from "@/lib/auth/google";
import { GOOGLE_ERRORS } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string; error?: string; registered?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const initialError = sp.denied ? "Votre compte n'a pas accès à cet espace." : sp.error ? GOOGLE_ERRORS[sp.error] ?? "" : "";
  return <LoginForm next={next} initialError={initialError} registered={sp.registered === "1"} demo={DEMO_LOGIN_ENABLED()} google={googleEnabled()} />;
}
