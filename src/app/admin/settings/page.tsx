import { requireUser } from "@/lib/auth/session";
import { aiMode } from "@/lib/sim/engines";
import { groqModel } from "@/lib/sim/engines/groq";
import { anthropicModel } from "@/lib/sim/engines/anthropic";
import { getSetting } from "@/lib/settings";
import { Badge, Card, CardTitle, PageHeader } from "@/components/ui";
import { SettingSelect } from "./setting-select";

export const metadata = { title: "Réglages IA et plateforme" };

export default async function AdminSettings() {
  await requireUser({ permission: "platform:settings" });
  const mode = aiMode();
  const [patientEffort, feedbackEffort, voice] = await Promise.all([getSetting("ai.patientEffort"), getSetting("ai.feedbackEffort"), getSetting("voice.enabled")]);
  return (
    <>
      <PageHeader eyebrow="Configuration" title="Réglages IA et plateforme" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Configuré par les variables d'environnement du serveur">Moteur IA</CardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="muted">Mode</dt><dd>{mode === "anthropic" ? <Badge tone="green">En direct (Anthropic)</Badge> : mode === "groq" ? <Badge tone="green">En direct (Groq)</Badge> : <Badge tone="amber">Démo — moteur hors ligne</Badge>}</dd></div>
            <div className="flex justify-between"><dt className="muted">Modèle</dt><dd className="font-mono text-xs">{mode === "anthropic" ? anthropicModel() : mode === "groq" ? groqModel() : "—"}</dd></div>
            <div className="flex justify-between"><dt className="muted">Repli de sécurité</dt><dd className="text-xs">Modèle de repli côté serveur + moteur hors ligne en cas d&apos;échec</dd></div>
          </dl>
          {mode === "demo" && <p className="subtle mt-4 text-xs">Pour activer le patient IA, définissez <code className="font-mono">ANTHROPIC_API_KEY</code> (et éventuellement <code className="font-mono">AI_PROVIDER=anthropic</code>) dans l&apos;environnement du serveur, puis redémarrez. Les clés ne sont jamais exposées au navigateur.</p>}
        </Card>
        <Card>
          <CardTitle sub="Appliqué immédiatement aux nouvelles requêtes">Comportement</CardTitle>
          <div className="space-y-4">
            <SettingSelect k="ai.patientEffort" label="Effort des réponses du patient" value={patientEffort} options={["low", "medium", "high"]} hint="Plus élevé = jeu de rôle plus nuancé, réponses plus lentes." />
            <SettingSelect k="ai.feedbackEffort" label="Effort du feedback narratif" value={feedbackEffort} options={["low", "medium", "high"]} hint="Effort utilisé pour rédiger le commentaire après la consultation." />
            <SettingSelect k="voice.enabled" label="Consultations vocales" value={voice} options={["true", "false"]} hint="Reconnaissance et synthèse vocales du navigateur pour Pro et Faculté." />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Garde-fous (toujours actifs)</CardTitle>
          <ul className="muted grid gap-2 text-sm md:grid-cols-2">
            <li>• Le moteur patient ne reçoit jamais le diagnostic, la grille ni les résultats.</li>
            <li>• La note est calculée de façon déterministe ; l&apos;IA ne fait qu&apos;expliquer.</li>
            <li>• Le contenu est figé par consultation ; toute modification exige une nouvelle validation.</li>
            <li>• Avertissement pédagogique sur chaque rapport et chaque consultation.</li>
            <li>• Contrôle d&apos;accès par rôle sur chaque API, avec journal d&apos;audit.</li>
            <li>• Limitation du nombre de requêtes (connexion, conversation, démo publique).</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
