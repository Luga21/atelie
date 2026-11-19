/**
 * ProgressAdapter para LMS via SCORM 1.2 / 2004.
 *
 * | Player                    | SCORM 1.2                        | SCORM 2004                               |
 * |---------------------------|----------------------------------|------------------------------------------|
 * | ProgressState (compacto)  | cmi.suspend_data (≤ 4.096)       | cmi.suspend_data (≤ 64.000)              |
 * | location (aula atual)     | cmi.core.lesson_location         | cmi.location                             |
 * | aulas concluídas          | cmi.core.lesson_status           | cmi.completion_status + progress_measure |
 * | nota                      | cmi.core.score.raw/min/max       | cmi.score.scaled/raw/min/max             |
 * | aprovação (nota mínima)   | lesson_status passed/failed      | cmi.success_status                       |
 * | duração da sessão         | cmi.core.session_time            | cmi.session_time                         |
 */
import type { Course } from "@/core/model/types";
import { flatLessons } from "@/core/model/operations";
import type { CourseOutcome, ProgressAdapter, ProgressState } from "../progress";
import { connectScorm, formatSessionTime, type ScormConnection, type ScormVersion } from "./api";
import { decodeSuspendData, encodeSuspendData } from "./suspend";

const KEYS = {
  "1.2": {
    suspend: "cmi.suspend_data",
    location: "cmi.core.lesson_location",
    sessionTime: "cmi.core.session_time",
    exit: "cmi.core.exit",
    limit: 4096,
  },
  "2004": {
    suspend: "cmi.suspend_data",
    location: "cmi.location",
    sessionTime: "cmi.session_time",
    exit: "cmi.exit",
    limit: 64000,
  },
} as const;

const COMMIT_DELAY = 800;

export interface ScormProgressAdapter extends ProgressAdapter {
  connection: ScormConnection;
  /** Encerra a sessão (grava duração, commit e finish). Idempotente. */
  terminate(): void;
}

export function createScormProgress(course: Course, version: ScormVersion): ScormProgressAdapter | null {
  const conn = connectScorm(version);
  if (!conn) return null;
  const k = KEYS[version];
  const startedAt = Date.now();
  const totalLessons = flatLessons(course).length;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let terminated = false;

  const set = (key: string, value: string) => {
    if (terminated) return;
    if (!conn.set(key, value)) console.warn(`[SCORM] Falha ao gravar ${key}: ${conn.lastError()}`);
  };
  const scheduleCommit = () => {
    clearTimeout(timer);
    timer = setTimeout(() => !terminated && conn.commit(), COMMIT_DELAY);
  };

  // Primeira entrada: marca a tentativa como iniciada.
  if (version === "1.2") {
    const status = conn.get("cmi.core.lesson_status");
    if (!status || status === "not attempted") set("cmi.core.lesson_status", "incomplete");
  } else {
    const status = conn.get("cmi.completion_status");
    if (!status || status === "not attempted" || status === "unknown") set("cmi.completion_status", "incomplete");
  }
  conn.commit();

  const terminate = () => {
    if (terminated) return;
    clearTimeout(timer);
    set(k.sessionTime, formatSessionTime(Date.now() - startedAt, version));
    set(k.exit, "suspend");
    conn.commit();
    conn.finish();
    terminated = true;
  };

  return {
    connection: conn,
    terminate,

    load(): ProgressState {
      const state = decodeSuspendData(conn.get(k.suspend), course);
      const location = conn.get(k.location);
      if (!state.location && location && flatLessons(course).some((l) => l.lesson.id === location)) state.location = location;
      return state;
    },

    save(state: ProgressState) {
      set(k.suspend, encodeSuspendData(state, k.limit));
      if (state.location) set(k.location, state.location);
      if (version === "2004" && totalLessons > 0) {
        const done = flatLessons(course).filter((l) => state.completedLessons.includes(l.lesson.id)).length;
        set("cmi.progress_measure", (done / totalLessons).toFixed(4));
      }
      scheduleCommit();
    },

    reportOutcome(outcome: CourseOutcome) {
      const graded = outcome.maxScore > 0 && outcome.scaled !== null;
      const pct = graded ? Math.round((outcome.scaled as number) * 10000) / 100 : null;
      const passed = pct !== null && pct >= course.lms.passingScore;

      if (version === "1.2") {
        if (pct !== null) {
          set("cmi.core.score.raw", String(Math.round(pct)));
          set("cmi.core.score.min", "0");
          set("cmi.core.score.max", "100");
        }
        const status = !outcome.completed ? "incomplete" : graded ? (passed ? "passed" : "failed") : "completed";
        set("cmi.core.lesson_status", status);
      } else {
        if (pct !== null) {
          set("cmi.score.scaled", ((outcome.scaled as number)).toFixed(4));
          set("cmi.score.raw", String(pct));
          set("cmi.score.min", "0");
          set("cmi.score.max", "100");
        }
        set("cmi.completion_status", outcome.completed ? "completed" : "incomplete");
        set("cmi.success_status", graded && outcome.completed ? (passed ? "passed" : "failed") : "unknown");
      }
      scheduleCommit();
    },

    reset() {
      set(k.suspend, "");
      scheduleCommit();
    },
  };
}
