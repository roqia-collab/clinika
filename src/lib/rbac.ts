/** Role-based access control. The DB `Role.permissions` column is seeded from this matrix. */

export const ROLES = ["STUDENT", "TEACHER", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"] as const;
export type RoleKey = (typeof ROLES)[number];

export const PERMISSIONS = {
  "simulation:run": "Réaliser des simulations cliniques",
  "report:view_own": "Consulter ses rapports d'évaluation",
  "case:read": "Parcourir la bibliothèque de cas",
  "case:write": "Créer et modifier des cas cliniques",
  "case:review": "Valider (expertise clinique) et publier des cas",
  "assignment:manage": "Créer et gérer des devoirs",
  "student:review": "Relire les consultations des étudiants et commenter",
  "group:manage": "Gérer les groupes d'étudiants",
  "institution:manage": "Gérer enseignants, étudiants et programmes de la faculté",
  "institution:analytics": "Statistiques de la faculté",
  "platform:users": "Gérer tous les utilisateurs",
  "platform:subscriptions": "Gérer les abonnements",
  "platform:settings": "Gérer les réglages IA et plateforme",
  "platform:analytics": "Statistiques de la plateforme",
  "audit:read": "Consulter le journal d'audit",
} as const;
export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  STUDENT: ["simulation:run", "report:view_own", "case:read"],
  TEACHER: ["simulation:run", "report:view_own", "case:read", "case:write", "case:review", "assignment:manage", "student:review", "group:manage"],
  UNIVERSITY_ADMIN: ["case:read", "case:write", "case:review", "assignment:manage", "student:review", "group:manage", "institution:manage", "institution:analytics", "audit:read"],
  PLATFORM_ADMIN: Object.keys(PERMISSIONS) as Permission[],
};

export const ROLE_META: Record<RoleKey, { label: string; home: string; description: string }> = {
  STUDENT: { label: "Étudiant", home: "/app", description: "Réaliser des simulations, consulter ses évaluations et suivre sa progression." },
  TEACHER: { label: "Enseignant", home: "/teach", description: "Rédiger des cas, assigner des simulations et suivre les étudiants." },
  UNIVERSITY_ADMIN: { label: "Administrateur de faculté", home: "/institution", description: "Gérer enseignants, étudiants, groupes et programmes." },
  PLATFORM_ADMIN: { label: "Administrateur plateforme", home: "/admin", description: "Gérer utilisateurs, abonnements, contenus et réglages IA." },
};

export function can(role: string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role as RoleKey] ?? []).includes(permission);
}

export function isRole(value: string): value is RoleKey {
  return (ROLES as readonly string[]).includes(value);
}
