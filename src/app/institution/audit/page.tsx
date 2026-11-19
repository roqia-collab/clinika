import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AuditTable } from "@/components/admin";

export const metadata = { title: "Journal d'audit" };

export default async function InstitutionAudit() {
  const user = await requireUser({ permission: "audit:read" });
  const logs = await prisma.auditLog.findMany({
    where: { user: { universityId: user.universityId ?? "__none__" } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader eyebrow="Conformité" title="Journal d'audit" sub="Les 200 derniers événements de sécurité et de contenu des membres de votre faculté." />
      <AuditTable logs={logs} />
    </>
  );
}
