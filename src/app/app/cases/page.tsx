import Link from "next/link";
import { Clock, Lock, Search, UserRound } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { listPublishedCases, type LibraryFilters } from "@/lib/cases/repo";
import { parseJson, prisma } from "@/lib/db";
import { DIFFICULTIES, SPECIALTIES, specialtyName } from "@/lib/catalog";
import { Badge, DifficultyBadge, Empty, PageHeader } from "@/components/ui";
import { Photo } from "@/components/motion";
import { SPECIALTY_PHOTO } from "@/lib/photos";

export const metadata = { title: "Bibliothèque de cas" };

export default async function CaseLibrary({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const filters: LibraryFilters = {
    q: sp.q?.trim() || undefined,
    specialty: sp.specialty || undefined,
    difficulty: sp.difficulty || undefined,
    age: (["child", "adult", "older"] as const).find((a) => a === sp.age),
    maxMinutes: sp.maxMinutes ? Number(sp.maxMinutes) : undefined,
    symptom: sp.symptom || undefined,
  };
  const [cases, symptoms, mine] = await Promise.all([
    listPublishedCases(filters),
    prisma.caseSymptom.findMany({ distinct: ["name"], where: { case: { status: "PUBLISHED" } }, orderBy: { name: "asc" }, select: { name: true } }),
    prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, select: { totalScore: true, session: { select: { caseId: true } } } }),
  ]);
  const best = new Map<string, number>();
  mine.forEach((r) => best.set(r.session.caseId, Math.max(best.get(r.session.caseId) ?? 0, r.totalScore)));
  const active = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader eyebrow="Bibliothèque de cas cliniques" title="Choisissez votre prochain patient" sub="Tous les cas sont fictifs et ont passé le circuit de validation. Filtrez par spécialité, niveau, âge, symptôme ou durée." />
      <form className="panel mb-6 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-[2fr_repeat(5,1fr)_auto]" role="search">
        <div className="relative">
          <Search className="subtle pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <label htmlFor="q" className="sr-only">Rechercher</label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Titre, objectifs, symptômes…" className="field pl-9" />
        </div>
        <Select name="specialty" value={filters.specialty} label="Spécialité" options={SPECIALTIES.map((s) => [s.key, s.name])} />
        <Select name="difficulty" value={filters.difficulty} label="Niveau" options={DIFFICULTIES.map((d) => [d.key, d.label])} />
        <Select name="age" value={filters.age} label="Âge" options={[["child", "Enfant (< 18 ans)"], ["adult", "Adulte (18–64 ans)"], ["older", "Âgé (65 ans et +)"]]} />
        <Select name="symptom" value={filters.symptom} label="Symptôme" options={symptoms.map((s) => [s.name, s.name])} />
        <Select name="maxMinutes" value={sp.maxMinutes} label="Durée" options={[["10", "≤ 10 min"], ["15", "≤ 15 min"], ["20", "≤ 20 min"], ["30", "≤ 30 min"]]} />
        <div className="flex gap-2">
          <button className="btn-primary flex-1">Filtrer</button>
          {active && (
            <Link href="/app/cases" className="btn-ghost">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      <p className="subtle mb-3 text-sm">{cases.length} cas</p>
      {cases.length === 0 ? (
        <Empty title="Aucun cas ne correspond à ces filtres" action={<Link href="/app/cases" className="btn-ghost">Effacer les filtres</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((c) => {
            const locked = !c.freeTier && !user.plan.limits.fullLibrary && user.roleKey === "STUDENT";
            const objectives = parseJson<string[]>(c.learningObjectives, []);
            const b = best.get(c.id);
            return (
              <Link key={c.id} href={`/app/cases/${c.slug}`} className="panel card-hover group flex flex-col overflow-hidden rounded-3xl p-0">
                <div className="relative h-40">
                  <Photo photo={SPECIALTY_PHOTO[c.specialty] ?? "consultation"} className="absolute inset-0" sizes="(max-width:768px) 100vw, 33vw" w={800} />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
                  <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                    <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">{specialtyName(c.specialty)}</span>
                    <div className="flex items-center gap-1.5">
                      {b !== undefined && <Badge tone="green">Meilleure : {b}</Badge>}
                      {locked ? <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"><Lock className="h-3 w-3" /> Pro</span> : c.freeTier && <Badge tone="teal">Gratuit</Badge>}
                    </div>
                  </div>
                  <h2 className="absolute inset-x-4 bottom-3 text-lg font-bold leading-tight text-white">{c.title}</h2>
                </div>
                <div className="flex flex-1 flex-col p-5">
                <p className="muted line-clamp-2 text-sm">{c.summary}</p>
                <ul className="subtle mt-3 space-y-1 text-xs">
                  {objectives.slice(0, 2).map((o) => (
                    <li key={o}>• {o}</li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs">
                  <DifficultyBadge d={c.difficulty} />
                  <span className="subtle flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> {c.patientAge} ans · {c.patientSex === "F" ? "F" : "H"}</span>
                  <span className="subtle flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.estimatedMinutes} min</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.symptoms.slice(0, 4).map((s) => (
                    <span key={s.id} className="chip bg-[rgb(var(--panel-2))] text-[11px]">{s.name}</span>
                  ))}
                </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Select({ name, value, label, options }: { name: string; value?: string; label: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="sr-only">{label}</label>
      <select id={name} name={name} defaultValue={value ?? ""} className="field">
        <option value="">{label} : tous</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
