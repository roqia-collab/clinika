import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { googleEnabled } from "@/lib/auth/google";

export const metadata: Metadata = { title: "Créer un compte", description: "Créez un compte Clinika gratuit, avec votre e-mail ou votre compte Google." };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return <RegisterForm wantsPro={plan === "pro"} google={googleEnabled()} />;
}
