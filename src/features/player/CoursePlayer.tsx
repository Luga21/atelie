"use client";
/**
 * Player do aluno. Consome apenas o modelo do treinamento e o registro de Views dos blocos.
 * É o mesmo componente usado no preview do app e no pacote HTML exportado.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/blocks/definitions";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { getBlockDefinition } from "@/blocks/engine/registry";
import {
  ActivityReporterContext, LessonScopeContext, MediaResolverContext, useMediaUrl, type ActivityReporter, type ActivityResult,
  type LessonScope, type MediaResolver,
} from "@/blocks/engine/context";
import { flatLessons, moduleLabel } from "@/core/model/operations";
import type { Course } from "@/core/model/types";
import { ThemeScope } from "@/core/theme/ThemeScope";
import { emptyProgress, type CourseOutcome, type ProgressAdapter, type ProgressState } from "./progress";

/** Blocos que o aluno responde (possuem `scoring`), na ordem de apresentação. */
const isActivity = (type: string) => !!getBlockDefinition(type)?.scoring;

type View = { kind: "cover" } | { kind: "lesson"; id: string } | { kind: "complete" };

interface Props {
  course: Course;
  resolver: MediaResolver;
  progress: ProgressAdapter;
  /** true quando o player está dentro de outra interface (preview), e não em tela cheia. */
  embedded?: boolean;
  /** Abre direto em uma aula (ex.: preview a partir do editor). */
  startLessonId?: string | null;
}

function computeOutcome(course: Course, state: ProgressState): CourseOutcome {
  let score = 0;
  let maxScore = 0;
  for (const m of course.modules)
    for (const l of m.lessons)
      for (const b of l.blocks) {
        const def = getBlockDefinition(b.type);
        if (!def?.scoring) continue;
        maxScore += def.scoring.maxScore({ content: b.content, settings: b.settings });
        score += state.activities[b.id]?.score ?? 0;
      }
  const total = flatLessons(course).length;
  const completed = total > 0 && flatLessons(course).every(({ lesson }) => state.completedLessons.includes(lesson.id));
  return { completed, score, maxScore, scaled: maxScore > 0 ? score / maxScore : null };
}

export function CoursePlayer({ course, resolver, progress, embedded, startLessonId }: Props) {
  const lessons = useMemo(() => flatLessons(course), [course]);
  const [state, setState] = useState<ProgressState>(() => ({ ...emptyProgress(), ...progress.load() }));
  const [view, setView] = useState<View>(() =>
    startLessonId && lessons.some((l) => l.lesson.id === startLessonId) ? { kind: "lesson", id: startLessonId } : { kind: "cover" },
  );
  const [navOpen, setNavOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const commit = useCallback(
    (fn: (s: ProgressState) => ProgressState) => {
      setState((prev) => {
        const next = fn(prev);
        progress.save(next);
        progress.reportOutcome?.(computeOutcome(course, next));
        return next;
      });
    },
    [progress, course],
  );

  const reporter = useMemo<ActivityReporter>(
    () => ({
      get: (id) => state.activities[id],
      report: (id, result: ActivityResult) => commit((s) => ({ ...s, activities: { ...s.activities, [id]: result } })),
    }),
    [state.activities, commit],
  );

  const go = useCallback(
    (v: View) => {
      setView(v);
      setNavOpen(false);
      if (v.kind === "lesson") commit((s) => ({ ...s, location: v.id }));
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: "start" }));
    },
    [commit],
  );

  const markComplete = useCallback(
    (lessonId: string) =>
      commit((s) => {
        if (s.completedLessons.includes(lessonId)) return s;
        const completedLessons = [...s.completedLessons, lessonId];
        const all = lessons.every(({ lesson }) => completedLessons.includes(lesson.id));
        return { ...s, completedLessons, completedAt: all ? Date.now() : s.completedAt };
      }),
    [commit, lessons],
  );

  const doneCount = lessons.filter(({ lesson }) => state.completedLessons.includes(lesson.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const nav = course.theme.layout.navigation;
  const currentId = view.kind === "lesson" ? view.id : null;

  const outline = (
    <nav aria-label="Conteúdo do treinamento">
      {course.modules.map((m) => (
        <div key={m.id} className="cp-outline-module">
          <span>{m.title}</span>
          {m.lessons.map((l) => {
            const done = state.completedLessons.includes(l.id);
            return (
              <button key={l.id} type="button" className={`cp-outline-lesson ${currentId === l.id ? "is-current" : ""}`}
                aria-current={currentId === l.id ? "page" : undefined} onClick={() => go({ kind: "lesson", id: l.id })}>
                <span className={`cp-check ${done ? "is-done" : ""}`} aria-label={done ? "Concluída" : "Não concluída"}>{done ? "✓" : ""}</span>
                <span>{l.title}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const progressEl = (
    <div className="cp-progress" aria-label={`Progresso: ${pct}%`}>
      <div className="cp-progress-bar"><span style={{ width: `${pct}%` }} /></div>
      <span className="cp-progress-label">{pct}%</span>
    </div>
  );

  return (
    <MediaResolverContext.Provider value={resolver}>
      <ActivityReporterContext.Provider value={reporter}>
        <ThemeScope theme={course.theme}>
          <div ref={rootRef} className={`cp ${embedded ? "is-embedded" : ""} ${navOpen ? "nav-open" : ""}`}>
            {view.kind === "cover" ? (
              <Cover course={course} state={state} lessonsTotal={lessons.length} onStart={(id) => go({ kind: "lesson", id })} />
            ) : (
              <>
                <header className="cp-topbar">
                  <button type="button" className={`cp-icon-btn cp-menu-toggle ${nav === "sidebar" ? "is-sidebar" : ""}`}
                    aria-label="Abrir menu de aulas" aria-expanded={navOpen} onClick={() => setNavOpen((o) => !o)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <button type="button" className="cp-icon-btn" aria-label="Voltar à capa" onClick={() => go({ kind: "cover" })}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
                  </button>
                  <span className="cp-topbar-title">{course.title}</span>
                  {progressEl}
                  {nav === "top" && navOpen && <div className="cp-topnav-menu">{outline}</div>}
                </header>
                <div className="cp-body">
                  {nav === "sidebar" && (
                    <>
                      <aside className="cp-sidebar">
                        <div className="cp-outline-course">
                          <h2 className="cr-h">{course.title}</h2>
                          {progressEl}
                        </div>
                        {outline}
                      </aside>
                      <div className="cp-drawer-backdrop" onClick={() => setNavOpen(false)} />
                    </>
                  )}
                  <main className="cp-main">
                    {view.kind === "lesson" ? (
                      <LessonPage key={view.id} course={course} lessonId={view.id} lessons={lessons} onNavigate={go} onComplete={markComplete}
                        unlockedGates={state.unlockedGates}
                        onUnlock={(id) => commit((s) => (s.unlockedGates.includes(id) ? s : { ...s, unlockedGates: [...s.unlockedGates, id] }))} />
                    ) : (
                      <Completion course={course} state={state} onRestart={() => {
                        progress.reset?.();
                        const fresh = emptyProgress();
                        progress.save(fresh);
                        setState(fresh);
                        go({ kind: "cover" });
                      }} onReview={() => lessons[0] && go({ kind: "lesson", id: lessons[0].lesson.id })} />
                    )}
                  </main>
                </div>
              </>
            )}
          </div>
        </ThemeScope>
      </ActivityReporterContext.Provider>
    </MediaResolverContext.Provider>
  );
}

/* ------------------------------------------------------------------- Capa */
function Cover({ course, state, lessonsTotal, onStart }: {
  course: Course;
  state: ProgressState;
  lessonsTotal: number;
  onStart: (lessonId: string) => void;
}) {
  const image = useMediaUrl(course.cover.image);
  const first = course.modules.find((m) => m.lessons.length)?.lessons[0];
  const resume = state.location && course.modules.some((m) => m.lessons.some((l) => l.id === state.location)) ? state.location : null;
  return (
    <>
      <section className="cp-cover" data-style={course.theme.layout.coverStyle}>
        {image && <img className="cp-cover-media" src={image} alt="" />}
        <div className="cp-cover-shade" />
        <div className="cp-cover-content">
          {course.cover.eyebrow && <span className="cr-eyebrow">{course.cover.eyebrow}</span>}
          <h1 className="cr-h">{course.title}</h1>
          {course.description && <p className="cp-cover-desc">{course.description}</p>}
          <div className="cp-cover-actions">
            {first ? (
              <button type="button" className="cr-btn" onClick={() => onStart(resume ?? first.id)}>
                {resume ? "Continuar de onde parei" : course.cover.buttonLabel || "Começar"} →
              </button>
            ) : (
              <span className="cp-cover-stats">Este treinamento ainda não possui aulas.</span>
            )}
            <span className="cp-cover-stats">
              {course.modules.length} {course.modules.length === 1 ? "módulo" : "módulos"} · {lessonsTotal} {lessonsTotal === 1 ? "aula" : "aulas"}
            </span>
          </div>
        </div>
      </section>
      {course.cover.showOutline && lessonsTotal > 0 && (
        <section className="cp-cover-outline">
          <h2 className="cr-h">Conteúdo do treinamento</h2>
          {course.modules.map((m, mi) => (
            <div key={m.id} className="cp-cover-module">
              <h3 className="cr-h">{mi + 1}. {m.title}</h3>
              {m.lessons.map((l) => {
                const done = state.completedLessons.includes(l.id);
                return (
                  <button key={l.id} type="button" className="cp-cover-lesson" onClick={() => onStart(l.id)}>
                    <span className={`cp-check ${done ? "is-done" : ""}`}>{done ? "✓" : ""}</span>
                    <span>{l.title}</span>
                    <small>{l.blocks.length} {l.blocks.length === 1 ? "bloco" : "blocos"}</small>
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------- Aula */
function LessonPage({ course, lessonId, lessons, onNavigate, onComplete, unlockedGates, onUnlock }: {
  course: Course;
  lessonId: string;
  lessons: ReturnType<typeof flatLessons>;
  onNavigate: (v: View) => void;
  onComplete: (lessonId: string) => void;
  unlockedGates: string[];
  onUnlock: (gateId: string) => void;
}) {
  const index = lessons.findIndex((l) => l.lesson.id === lessonId);
  const entry = lessons[index];
  const endRef = useRef<HTMLDivElement>(null);
  const blocks = entry?.lesson.blocks ?? [];

  // Blocos visíveis: tudo até a primeira etapa com desbloqueio ainda fechada (inclusive).
  const firstLocked = blocks.findIndex((b) => b.type === "gate" && !unlockedGates.includes(b.id));
  const visible = firstLocked >= 0 ? blocks.slice(0, firstLocked + 1) : blocks;
  const locked = firstLocked >= 0;

  const scope = useMemo<LessonScope>(() => {
    const lessonActivityIds = blocks.filter((b) => isActivity(b.type)).map((b) => b.id);
    const courseActivityIds = course.modules.flatMap((m) => m.lessons.flatMap((l) => l.blocks.filter((b) => isActivity(b.type)).map((b) => b.id)));
    return {
      lessonActivityIds,
      courseActivityIds,
      activitiesBefore: (id) => {
        const end = blocks.findIndex((b) => b.id === id);
        return blocks.slice(0, end < 0 ? blocks.length : end).filter((b) => isActivity(b.type)).map((b) => b.id);
      },
      isUnlocked: (id) => unlockedGates.includes(id),
      unlock: (id) => {
        onUnlock(id);
        // Leva o aluno ao conteúdo recém-liberado.
        requestAnimationFrame(() => document.querySelector(`[data-after-gate="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      },
    };
  }, [blocks, course, unlockedGates, onUnlock]);

  // A aula é concluída quando o aluno chega ao fim do conteúdo (com todas as etapas liberadas).
  useEffect(() => {
    const el = endRef.current;
    if (!el || locked || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onComplete(lessonId);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [lessonId, onComplete, locked]);

  if (!entry) return <p className="cp-lesson-empty">Aula não encontrada.</p>;
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const moduleIndex = course.modules.findIndex((m) => m.id === entry.module.id);

  return (
    <LessonScopeContext.Provider value={scope}>
    <article>
      <header className="cp-lesson-header" data-style={course.theme.layout.header}>
        <div className="cp-lesson-header-inner">
          <span className="cr-eyebrow">{moduleLabel(entry.module, moduleIndex)}</span>
          <h1 className="cr-h">{entry.lesson.title}</h1>
          <p className="cp-lesson-meta">Aula {index + 1} de {lessons.length}</p>
        </div>
      </header>
      {entry.lesson.blocks.length === 0 && <p className="cp-lesson-empty">Esta aula ainda não possui conteúdo.</p>}
      {visible.map((b, i) => (
        <div key={b.id} data-after-gate={i > 0 && visible[i - 1].type === "gate" ? visible[i - 1].id : undefined}>
          <BlockRenderer block={b} mode="view" />
        </div>
      ))}
      {!locked && <div ref={endRef} />}
      {!locked && <footer className="cp-lesson-footer">
        {prev && (
          <button type="button" className="cr-btn cr-btn--ghost" onClick={() => onNavigate({ kind: "lesson", id: prev.lesson.id })}>
            ← <span className="cp-btn-label">{prev.lesson.title}</span>
          </button>
        )}
        <button type="button" className="cr-btn cp-next" onClick={() => {
          onComplete(lessonId);
          onNavigate(next ? { kind: "lesson", id: next.lesson.id } : { kind: "complete" });
        }}>
          <span className="cp-btn-label">{next ? `Próxima: ${next.lesson.title}` : "Concluir treinamento"}</span> →
        </button>
      </footer>}
    </article>
    </LessonScopeContext.Provider>
  );
}

/* -------------------------------------------------------------- Conclusão */
function Completion({ course, state, onRestart, onReview }: {
  course: Course;
  state: ProgressState;
  onRestart: () => void;
  onReview: () => void;
}) {
  const outcome = computeOutcome(course, state);
  const answered = Object.keys(state.activities).length;
  return (
    <section className="cp-complete">
      <div className="cp-complete-badge">✓</div>
      <h1 className="cr-h">{outcome.completed ? "Treinamento concluído!" : "Você chegou ao fim"}</h1>
      <p>{outcome.completed ? "Parabéns por completar todas as aulas." : "Algumas aulas ainda não foram concluídas. Revise o conteúdo pelo menu."}</p>
      {outcome.maxScore > 0 && (
        <div className="cp-score">
          <div><strong>{Math.round((outcome.scaled ?? 0) * 100)}%</strong><span>Aproveitamento</span></div>
          <div><strong>{outcome.score}/{outcome.maxScore}</strong><span>Pontos</span></div>
          <div><strong>{answered}</strong><span>Atividades respondidas</span></div>
        </div>
      )}
      <div className="cp-cover-actions">
        <button type="button" className="cr-btn cr-btn--ghost" onClick={onReview}>Revisar conteúdo</button>
        <button type="button" className="cr-btn" onClick={onRestart}>Recomeçar</button>
      </div>
    </section>
  );
}
