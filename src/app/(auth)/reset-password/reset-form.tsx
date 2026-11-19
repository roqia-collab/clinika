"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from "@/components/icons";
import { api } from "@/lib/client";
import { AuthCard, IconField } from "@/components/auth/auth-card";

export function ResetForm({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? "" : "Lien incomplet. Refaites une demande depuis « Mot de passe oublié ».");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return setError("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/reset", "PUT", { token, password: pw });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard tabs={false}>
      {done ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" weight="fill" />
          <h1 className="mt-3 text-lg font-semibold text-slate-900">Mot de passe modifié</h1>
          <p className="mt-1 text-sm text-slate-500">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <Link href="/login" className="btn-primary mt-5 w-full py-3.5">Se connecter <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Choisir un nouveau mot de passe</h1>
            <p className="mt-1 text-sm text-slate-500">Au moins 10 caractères, dont une lettre et un chiffre.</p>
          </div>
          {[["pw", "Nouveau mot de passe", pw, setPw], ["pw2", "Confirmer le mot de passe", pw2, setPw2]].map(([id, label, v, set]) => (
            <div key={id as string}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={id as string}>{label as string}</label>
              <IconField icon={Lock}>
                <input id={id as string} type={show ? "text" : "password"} required minLength={10} autoComplete="new-password" className="field py-3 pl-11 pr-11" value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={show ? "Masquer" : "Afficher"}>
                  {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </IconField>
            </div>
          ))}
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary w-full py-3.5 text-[15px] font-semibold" disabled={busy || !token}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
          <p className="text-center text-sm"><Link href="/forgot-password" className="text-[#1f6fe0] hover:underline">Refaire une demande</Link></p>
        </form>
      )}
    </AuthCard>
  );
}
