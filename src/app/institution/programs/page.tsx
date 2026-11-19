import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { Card, CardTitle, Empty, PageHeader, fmtDate } from "@/components/ui";
import { ProgramForm } from "./program-form";

export const metadata = { title: "Programmes de formation" };

export default async function ProgramsPage() {
  const user = await requireUser({ permission: "institution:manage" });
  const [programs, cases] = await Promise.all([
    prisma.trainingProgram.findMany({ where: { universityId: user.universityId ?? "__none__" }, orderBy: { createdAt: "desc" } }),
    prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true, specialty: true }, orderBy: { title: "asc" } }),
  ]);
  const titleOf = new Map(cases.map((c) => [c.slug, c.title]));
  return (
    <>
      <PageHeader eyebrow="Cursus" title="Programmes de formation" sub="Regroupez des cas publiés en programmes structurés (ex. « Stage d'urgences ») pour vos promotions." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardTitle>Nouveau programme</CardTitle>
          <ProgramForm cases={cases} />
        </Card>
        <div className="space-y-4">
          {programs.length === 0 && <Empty title="Aucun programme" />}
          {programs.map((p) => (
            <Card key={p.id}>
              <CardTitle sub={`Créé le ${fmtDate(p.createdAt)}`}>{p.name}</CardTitle>
              {p.description && <p className="muted -mt-2 mb-3 text-sm">{p.description}</p>}
              <ol className="space-y-1 text-sm">
                {parseJson<string[]>(p.caseSlugs, []).map((s, i) => (
                  <li key={s}>
                    <span className="subtle font-mono text-xs">{i + 1}.</span> {titleOf.get(s) ?? s}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
