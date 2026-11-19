/**
 * Rastreamento de progresso do aluno, desacoplado do armazenamento.
 *
 * O player só conversa com `ProgressAdapter`. Hoje existem adaptadores em memória
 * (preview) e localStorage (HTML exportado). Um adaptador SCORM 1.2/2004 implementará
 * esta mesma interface mapeando:
 *   location          → cmi.core.lesson_location / cmi.location
 *   estado serializado → cmi.suspend_data
 *   conclusão          → cmi.core.lesson_status / cmi.completion_status
 *   pontuação          → cmi.core.score.raw|max / cmi.score.scaled
 * Ver docs/ARQUITETURA.md, seção "Preparação para SCORM".
 */
import type { ActivityResult } from "@/blocks/engine/context";

export interface ProgressState {
  location: string | null;
  completedLessons: string[];
  activities: Record<string, ActivityResult>;
  /** Etapas com desbloqueio já liberadas pelo aluno. */
  unlockedGates: string[];
  completedAt: number | null;
}

export interface CourseOutcome {
  completed: boolean;
  score: number;
  maxScore: number;
  /** 0..1, ou null se o curso não tem atividades avaliativas. */
  scaled: number | null;
}

export interface ProgressAdapter {
  load(): ProgressState;
  save(state: ProgressState): void;
  /** Notificado quando o resultado geral muda (gancho para LMS). */
  reportOutcome?(outcome: CourseOutcome): void;
  reset?(): void;
}

export const emptyProgress = (): ProgressState => ({ location: null, completedLessons: [], activities: {}, unlockedGates: [], completedAt: null });

export function createMemoryProgress(): ProgressAdapter {
  let state = emptyProgress();
  return {
    load: () => state,
    save: (s) => { state = s; },
    reset: () => { state = emptyProgress(); },
  };
}

export function createLocalProgress(courseId: string): ProgressAdapter {
  const key = `course-progress:${courseId}`;
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? { ...emptyProgress(), ...JSON.parse(raw) } : emptyProgress();
      } catch {
        return emptyProgress();
      }
    },
    save(state) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* armazenamento indisponível (modo privado): o progresso vale só para a sessão */
      }
    },
    reset() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}
