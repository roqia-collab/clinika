export const NETWORK_ERROR = "Connexion au serveur impossible. Vérifiez votre connexion internet puis réessayez.";

/**
 * Client-side JSON fetch helper with uniform error extraction. Network failures (offline,
 * server restarting — « NetworkError when attempting to fetch resource » / « Failed to fetch »)
 * are retried once for idempotent methods, then reported with a readable French message.
 */
export async function api<T = unknown>(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE" | "GET", body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  let r: Response;
  try {
    r = await fetch(url, init);
  } catch {
    if (method === "POST") throw new Error(NETWORK_ERROR); // never replay a write that may have landed
    await new Promise((res) => setTimeout(res, 700));
    try {
      r = await fetch(url, init);
    } catch {
      throw new Error(NETWORK_ERROR);
    }
  }
  let j: Record<string, unknown> = {};
  try {
    j = await r.json();
  } catch {}
  if (!r.ok) {
    const issues = Array.isArray(j.issues) ? (j.issues as { path: string; message: string }[]).map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join(" · ") : "";
    throw new Error(issues || (j.error as string) || `La requête a échoué (${r.status})`);
  }
  return j as T;
}
