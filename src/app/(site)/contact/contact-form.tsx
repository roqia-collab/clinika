"use client";

import { useState } from "react";
import { CheckCircle2 } from "@/components/icons";
import { api } from "@/lib/client";

export function ContactForm({ initialKind }: { initialKind: "CONTACT" | "DEMO" }) {
  const [kind, setKind] = useState(initialKind);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/contact", "POST", {
        kind,
        name: f.get("name"),
        email: f.get("email"),
        organization: f.get("organization") || undefined,
        role: f.get("role") || undefined,
        message: f.get("message"),
        website: f.get("website") || undefined,
      });
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "sent")
    return (
      <div className="panel grid place-items-center p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h2 className="mt-3 text-xl font-bold">Merci — message bien reçu</h2>
        <p className="muted mt-1 text-sm">Nous revenons vers vous rapidement.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="panel space-y-4 p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[rgb(var(--panel-2))] p-1" role="radiogroup" aria-label="Type de demande">
        {(["CONTACT", "DEMO"] as const).map((k) => (
          <button type="button" role="radio" aria-checked={kind === k} key={k} onClick={() => setKind(k)} className={`rounded-lg py-2 text-sm font-semibold transition ${kind === k ? "bg-[rgb(var(--panel))] shadow-card" : "subtle"}`}>
            {k === "CONTACT" ? "Question générale" : "Demander une démo"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Nom complet</label>
          <input id="name" name="name" required minLength={2} className="field" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required className="field" autoComplete="email" />
        </div>
      </div>
      {kind === "DEMO" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="organization">Faculté / établissement</label>
            <input id="organization" name="organization" required className="field" />
          </div>
          <div>
            <label className="label" htmlFor="role">Votre fonction</label>
            <input id="role" name="role" className="field" placeholder="ex. Responsable du centre de simulation" />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="message">Message</label>
        <textarea id="message" name="message" required minLength={10} rows={5} className="field" placeholder={kind === "DEMO" ? "Effectif des promotions, spécialités visées, calendrier…" : "Comment pouvons-nous vous aider ?"} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? "Envoi…" : kind === "DEMO" ? "Demander la démo" : "Envoyer le message"}
      </button>
      <p className="subtle text-xs">N&apos;indiquez aucune information sur de vrais patients.</p>
    </form>
  );
}
