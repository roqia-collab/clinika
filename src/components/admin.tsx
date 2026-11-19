import type { AuditLog, User } from "@prisma/client";

export function AuditTable({ logs }: { logs: (AuditLog & { user: Pick<User, "name" | "email"> | null })[] }) {
  return (
    <div className="panel overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Utilisateur</th>
            <th className="px-4 py-3">Objet</th>
            <th className="px-4 py-3">Détails</th>
            <th className="px-4 py-3">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgb(var(--line))]">
          {logs.map((l) => (
            <tr key={l.id}>
              <td className="muted whitespace-nowrap px-4 py-2 text-xs">{l.createdAt.toLocaleString("fr-DZ")}</td>
              <td className="px-4 py-2 font-mono text-xs text-brand-600">{l.action}</td>
              <td className="px-4 py-2 text-xs">{l.user?.name ?? <span className="subtle">anonyme</span>}</td>
              <td className="muted px-4 py-2 text-xs">{l.entity ? `${l.entity} ${l.entityId?.slice(-6) ?? ""}` : "—"}</td>
              <td className="muted max-w-xs truncate px-4 py-2 font-mono text-[11px]" title={l.meta ?? ""}>{l.meta ?? ""}</td>
              <td className="muted px-4 py-2 text-xs">{l.ip ?? ""}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="subtle px-4 py-6 text-center">Aucun événement.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
