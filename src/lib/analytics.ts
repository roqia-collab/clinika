import { parseJson } from "@/lib/db";
import type { ScoreBreakdown } from "@/lib/sim/types";

export const CATEGORY_LABELS: Record<string, string> = {
  history: "Interrogatoire",
  exam: "Examen clinique",
  investigations: "Examens compl.",
  diagnosis: "Diagnostic",
  management: "Prise en charge",
};

export interface ResultRow {
  totalScore: number;
  teacherScoreOverride?: number | null;
  breakdown: string;
  createdAt: Date;
  session: { case: { specialty: string; title: string; difficulty: string } };
}

export const effectiveScore = (r: { totalScore: number; teacherScoreOverride?: number | null }) => r.teacherScoreOverride ?? r.totalScore;

/** Average % achieved per rubric category across results. */
export function categoryAverages(rows: ResultRow[]) {
  const acc: Record<string, { s: number; n: number }> = {};
  for (const r of rows) {
    const b = parseJson<ScoreBreakdown>(r.breakdown, { categories: [] } as unknown as ScoreBreakdown);
    for (const c of b.categories) {
      if (!c.max) continue;
      acc[c.key] ??= { s: 0, n: 0 };
      acc[c.key].s += (c.score / c.max) * 100;
      acc[c.key].n++;
    }
  }
  return Object.keys(CATEGORY_LABELS).map((k) => ({ key: k, label: CATEGORY_LABELS[k], value: acc[k] ? Math.round(acc[k].s / acc[k].n) : 0 }));
}

export function specialtyAverages(rows: ResultRow[]) {
  const acc: Record<string, { s: number; n: number }> = {};
  for (const r of rows) {
    const k = r.session.case.specialty;
    acc[k] ??= { s: 0, n: 0 };
    acc[k].s += effectiveScore(r);
    acc[k].n++;
  }
  return Object.entries(acc).map(([k, v]) => ({ key: k, value: Math.round(v.s / v.n), count: v.n }));
}

export function average(nums: number[]) {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
}

export function weeklyTrend(rows: { createdAt: Date; score: number }[], weeks = 10) {
  const now = Date.now();
  const out: { week: string; avg: number | null; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 864e5;
    const end = now - w * 7 * 864e5;
    const inWeek = rows.filter((r) => r.createdAt.getTime() >= start && r.createdAt.getTime() < end);
    out.push({ week: new Date(end).toLocaleDateString("fr-DZ", { day: "numeric", month: "short" }), avg: inWeek.length ? average(inWeek.map((r) => r.score)) : null, count: inWeek.length });
  }
  return out;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  earned: boolean;
}

export function achievements(rows: ResultRow[]): Achievement[] {
  const scores = rows.map(effectiveScore);
  const specialties = new Set(rows.map((r) => r.session.case.specialty));
  const hard = rows.filter((r) => r.session.case.difficulty === "HARD" && effectiveScore(r) >= 70);
  const cats = rows.map((r) => parseJson<ScoreBreakdown>(r.breakdown, { categories: [] } as unknown as ScoreBreakdown));
  const perfectHistory = cats.some((b) => b.categories.find((c) => c.key === "history" && c.score >= c.max - 0.01));
  const safe = cats.filter((b) => !b.categories.some((c) => c.items.some((i) => i.points < 0))).length;
  return [
    { key: "first", title: "Premier patient", description: "Terminer sa première simulation", earned: rows.length >= 1 },
    { key: "ten", title: "Habitué du service", description: "Terminer 10 simulations", earned: rows.length >= 10 },
    { key: "explorer", title: "Explorateur", description: "S'entraîner dans 4 spécialités", earned: specialties.size >= 4 },
    { key: "high", title: "Clinicien affûté", description: "Obtenir 85 ou plus", earned: scores.some((s) => s >= 85) },
    { key: "advanced", title: "Cas avancé résolu", description: "70+ sur un cas Avancé", earned: hard.length > 0 },
    { key: "history", title: "Interrogatoire complet", description: "Couvrir tous les points clés d'un cas", earned: perfectHistory },
    { key: "safe", title: "Primum non nocere", description: "5 consultations sans geste dangereux ni examen inutile", earned: safe >= 5 },
  ];
}
