/**
 * Serialização compacta do ProgressState para cmi.suspend_data.
 *
 * Limites: SCORM 1.2 → 4.096 caracteres; SCORM 2004 (4ª ed.) → 64.000.
 * Ids são reduzidos aos últimos 6 caracteres (únicos dentro de um curso) em vez de posições,
 * para que o estado continue válido se o curso for republicado com conteúdo reordenado.
 * Se o resultado exceder o limite, os dados menos essenciais são descartados em etapas.
 */
import type { ActivityResult } from "@/blocks/engine/context";
import type { Course } from "@/core/model/types";
import { emptyProgress, type ProgressState } from "../progress";

const PREFIX = "a1:";
const short = (id: string) => id.slice(-6);

type Packed = {
  l?: string; // localização (aula)
  c: string[]; // aulas concluídas
  g?: string[]; // etapas liberadas
  a: Record<string, [number, number, 0 | 1, number, 0 | 1, string[]?]>; // atividades
  t?: number; // concluído em
};

export function encodeSuspendData(state: ProgressState, limit: number): string {
  const activities = (withResponses: boolean) =>
    Object.fromEntries(
      Object.entries(state.activities).map(([id, r]) => [
        short(id),
        [Math.round(r.score * 100) / 100, r.maxScore, r.passed ? 1 : 0, r.attempts, r.completed ? 1 : 0, ...(withResponses && r.response.length ? [r.response] : [])],
      ]),
    ) as Packed["a"];

  const attempts: Packed[] = [
    // 1. completo
    { l: state.location ? short(state.location) : undefined, c: state.completedLessons.map(short), g: state.unlockedGates.map(short), a: activities(true), t: state.completedAt ?? undefined },
    // 2. sem respostas (o aluno perde apenas a restauração visual das escolhas)
    { l: state.location ? short(state.location) : undefined, c: state.completedLessons.map(short), g: state.unlockedGates.map(short), a: activities(false), t: state.completedAt ?? undefined },
    // 3. mínimo: aulas concluídas e notas
    { c: state.completedLessons.map(short), a: activities(false) },
  ];
  for (const p of attempts) {
    const s = PREFIX + JSON.stringify(p);
    if (s.length <= limit) return s;
  }
  return PREFIX + JSON.stringify({ c: state.completedLessons.map(short), a: {} });
}

export function decodeSuspendData(raw: string, course: Course): ProgressState {
  if (!raw || !raw.startsWith(PREFIX)) return emptyProgress();
  let p: Packed;
  try {
    p = JSON.parse(raw.slice(PREFIX.length));
  } catch {
    return emptyProgress();
  }
  const lessonIds = new Map<string, string>();
  const blockIds = new Map<string, string>();
  for (const m of course.modules)
    for (const l of m.lessons) {
      lessonIds.set(short(l.id), l.id);
      for (const b of l.blocks) blockIds.set(short(b.id), b.id);
    }
  const activities: Record<string, ActivityResult> = {};
  for (const [k, v] of Object.entries(p.a ?? {})) {
    const id = blockIds.get(k);
    if (!id || !Array.isArray(v)) continue;
    activities[id] = { score: v[0], maxScore: v[1], passed: v[2] === 1, attempts: v[3], completed: v[4] === 1, response: v[5] ?? [] };
  }
  const known = (ids: string[] | undefined, map: Map<string, string>) =>
    (ids ?? []).map((s) => map.get(s)).filter((x): x is string => !!x);
  return {
    location: (p.l && lessonIds.get(p.l)) || null,
    completedLessons: known(p.c, lessonIds),
    unlockedGates: known(p.g, blockIds),
    activities,
    completedAt: p.t ?? null,
  };
}
