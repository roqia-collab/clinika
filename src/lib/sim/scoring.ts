import { examByCode, investigationByCode, normalize, topicByKey } from "@/lib/catalog";
import type { CaseContent, ScoreBreakdown, ScoreCategory, ScoreItem } from "./types";

/**
 * Transparent, deterministic rubric scoring. Every point is traceable to an explicit
 * rubric item authored (and expert-reviewed) with the case. The LLM never sets scores.
 */

export interface SessionEvidence {
  topicsCovered: string[];
  exams: string[];
  investigations: string[];
  differentials: string[];
  finalDiagnosis: string;
  justification: string;
  managementActions: string[];
  durationMinutes: number;
  questionsAsked: number;
}

export function termMatches(text: string, terms: string[]): boolean {
  const t = ` ${normalize(text).replace(/[^\p{L}\p{N}' ]+/gu, " ")} `;
  return terms.some((term) => {
    const n = normalize(term).replace(/[^\p{L}\p{N}' ]+/gu, " ").trim();
    if (!n) return false;
    return t.includes(` ${n} `) || (n.length >= 6 && t.includes(n));
  });
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function scoreSession(c: CaseContent, ev: SessionEvidence): ScoreBreakdown {
  const { rubric } = c;
  const W = rubric.weights;
  const categories: ScoreCategory[] = [];

  // History taking
  {
    const total = rubric.keyTopics.reduce((s, k) => s + k.weight, 0) || 1;
    const items: ScoreItem[] = rubric.keyTopics.map((k) => {
      const achieved = ev.topicsCovered.includes(k.topic);
      const max = round1((k.weight / total) * W.history);
      return { label: `A exploré : ${topicByKey(k.topic)?.label.toLowerCase() ?? k.topic}`, achieved, points: achieved ? max : 0, max };
    });
    categories.push(cat("history", "Interrogatoire", items, W.history));
  }

  // Physical examination
  {
    const n = rubric.essentialExams.length || 1;
    const items: ScoreItem[] = rubric.essentialExams.map((code) => {
      const achieved = ev.exams.includes(code);
      const max = round1(W.exam / n);
      return { label: examByCode(code)?.name ?? code, achieved, points: achieved ? max : 0, max };
    });
    if (rubric.essentialExams.length === 0) items.push({ label: "Examen clinique réalisé", achieved: ev.exams.length > 0, points: ev.exams.length > 0 ? W.exam : 0, max: W.exam });
    categories.push(cat("exam", "Examen clinique", items, W.exam));
  }

  // Investigations
  {
    const items: ScoreItem[] = [];
    const ess = rubric.essentialInvestigations;
    if (ess.length) {
      for (const code of ess) {
        const achieved = ev.investigations.includes(code);
        const max = round1(W.investigations / ess.length);
        items.push({ label: `A demandé : ${investigationByCode(code)?.name ?? code}`, achieved, points: achieved ? max : 0, max });
      }
    } else {
      items.push({ label: "Pas d'examen inutile pour un diagnostic clinique", achieved: true, points: W.investigations, max: W.investigations, note: "Aucun examen complémentaire n'est indispensable dans ce cas." });
    }
    for (const code of rubric.unnecessaryInvestigations.filter((x) => ev.investigations.includes(x))) {
      items.push({ label: `Examen non pertinent : ${investigationByCode(code)?.name ?? code}`, achieved: false, points: -round1(W.investigations * 0.15), max: 0, note: "Non indiqué ici — coût, délai ou risque inutiles." });
    }
    categories.push(cat("investigations", "Examens complémentaires", items, W.investigations));
  }

  // Diagnosis & reasoning
  {
    const finalOk = termMatches(ev.finalDiagnosis, c.answer.acceptedTerms);
    const ddxText = ev.differentials.join(" | ");
    const items: ScoreItem[] = [
      { label: "Diagnostic final correct", achieved: finalOk, points: finalOk ? round1(W.diagnosis * 0.6) : 0, max: round1(W.diagnosis * 0.6) },
    ];
    const dn = c.answer.differentials.length || 1;
    for (const d of c.answer.differentials) {
      const ok = termMatches(ddxText, d.terms);
      const max = round1((W.diagnosis * 0.3) / dn);
      items.push({ label: `A évoqué : ${d.name}`, achieved: ok, points: ok ? max : 0, max });
    }
    const justified = ev.justification.trim().length >= 40;
    items.push({ label: "Argumentation documentée", achieved: justified, points: justified ? round1(W.diagnosis * 0.1) : 0, max: round1(W.diagnosis * 0.1) });
    categories.push(cat("diagnosis", "Raisonnement et diagnostic", items, W.diagnosis));
  }

  // Management
  {
    const opts = rubric.management.options;
    const essential = opts.filter((o) => o.kind === "essential");
    const appropriate = opts.filter((o) => o.kind === "appropriate");
    const items: ScoreItem[] = [];
    for (const o of essential) {
      const ok = ev.managementActions.includes(o.code);
      const max = round1((W.management * 0.8) / (essential.length || 1));
      items.push({ label: o.label, achieved: ok, points: ok ? max : 0, max, note: o.rationale });
    }
    for (const o of appropriate) {
      const ok = ev.managementActions.includes(o.code);
      const max = round1((W.management * 0.2) / (appropriate.length || 1));
      items.push({ label: o.label, achieved: ok, points: ok ? max : 0, max, note: o.rationale });
    }
    for (const o of opts.filter((x) => x.kind === "contraindicated" && ev.managementActions.includes(x.code))) {
      items.push({ label: `Dangereux : ${o.label}`, achieved: false, points: -round1(W.management * 0.25), max: 0, note: o.rationale });
    }
    categories.push(cat("management", "Prise en charge", items, W.management));
  }

  const total = Math.round(categories.reduce((s, c2) => s + c2.score, 0));
  return { total: clamp(total, 0, 100), categories, durationMinutes: ev.durationMinutes, questionsAsked: ev.questionsAsked };
}

function cat(key: ScoreCategory["key"], label: string, items: ScoreItem[], max: number): ScoreCategory {
  const raw = items.reduce((s, i) => s + i.points, 0);
  return { key, label, items, max, score: round1(clamp(raw, 0, max)) };
}
