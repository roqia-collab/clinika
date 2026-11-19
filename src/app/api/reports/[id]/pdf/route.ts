import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { handle } from "@/lib/api";
import { prisma, parseJson } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { canViewSession } from "@/lib/access";
import { specialtyName } from "@/lib/catalog";
import type { EducationalFeedback, ScoreBreakdown } from "@/lib/sim/types";

// Standard PDF fonts are WinAnsi-only: strip characters they cannot encode.
const safe = (s: string) =>
  s
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/…/g, "...")
    .replace(/[µ]/g, "u")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/₂/g, "2")
    .replace(/³/g, "3")
    .replace(/⁻/g, "-")
    .replace(/⁹/g, "9")
    .replace(/⁵/g, "5")
    .replace(/[^\x20-\x7E -ÿ]/g, "");

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await ctx.params;
  const s = await prisma.consultationSession.findUnique({ where: { id }, include: { case: true, result: true, diagnosis: true, user: true } });
  if (!s || !s.result || !(await canViewSession(user, s))) throw new HttpError(404, "Rapport introuvable");
  if (s.userId === user.id && !user.plan.limits.pdfReports) throw new HttpError(402, "Les rapports PDF sont inclus dans les formules Étudiant Pro et Faculté.");

  const score = parseJson<ScoreBreakdown>(s.result.breakdown, { total: 0, categories: [], durationMinutes: 0, questionsAsked: 0 });
  const fb = parseJson<EducationalFeedback>(s.result.feedback, {} as EducationalFeedback);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Évaluation Clinika - ${s.case.title}`);
  pdf.setProducer("Clinika");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(11 / 255, 19 / 255, 43 / 255);
  const blue = rgb(37 / 255, 99 / 255, 235 / 255);
  const grey = rgb(0.4, 0.45, 0.5);

  let page: PDFPage = pdf.addPage([595, 842]);
  let y = 800;
  const M = 48;
  const W = 595 - M * 2;

  const ensure = (h: number) => {
    if (y - h < 60) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
  };
  const wrap = (text: string, f: PDFFont, size: number, width: number) => {
    const words = safe(text).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  };
  const para = (text: string, opts: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    for (const l of wrap(text, f, size, W - (opts.indent ?? 0))) {
      ensure(size + 4);
      page.drawText(l, { x: M + (opts.indent ?? 0), y, size, font: f, color: opts.color ?? navy });
      y -= size + 4;
    }
    y -= opts.gap ?? 4;
  };
  const heading = (t: string) => {
    ensure(30);
    y -= 6;
    page.drawText(safe(t), { x: M, y, size: 13, font: bold, color: blue });
    y -= 18;
  };

  // Header band
  page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: navy });
  page.drawText("Clinika", { x: M, y: 808, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Rapport d'évaluation de simulation clinique", { x: M, y: 788, size: 10, font, color: rgb(0.8, 0.85, 0.95) });
  page.drawText(`${score.total}/100`, { x: 595 - M - bold.widthOfTextAtSize(`${score.total}/100`, 24), y: 796, size: 24, font: bold, color: rgb(0, 184 / 255, 169 / 255) });
  y = 745;

  para(s.case.title, { size: 15, f: bold });
  para(`${specialtyName(s.case.specialty)} · Étudiant : ${s.user.name} · Terminé le ${s.completedAt?.toLocaleString("fr-DZ") ?? "-"} · Durée ${score.durationMinutes} min · ${score.questionsAsked} questions · Grille v${s.result.rubricVersion} · Feedback : ${s.result.feedbackSource}`, { size: 9, color: grey, gap: 10 });

  heading("Synthèse");
  para(fb.summary ?? "");
  heading("Détail de la note");
  for (const c of score.categories) {
    ensure(18);
    page.drawText(safe(c.label), { x: M, y, size: 10.5, font: bold, color: navy });
    page.drawText(`${c.score} / ${c.max}`, { x: M + W - 50, y, size: 10.5, font: bold, color: navy });
    y -= 6;
    page.drawRectangle({ x: M, y: y - 4, width: W, height: 4, color: rgb(0.9, 0.92, 0.95) });
    page.drawRectangle({ x: M, y: y - 4, width: c.max ? (W * Math.max(0, c.score)) / c.max : 0, height: 4, color: blue });
    y -= 16;
    for (const it of c.items) para(`${it.points < 0 ? "[!]" : it.achieved ? "[x]" : "[ ]"} ${it.label} (${it.points >= 0 ? "+" : ""}${it.points}/${it.max})`, { size: 9, indent: 10, gap: 0, color: it.points < 0 ? rgb(0.85, 0.2, 0.2) : navy });
    y -= 6;
  }
  heading("Diagnostic");
  para(`Votre diagnostic final : ${s.diagnosis?.finalDiagnosis ?? "-"}`);
  para(`Diagnostic du cas : ${fb.correctDiagnosis ?? "-"}`, { f: bold });
  para(fb.reasoningComment ?? "");
  heading("Points forts");
  for (const x of fb.strengths ?? []) para(`• ${x}`, { indent: 6, gap: 1 });
  heading("Axes d'amélioration");
  for (const x of fb.improvements ?? []) para(`• ${x}`, { indent: 6, gap: 1 });
  if (fb.missedFindings?.length) {
    heading("Éléments clés non recherchés");
    for (const x of fb.missedFindings) para(`• ${x}`, { indent: 6, gap: 1 });
  }
  heading("Points pédagogiques");
  for (const x of fb.teachingPoints ?? []) para(`• ${x}`, { indent: 6, gap: 1 });
  if (s.result.teacherComment) {
    heading("Retour de l'enseignant");
    para(s.result.teacherComment);
  }
  y -= 10;
  para(fb.disclaimer ?? "", { size: 8, color: grey });
  para("Toutes les données patients des simulations Clinika sont fictives. Ce rapport a une visée exclusivement pédagogique et ne constitue pas un dossier médical.", { size: 8, color: grey });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="medsim-rapport-${s.case.slug}-${id.slice(-6)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});
