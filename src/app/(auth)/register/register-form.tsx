"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChalkboardTeacher, Eye, EyeOff, Lock, Mail, Student, UserRound } from "@/components/icons";
import { AuthCard, Divider, IconField } from "@/components/auth/auth-card";
import { api } from "@/lib/client";
import { GoogleButton } from "@/components/auth/google-button";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
  return s;
}

export function RegisterForm({ wantsPro, google }: { wantsPro: boolean; google: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const st = strength(pw);
  const next = wantsPro && role === "STUDENT" ? "/app/billing?upgrade=1" : undefined;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api<{ redirect: string }>("/api/auth/register", "POST", {
        name: f.get("name"),
        email: f.get("email"),
        password: pw,
        role,
        yearOfStudy: role === "STUDENT" && f.get("year") ? Number(f.get("year")) : undefined,
        acceptTerms: f.get("terms") === "on",
      });
      try {
        sessionStorage.setItem("clinika-new-email", String(f.get("email") ?? ""));
      } catch {}
      router.push(`/login?registered=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthCard>
      <p className="mb-2 text-sm font-medium text-slate-700">Vous êtes</p>
      <div className="grid grid-cols-2 gap-2 text-sm font-medium" role="radiogroup" aria-label="Vous êtes">
        {([["STUDENT", "Étudiant(e)", Student], ["TEACHER", "Enseignant(e)", ChalkboardTeacher]] as const).map(([k, l, Icon]) => (
          <button key={k} type="button" role="radio" aria-checked={role === k} onClick={() => setRole(k)} className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 transition ${role === k ? "border-[#1f6fe0] bg-[#1f6fe0]/[0.06] text-[#1f6fe0]" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}>
            <Icon className="h-5 w-5" weight={role === k ? "fill" : "regular"} /> {l}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <GoogleButton enabled={google} label="S'inscrire avec Google" href={`/api/auth/google?role=${role}${next ? `&next=${encodeURIComponent(next)}` : ""}`} />
      </div>
      <Divider label="ou avec votre e-mail" />

      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="name">Nom et prénom</label>
          <IconField icon={UserRound}><input id="name" name="name" required minLength={2} autoComplete="name" placeholder="Prénom Nom" className="field py-3 pl-11" /></IconField>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">Adresse e-mail</label>
          <IconField icon={Mail}><input id="email" name="email" type="email" required autoComplete="email" placeholder="prenom.nom@univ-alger.dz" className="field py-3 pl-11" /></IconField>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">Mot de passe</label>
          <IconField icon={Lock}>
            <input id="password" name="password" type={show ? "text" : "password"} required minLength={10} autoComplete="new-password" className="field py-3 pl-11 pr-11" value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby="pw-hint" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 text-slate-400 top-1/2 -translate-y-1/2 hover:text-[rgb(var(--ink))]" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </IconField>
          <div className="mt-2 grid grid-cols-3 gap-1" aria-hidden>
            {[0, 1, 2].map((i) => <span key={i} className={`h-1 rounded-full ${st > i ? (st === 3 ? "bg-success" : st === 2 ? "bg-brand-600" : "bg-amber-500") : "bg-[rgb(var(--line))]"}`} />)}
          </div>
          <p id="pw-hint" className="subtle mt-1 text-xs">Au moins 10 caractères, dont une lettre et un chiffre.</p>
        </div>
        {role === "STUDENT" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="year">Année d&apos;études</label>
            <select id="year" name="year" className="field py-3" defaultValue="3">
              {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                <option key={y} value={y}>
                  {y === 1 ? "1re année" : `${y}e année`}{y >= 4 && y <= 6 ? " (externat)" : y === 7 ? " (internat)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 accent-[#1f6fe0]" />
          <span className="muted">
            J&apos;accepte les <Link href="/legal" className="text-[#1f6fe0] underline">conditions</Link> et je comprends que Clinika est une simulation pédagogique avec des patients fictifs, et non une source d&apos;avis médical.
          </span>
        </label>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <button className="btn-primary w-full py-3.5 text-[15px] font-semibold" disabled={busy}>
          {busy ? "Création du compte…" : <>Créer mon compte <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà inscrit ? <Link href="/login" className="font-semibold text-[#1f6fe0] hover:underline">Se connecter</Link>
      </p>
    </AuthCard>
  );
}
