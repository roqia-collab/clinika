"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Download, Eye, EyeOff, Lock, Settings, ShieldCheck, Target, UserRound } from "@/components/icons";
import { api } from "@/lib/client";
import { AVATAR_GRADIENT, type Prefs } from "@/lib/prefs";

type Tab = "profile" | "prefs" | "security" | "data";
const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "profile", label: "Profil", icon: UserRound },
  { key: "prefs", label: "Préférences", icon: Settings },
  { key: "security", label: "Sécurité", icon: ShieldCheck },
  { key: "data", label: "Données", icon: Download },
];

interface Props {
  user: { name: string; email: string; role: string; isStudent: boolean; university: string | null; yearOfStudy: number | null; plan: string; createdAt: string; lastLoginAt: string | null; google: boolean };
  prefs: Prefs;
  stats: { done: number; avg: number | null; best: number | null; thisWeek: number };
  logins: { action: string; at: string; ip: string | null }[];
  permissions: { key: string; label: string }[];
}

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const fmt = (d: string) => new Date(d).toLocaleString("fr-DZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function SettingsClient(p: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [prefs, setPrefs] = useState(p.prefs);
  const [name, setName] = useState(p.user.name);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const flash = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 2600);
  };

  async function savePrefs(patch: Partial<Prefs>) {
    const prev = prefs;
    setPrefs({ ...prefs, ...patch });
    try {
      await api("/api/me", "PATCH", { preferences: patch });
      try {
        localStorage.setItem("clinika-prefs", JSON.stringify({ ...prev, ...patch }));
      } catch {}
      flash(true, "Préférence enregistrée");
    } catch (e) {
      setPrefs(prev);
      flash(false, (e as Error).message);
    }
  }

  const goalPct = Math.min(100, Math.round((p.stats.thisWeek / prefs.weeklyGoal) * 100));

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] px-4 py-8 text-white sm:-mx-6 sm:-my-8 sm:px-8 sm:py-10">
      <div className="relative mx-auto max-w-5xl">
        <div className="pointer-events-none absolute -top-24 right-0 h-[320px] w-[460px] rounded-full bg-[#2f86ff]/15 blur-[120px]" />

        {/* Header card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2350] via-[#0a1830] to-[#081427] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <motion.span layout className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-bold shadow-[0_15px_40px_-15px_rgba(47,134,255,0.8)] ${AVATAR_GRADIENT[prefs.avatarColor]}`}>
              {initials(name)}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-2xl font-bold sm:text-3xl">{name}</p>
              <p className="truncate text-sm text-white/60">{p.user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-white/10 px-2.5 py-1">{p.user.role}</span>
                <span className="rounded-full bg-[#2f86ff]/20 px-2.5 py-1 text-[#9ccaff]">{p.user.plan}</span>
                {p.user.yearOfStudy && <span className="rounded-full bg-white/10 px-2.5 py-1">{p.user.yearOfStudy}e année</span>}
                {p.user.google && <span className="rounded-full bg-white/10 px-2.5 py-1">Compte Google lié</span>}
              </div>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Simulations", String(p.stats.done)],
              ["Note moyenne", p.stats.avg === null ? "—" : `${p.stats.avg}/100`],
              ["Meilleure note", p.stats.best === null ? "—" : `${p.stats.best}/100`],
              ["Cette semaine", `${p.stats.thisWeek}/${prefs.weeklyGoal}`],
            ].map(([k, v], i) => (
              <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <dt className="text-xs text-white/50">{k}</dt>
                <dd className="mt-0.5 font-display text-2xl font-bold">{v}</dd>
              </motion.div>
            ))}
          </dl>
        </section>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className="relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium">
              {tab === t.key && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#1f7bff] to-[#0a5be0]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <t.icon className="relative h-4 w-4" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-6">
            {tab === "profile" && <ProfileTab user={p.user} name={name} setName={setName} prefs={prefs} savePrefs={savePrefs} flash={flash} onSaved={() => router.refresh()} goalPct={goalPct} thisWeek={p.stats.thisWeek} />}
            {tab === "prefs" && <PrefsTab prefs={prefs} savePrefs={savePrefs} />}
            {tab === "security" && <SecurityTab user={p.user} logins={p.logins} permissions={p.permissions} />}
            {tab === "data" && <DataTab email={p.user.email} google={p.user.google} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-2xl ${toast.ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`} role="status">
            {toast.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} {toast.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────── Shared bits ─────────────────────────

function Panel({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 ${className}`}>
      <h2 className="font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-white/50">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {sub && <span className="block text-xs text-white/50">{sub}</span>}
      </span>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#1f7bff]" : "bg-white/15"}`}>
        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? "right-0.5" : "left-0.5"}`} />
      </button>
    </label>
  );
}

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#2f86ff] focus:outline-none focus:ring-4 focus:ring-[#2f86ff]/15";

// ───────────────────────── Profile ─────────────────────────

function ProfileTab({ user, name, setName, prefs, savePrefs, flash, onSaved, goalPct, thisWeek }: { user: Props["user"]; name: string; setName: (v: string) => void; prefs: Prefs; savePrefs: (p: Partial<Prefs>) => void; flash: (ok: boolean, t: string) => void; onSaved: () => void; goalPct: number; thisWeek: number }) {
  const [year, setYear] = useState<number | null>(user.yearOfStudy);
  const [busy, setBusy] = useState(false);
  const dirty = name.trim() !== user.name || year !== user.yearOfStudy;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Panel title="Informations personnelles" sub="Visibles par vos enseignants et dans vos rapports.">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/api/me", "PATCH", { name: name.trim(), ...(user.isStudent ? { yearOfStudy: year } : {}) });
              flash(true, "Profil mis à jour");
              onSaved();
            } catch (err) {
              flash(false, (err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="s-name">Nom et prénom</label>
            <input id="s-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="s-email">Adresse e-mail</label>
            <input id="s-email" className={`${inputCls} opacity-60`} value={user.email} disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {user.isStudent && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="s-year">Année d&apos;études</label>
                <select id="s-year" className={inputCls} value={year ?? ""} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}>
                  <option value="" className="bg-[#081427]">—</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                    <option key={y} value={y} className="bg-[#081427]">{y === 1 ? "1re année" : `${y}e année`}{y >= 4 && y <= 6 ? " (externat)" : y === 7 ? " (internat)" : ""}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-xs font-medium text-white/60">Faculté</p>
              <p className="rounded-xl border border-white/10 px-3.5 py-2.5 text-sm text-white/70">{user.university ?? "Non rattaché"}</p>
            </div>
          </div>
          <button className="btn-primary" disabled={!dirty || busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </form>
      </Panel>

      <div className="space-y-6">
        <Panel title="Couleur de l'avatar">
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(AVATAR_GRADIENT) as Prefs["avatarColor"][]).map((c) => (
              <button key={c} onClick={() => savePrefs({ avatarColor: c })} aria-label={c} aria-pressed={prefs.avatarColor === c} className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br transition hover:scale-110 ${AVATAR_GRADIENT[c]} ${prefs.avatarColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#050c1a]" : ""}`}>
                {prefs.avatarColor === c && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Objectif hebdomadaire" sub="Nombre de simulations à terminer chaque semaine.">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-[#6fb1ff]" />
            <input type="range" min={1} max={15} value={prefs.weeklyGoal} onChange={(e) => savePrefs({ weeklyGoal: Number(e.target.value) })} className="flex-1 accent-[#1f7bff]" aria-label="Objectif hebdomadaire" />
            <span className="w-8 text-right font-display text-xl font-bold">{prefs.weeklyGoal}</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/55"><span>Cette semaine</span><span>{thisWeek}/{prefs.weeklyGoal}</span></div>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/10">
              <motion.span className="block h-full rounded-full bg-gradient-to-r from-[#2f86ff] to-[#38e1ff]" initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.9 }} />
            </span>
            {goalPct >= 100 && <p className="mt-2 text-xs text-emerald-300">Objectif atteint, bravo !</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ───────────────────────── Preferences ─────────────────────────

function PrefsTab({ prefs, savePrefs }: { prefs: Prefs; savePrefs: (p: Partial<Prefs>) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Consultation">
        <p className="mb-2 text-sm font-medium">Langue par défaut avec le patient</p>
        <div className="grid grid-cols-3 gap-2">
          {([["fr", "Français"], ["ar", "العربية"], ["en", "English"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => savePrefs({ consultLang: k })} className={`rounded-xl border px-3 py-2.5 text-sm transition ${prefs.consultLang === k ? "border-[#2f86ff] bg-[#2f86ff]/15 font-semibold" : "border-white/10 hover:border-white/30"}`}>{l}</button>
          ))}
        </div>
        <div className="mt-3 divide-y divide-white/10">
          <Toggle label="Réponses vocales du patient" sub="Lire automatiquement les réponses à voix haute (Étudiant Pro)." on={prefs.voiceReplies} onChange={(v) => savePrefs({ voiceReplies: v })} />
          <Toggle label="Sons et musique" sub="Bruits de Korotkoff, musique du film, effets sonores." on={prefs.sounds} onChange={(v) => savePrefs({ sounds: v })} />
          <Toggle label="Réduire les animations" sub="Moins de mouvements à l'écran." on={prefs.reducedMotion} onChange={(v) => savePrefs({ reducedMotion: v })} />
        </div>
      </Panel>
      <Panel title="Notifications" sub="Dans l'application et par e-mail.">
        <div className="divide-y divide-white/10">
          <Toggle label="Nouveaux devoirs" sub="Quand un enseignant vous assigne un cas." on={prefs.notifyAssignments} onChange={(v) => savePrefs({ notifyAssignments: v })} />
          <Toggle label="Résultats et commentaires" sub="Quand un enseignant commente votre rapport." on={prefs.notifyResults} onChange={(v) => savePrefs({ notifyResults: v })} />
          <Toggle label="Nouveautés Clinika" sub="Nouveaux cas, ateliers et fonctionnalités." on={prefs.notifyNews} onChange={(v) => savePrefs({ notifyNews: v })} />
        </div>
      </Panel>
    </div>
  );
}

// ───────────────────────── Security ─────────────────────────

const LOGIN_LABEL: Record<string, string> = {
  "auth.login": "Connexion par e-mail",
  "auth.login_google": "Connexion avec Google",
  "auth.register": "Création du compte",
  "auth.register_google": "Création du compte (Google)",
  "auth.demo_login": "Connexion de démonstration",
  "auth.password_reset": "Mot de passe réinitialisé",
};

function SecurityTab({ user, logins, permissions }: { user: Props["user"]; logins: Props["logins"]; permissions: Props["permissions"] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Changer de mot de passe" sub="Au moins 10 caractères, dont une lettre et un chiffre.">
        <PasswordForm />
      </Panel>
      <div className="space-y-6">
        <Panel title="Connexion">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3"><span className="text-white/60">Compte Google</span><span className={user.google ? "text-emerald-300" : "text-white/50"}>{user.google ? "Lié" : "Non lié"}</span></li>
            <li className="flex items-center justify-between gap-3"><span className="text-white/60">Membre depuis</span><span>{fmt(user.createdAt)}</span></li>
            <li className="flex items-center justify-between gap-3"><span className="text-white/60">Dernière connexion</span><span>{user.lastLoginAt ? fmt(user.lastLoginAt) : "—"}</span></li>
          </ul>
        </Panel>
        <Panel title="Activité récente">
          {logins.length === 0 ? (
            <p className="text-sm text-white/50">Aucune activité enregistrée.</p>
          ) : (
            <ul className="space-y-2.5">
              {logins.map((l) => (
                <li key={l.at + l.action} className="flex items-center gap-3 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2f86ff]/15 text-[#6fb1ff]"><Lock className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate">{LOGIN_LABEL[l.action] ?? l.action}</span><span className="block text-xs text-white/45">{fmt(l.at)}{l.ip ? ` · ${l.ip}` : ""}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title="Autorisations de votre rôle" className="lg:col-span-2">
        <ul className="grid gap-2 sm:grid-cols-2">
          {permissions.map((x) => (
            <li key={x.key} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" /> {x.label}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function PasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        if (f.get("next") !== f.get("confirm")) return setMsg({ ok: false, text: "Les nouveaux mots de passe ne correspondent pas" });
        setBusy(true);
        try {
          await api("/api/auth/password", "POST", { current: f.get("current"), next: f.get("next") });
          setMsg({ ok: true, text: "Mot de passe mis à jour" });
          form.reset();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      {[["current", "Mot de passe actuel", "current-password"], ["next", "Nouveau mot de passe", "new-password"], ["confirm", "Confirmer le nouveau mot de passe", "new-password"]].map(([id, label, ac]) => (
        <div key={id}>
          <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor={`pw-${id}`}>{label}</label>
          <div className="relative">
            <input id={`pw-${id}`} name={id} type={show ? "text" : "password"} required minLength={id === "current" ? 1 : 10} autoComplete={ac} className={`${inputCls} pr-10`} />
            {id === "current" && (
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" aria-label={show ? "Masquer" : "Afficher"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      ))}
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Enregistrement…" : "Mettre à jour"}</button>
    </form>
  );
}

// ───────────────────────── Data ─────────────────────────

function DataTab({ email, google }: { email: string; google: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Exporter mes données" sub="Profil, consultations, transcriptions, notes et paiements, au format JSON.">
        <a href="/api/me/export" className="btn-primary" download>
          <Download className="h-4 w-4" /> Télécharger mes données
        </a>
        <p className="mt-3 text-xs text-white/45">Le fichier est généré à la demande et ne contient que vos propres données.</p>
      </Panel>
      <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-6">
        <h2 className="flex items-center gap-2 font-semibold text-red-200"><AlertTriangle className="h-5 w-5" /> Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-white/60">Votre nom, votre e-mail et votre lien Google sont effacés et vous ne pourrez plus vous connecter. Vos résultats restent anonymes dans les statistiques de votre faculté. Cette action est irréversible.</p>
        {!open ? (
          <button className="mt-4 rounded-xl border border-red-400/60 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10" onClick={() => setOpen(true)}>Supprimer mon compte…</button>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setErr("");
              try {
                const r = await api<{ redirect: string }>("/api/me", "DELETE", { confirmEmail: confirm, password: pw || undefined });
                window.location.href = r.redirect;
              } catch (x) {
                setErr((x as Error).message);
                setBusy(false);
              }
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs text-white/60" htmlFor="del-email">Tapez votre e-mail pour confirmer : <b className="text-white/80">{email}</b></label>
              <input id="del-email" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
            </div>
            {!google && (
              <div>
                <label className="mb-1.5 block text-xs text-white/60" htmlFor="del-pw">Mot de passe</label>
                <input id="del-pw" type="password" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
              </div>
            )}
            {err && <p className="text-sm text-red-300">{err}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn-ghost border-white/15 bg-transparent text-white" onClick={() => setOpen(false)}>Annuler</button>
              <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40" disabled={busy || confirm.toLowerCase() !== email.toLowerCase()}>{busy ? "Suppression…" : "Supprimer définitivement"}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
