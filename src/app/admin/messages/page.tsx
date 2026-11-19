import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, Empty, PageHeader, fmtDate } from "@/components/ui";

export const metadata = { title: "Demandes de contact" };

export default async function Messages() {
  await requireUser({ permission: "platform:users" });
  const items = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader eyebrow="Messagerie" title="Demandes de contact et de démo" />
      {items.length === 0 ? (
        <Empty title="Aucun message" body="Les messages envoyés depuis la page Contact apparaissent ici." />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={m.kind === "DEMO" ? "teal" : "blue"}>{m.kind === "DEMO" ? "Demande de démo" : "Question"}</Badge>
                <span className="font-semibold">{m.name}</span>
                <span className="subtle text-sm">{m.email}</span>
                {m.organization && <span className="subtle text-sm">· {m.organization}{m.role ? ` (${m.role})` : ""}</span>}
                <span className="subtle ml-auto text-xs">{fmtDate(m.createdAt)}</span>
              </div>
              <p className="muted mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
