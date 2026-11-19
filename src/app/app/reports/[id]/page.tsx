import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock, RotateCcw } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canViewSession } from "@/lib/access";
import { caseContent } from "@/lib/cases/repo";
import { ReportView } from "@/components/sim/report-view";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Rapport d'évaluation" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const s = await prisma.consultationSession.findUnique({
    where: { id },
    include: { case: true, user: true, result: true, diagnosis: true, messages: { orderBy: { createdAt: "asc" } }, examinations: { orderBy: { createdAt: "asc" } } },
  });
  if (!s || !s.result || !(await canViewSession(user, s))) notFound();
  const own = s.userId === user.id;
  const pdfAllowed = !own || user.plan.limits.pdfReports;

  return (
    <>
      <Link href={own ? "/app/reports" : `/teach/review/${id}`} className="subtle no-print mb-4 inline-flex items-center gap-1 text-sm hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> {own ? "Mes rapports" : "Retour à la relecture"}
      </Link>
      <ReportView
        s={s}
        content={caseContent(s.case)}
        actions={
          <>
            {pdfAllowed ? (
              <a href={`/api/reports/${id}/pdf`} className="btn-primary">
                <Download className="h-4 w-4" /> Rapport PDF
              </a>
            ) : (
              <Link href="/app/billing" className="btn-ghost" title="Les rapports PDF sont inclus dans Étudiant Pro">
                <Lock className="h-4 w-4" /> PDF (Pro)
              </Link>
            )}
            <PrintButton />
            {own && (
              <Link href={`/app/cases/${s.case.slug}`} className="btn-ghost">
                <RotateCcw className="h-4 w-4" /> Refaire le cas
              </Link>
            )}
          </>
        }
      />
    </>
  );
}
