import Link from "next/link";
import { ArrowUpRight, Globe } from "@/components/icons";
import type { CurrentUser } from "@/lib/auth/session";
import { ROLE_META, type RoleKey } from "@/lib/rbac";
import { Badge, Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks, MobileNav, type NavItem } from "./nav";
import { NotificationsBell } from "./notifications";

const STUDENT: NavItem[] = [
  { href: "/app", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/app/cases", label: "Bibliothèque de cas", icon: "Library" },
  { href: "/app/workshops", label: "Ateliers pratiques", icon: "Scissors" },
  { href: "/app/reports", label: "Mes rapports", icon: "FileText" },
  { href: "/app/billing", label: "Formule et paiement", icon: "CreditCard" },
  { href: "/app/settings", label: "Paramètres", icon: "Settings" },
];
const TEACHER: NavItem[] = [
  { href: "/teach", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/teach/cases", label: "Cas cliniques", icon: "FolderHeart" },
  { href: "/teach/assignments", label: "Devoirs", icon: "ClipboardList" },
  { href: "/teach/students", label: "Étudiants", icon: "Users" },
  { href: "/teach/groups", label: "Groupes", icon: "UsersRound" },
  { href: "/app/cases", label: "S'entraîner", icon: "Library", section: "Pratique" },
  { href: "/app/workshops", label: "Ateliers pratiques", icon: "Scissors" },
  { href: "/app/settings", label: "Paramètres", icon: "Settings", section: "Compte" },
];
const UNI: NavItem[] = [
  { href: "/institution", label: "Vue d'ensemble", icon: "Building2" },
  { href: "/institution/people", label: "Enseignants et étudiants", icon: "Users" },
  { href: "/institution/programs", label: "Programmes", icon: "GraduationCap" },
  { href: "/teach/groups", label: "Groupes", icon: "UsersRound" },
  { href: "/teach/cases", label: "Cas cliniques", icon: "FolderHeart" },
  { href: "/teach/students", label: "Résultats des étudiants", icon: "LineChart" },
  { href: "/institution/audit", label: "Journal d'audit", icon: "ScrollText" },
  { href: "/app/settings", label: "Paramètres", icon: "Settings", section: "Compte" },
];
const ADMIN: NavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: "Activity" },
  { href: "/admin/users", label: "Utilisateurs", icon: "Users" },
  { href: "/admin/subscriptions", label: "Abonnements", icon: "CreditCard" },
  { href: "/teach/cases", label: "Contenus cliniques", icon: "FolderHeart" },
  { href: "/admin/settings", label: "Réglages IA et plateforme", icon: "Cpu" },
  { href: "/admin/messages", label: "Demandes de contact", icon: "Inbox" },
  { href: "/admin/audit", label: "Journal d'audit", icon: "ScrollText" },
  { href: "/app/settings", label: "Paramètres", icon: "Settings", section: "Compte" },
];

export function navFor(role: string): NavItem[] {
  return role === "TEACHER" ? TEACHER : role === "UNIVERSITY_ADMIN" ? UNI : role === "PLATFORM_ADMIN" ? ADMIN : STUDENT;
}

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const nav = navFor(user.roleKey);
  const meta = ROLE_META[user.roleKey as RoleKey];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="noise sticky top-0 hidden h-screen flex-col overflow-hidden bg-navy-950 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
        <div className="relative px-5 py-6">
          <Link href={meta.home}>
            <Logo light />
          </Link>
        </div>
        <NavLinks items={nav} dark />
        <div className="relative px-3 pb-2">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white">
            <Globe className="h-4 w-4" /> Site public <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="relative mt-auto border-t border-white/10 p-4">
          {user.roleKey === "STUDENT" && (
            <Link href="/app/billing" className="mb-3 block rounded-xl bg-gradient-to-br from-brand-600 to-teal-500 p-3 text-white">
              <p className="text-xs uppercase tracking-wide text-white/70">Formule actuelle</p>
              <p className="font-semibold">{user.plan.name}</p>
              {user.plan.key === "FREE" && <p className="mt-0.5 text-xs text-white/85">Passez à Pro pour toute la bibliothèque →</p>}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-500 text-sm font-bold text-white ring-2 ring-white/10">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/50">{meta.label}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white" title="Se déconnecter">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[rgb(var(--line))] bg-[rgb(var(--bg))]/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav items={nav} userName={user.name} />
            <Link href={meta.home} className="lg:hidden">
              <Logo className="text-base" />
            </Link>
            {user.university && <Badge tone="navy" className="hidden md:inline-flex">{user.university.name}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-1.5 rounded-xl border border-[rgb(var(--line))] px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--panel-2))] sm:inline-flex" title="Aller sur le site public">
              <Globe className="h-4 w-4" /> Site public
            </Link>
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>
        <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
