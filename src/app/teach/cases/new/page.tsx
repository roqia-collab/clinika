import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { caseContent } from "@/lib/cases/repo";
import { blankCase } from "@/lib/cases/template";
import { PageHeader } from "@/components/ui";
import { CaseEditor, type EditorValue } from "@/components/cases/case-editor";
import type { Difficulty } from "@/lib/sim/types";

export const metadata = { title: "Nouveau cas" };

export default async function NewCasePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireUser({ permission: "case:write" });
  const { from } = await searchParams;
  let initial: EditorValue = blankCase();
  if (from) {
    const src = await prisma.clinicalCase.findUnique({ where: { id: from } });
    if (src) {
      initial = {
        meta: { slug: `${src.slug}-copy`, title: `${src.title} (copie)`, specialty: src.specialty, difficulty: src.difficulty as Difficulty, summary: src.summary, objectives: parseJson<string[]>(src.learningObjectives, []), minutes: src.estimatedMinutes, freeTier: false },
        content: caseContent(src),
      };
    }
  }
  return (
    <>
      <PageHeader eyebrow="Rédaction de cas" title={from ? "Dupliquer un cas" : "Nouveau cas clinique"} sub="Utilisez uniquement des données fictives. Le cas est la seule source de vérité pour le patient virtuel, les résultats et la notation." />
      <CaseEditor initial={initial} />
    </>
  );
}
