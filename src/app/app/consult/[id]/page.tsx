import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { caseContent } from "@/lib/cases/repo";
import { getSetting } from "@/lib/settings";
import { ConsultationRoom, type RoomProps } from "@/components/sim/room";

export const metadata = { title: "Salle de consultation" };

export default async function ConsultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const s = await prisma.consultationSession.findUnique({
    where: { id },
    include: { case: true, messages: { orderBy: { createdAt: "asc" } }, examinations: { orderBy: { createdAt: "asc" } } },
  });
  if (!s || s.userId !== user.id) notFound();
  if (s.status === "COMPLETED") redirect(`/app/reports/${id}`);
  if (s.status === "ABANDONED") redirect(`/app/cases/${s.case.slug}`);

  const c = caseContent(s.case);
  const voiceEnabled = (await getSetting("voice.enabled")) === "true";

  // Only patient-visible / non-scoring information is sent to the browser.
  const props: RoomProps = {
    session: { id: s.id, stage: s.stage, language: s.language as RoomProps["session"]["language"], aiMode: s.aiMode as "anthropic" | "groq" | "demo", startedAt: s.startedAt.toISOString(), notes: s.notes, topicsCovered: parseJson<string[]>(s.topicsCovered, []) },
    caseInfo: { title: s.case.title, slug: s.case.slug, setting: c.setting, minutes: s.case.estimatedMinutes, specialty: s.case.specialty, pregnant: "obs_exam" in c.exam },
    patient: { name: c.patient.name, age: c.patient.age, sex: c.patient.sex, occupation: c.patient.occupation, avatar: c.patient.avatar, baselineEmotion: c.patient.baselineEmotion },
    vitals: c.vitals,
    history: c.history,
    messages: s.messages.filter((m) => m.role !== "system").map((m) => ({ id: m.id, role: m.role as "student" | "patient", content: m.content, emotion: m.emotion })),
    exams: s.examinations.map((e) => ({ code: e.code, kind: e.kind as "PHYSICAL" | "INVESTIGATION", name: e.name, result: e.result, abnormal: e.abnormal, at: e.createdAt.toISOString() })),
    managementOptions: c.rubric.management.options.map((o) => ({ code: o.code, label: o.label })).sort((a, b) => a.label.localeCompare(b.label)),
    voiceAllowed: voiceEnabled && user.plan.limits.voice,
  };
  return <ConsultationRoom {...props} />;
}
