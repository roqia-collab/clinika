import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AuditTable } from "@/components/admin";

export const metadata = { title: "Journal d'audit" };

export default async function AdminAudit() {
  await requireUser({ permission: "audit:read" });
  const logs = await prisma.auditLog.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <>
      <PageHeader eyebrow="Sécurité" title="Journal d'audit" sub="Les 300 derniers événements de connexion, de contenu, de facturation et d'administration." />
      <AuditTable logs={logs} />
    </>
  );
}
