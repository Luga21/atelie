"use client";
import { useState } from "react";
import {
  closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "./modifiers";
import { Plus } from "lucide-react";
import { EditableText } from "@/blocks/common/Editable";
import { MediaImage } from "@/blocks/common/Media";
import { BLOCK_EDITOR_KITS } from "@/blocks/editorKit";
import { getBlockDefinition } from "@/blocks/engine/registry";
import * as ops from "@/core/model/operations";
import type { Course } from "@/core/model/types";
import { ThemeScope } from "@/core/theme/ThemeScope";
import { cn } from "@/ui/cn";
import { useCurrentLesson, useEditor } from "../state/editorStore";
import { BlockLibrary } from "./BlockLibrary";
import { BlockShell } from "./BlockShell";

export function Canvas() {
  const course = useEditor((s) => s.course)!;
  const selection = useEditor((s) => s.selection);

  return (
    <main
      className="relative min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,#1d2027_1px,transparent_0)] [background-size:22px_22px] scroll-thin"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) useEditor.getState().selectBlock(null);
      }}
      aria-label="Canvas de edição"
    >
      <div className="mx-auto my-6 w-[calc(100%-48px)] max-w-[1180px] overflow-hidden rounded-xl shadow-[0_0_0_1px_#262932,0_24px_60px_-20px_rgb(0_0_0/0.7)]">
        <ThemeScope theme={course.theme}>
          {selection.kind === "cover" ? <CoverEditor course={course} /> : <LessonCanvas />}
        </ThemeScope>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- Aula */
function LessonCanvas() {
  const course = useEditor((s) => s.course)!;
  const loc = useCurrentLesson();
  const selectedBlockId = useEditor((s) => s.selectedBlockId);
  const inserter = useEditor((s) => s.inserter);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const st = useEditor.getState();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!loc) return <div className="p-16 text-center text-[var(--c-muted)]">Selecione uma aula na estrutura.</div>;
  const { lesson, module, moduleIndex } = loc;
  const blocks = lesson.blocks;
  const flat = ops.flatLessons(course);
  const lessonNumber = flat.findIndex((l) => l.lesson.id === lesson.id) + 1;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    if (from >= 0 && to >= 0) st.moveBlock(lesson.id, from, to);
  };

  const draggingBlock = blocks.find((b) => b.id === draggingId);

  return (
    <div className="cp min-h-[70vh]" onMouseDown={(e) => {
      if ((e.target as HTMLElement).closest("[data-block-id]")) return;
      st.selectBlock(null);
    }}>
      <header className="cp-lesson-header" data-style={course.theme.layout.header}>
        <div className="cp-lesson-header-inner">
          <span className="cr-eyebrow">{ops.moduleLabel(module, moduleIndex)}</span>
          <EditableText as="h1" className="cr-h" value={lesson.title} editable placeholder="Título da aula"
            onChange={(v) => st.apply((d) => ops.renameLesson(d as Course, lesson.id, v), `lesson-title:${lesson.id}`)} />
          <p className="cp-lesson-meta">Aula {lessonNumber} de {flat.length}</p>
        </div>
      </header>

      {blocks.length === 0 ? (
        <div className="px-6 pb-16 pt-4">
          <BlockLibrary title="Comece esta aula escolhendo um bloco" onPick={(t) => st.insertBlock(t, lesson.id, 0)} />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]}
          onDragStart={(e) => setDraggingId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDraggingId(null)}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <InsertPoint lessonId={lesson.id} index={0} open={inserter?.lessonId === lesson.id && inserter.index === 0} />
            {blocks.map((b, i) => (
              <div key={b.id}>
                <BlockShell block={b} index={i} total={blocks.length} lessonId={lesson.id} selected={selectedBlockId === b.id} />
                <InsertPoint lessonId={lesson.id} index={i + 1} open={inserter?.lessonId === lesson.id && inserter.index === i + 1} />
              </div>
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {draggingBlock && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-brand-500 bg-ink-900 px-3 py-2 text-[13px] text-white shadow-2xl [&_svg]:size-4">
                <span style={{ color: BLOCK_EDITOR_KITS[draggingBlock.type]?.tint }}>{BLOCK_EDITOR_KITS[draggingBlock.type]?.icon}</span>
                {getBlockDefinition(draggingBlock.type)?.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {blocks.length > 0 && !(inserter?.lessonId === lesson.id && inserter.index === blocks.length) && (
        <div className="flex justify-center pb-16 pt-6">
          <button type="button" onClick={() => st.openInserter(lesson.id, blocks.length)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-[color-mix(in_srgb,var(--c-muted)_45%,transparent)] px-5 text-[13px] font-medium text-[var(--c-muted)] transition-colors hover:border-[var(--c-primary)] hover:text-[var(--c-primary)]">
            <Plus size={16} /> Adicionar bloco
          </button>
        </div>
      )}
    </div>
  );
}

/** Zona entre blocos: mostra o botão "+" no hover e abre a biblioteca no próprio fluxo. */
function InsertPoint({ lessonId, index, open }: { lessonId: string; index: number; open: boolean }) {
  const st = useEditor.getState();
  if (open) {
    return (
      <div className="px-6">
        <BlockLibrary onPick={(t) => st.insertBlock(t, lessonId, index)} onClose={st.closeInserter} />
      </div>
    );
  }
  return (
    <div className="group/insert relative z-[8] -my-3 flex h-6 items-center justify-center">
      <div className="absolute inset-x-8 top-1/2 h-px bg-[var(--color-brand-500)] opacity-0 transition-opacity group-hover/insert:opacity-60" />
      <button type="button" onClick={() => st.openInserter(lessonId, index)} aria-label="Inserir bloco aqui" title="Inserir bloco aqui"
        className="relative grid h-7 w-7 scale-75 place-items-center rounded-full bg-[var(--color-brand-500)] text-white opacity-0 shadow-lg transition-all focus:scale-100 focus:opacity-100 group-hover/insert:scale-100 group-hover/insert:opacity-100">
        <Plus size={16} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- Capa */
function CoverEditor({ course }: { course: Course }) {
  const st = useEditor.getState();
  const style = course.theme.layout.coverStyle;
  const set = (fn: (c: Course) => void, key?: string) => st.apply((d) => fn(d as Course), key);
  const firstLesson = ops.flatLessons(course)[0];
  const total = ops.flatLessons(course).length;

  return (
    <div className="cp">
      <section className={cn("cp-cover")} data-style={style}>
        {course.cover.image && <MediaImage media={course.cover.image} alt="" mode="view" className="cp-cover-media" />}
        <div className="cp-cover-shade" />
        <div className="cp-cover-content">
          <EditableText as="span" className="cr-eyebrow" value={course.cover.eyebrow} editable placeholder="Rótulo opcional (ex.: Onboarding 2026)"
            onChange={(v) => set((c) => { c.cover.eyebrow = v; }, "cover:eyebrow")} />
          <EditableText as="h1" className="cr-h" value={course.title} editable placeholder="Título do treinamento"
            onChange={(v) => set((c) => { c.title = v; }, "course:title")} />
          <EditableText as="p" className="cp-cover-desc" value={course.description} editable multiline placeholder="Descreva o que o aluno vai aprender…"
            onChange={(v) => set((c) => { c.description = v; }, "course:description")} />
          <div className="cp-cover-actions">
            <span className="cr-btn">
              <EditableText value={course.cover.buttonLabel} editable placeholder="Começar"
                onChange={(v) => set((c) => { c.cover.buttonLabel = v; }, "cover:button")} /> →
            </span>
            <span className="cp-cover-stats">{course.modules.length} módulos · {total} aulas</span>
          </div>
        </div>
      </section>
      {course.cover.showOutline && (
        <section className="cp-cover-outline">
          <h2 className="cr-h">Conteúdo do treinamento</h2>
          {course.modules.map((m, mi) => (
            <div key={m.id} className="cp-cover-module">
              <h3 className="cr-h">{mi + 1}. {m.title}</h3>
              {m.lessons.map((l) => (
                <button key={l.id} type="button" className="cp-cover-lesson" onClick={() => st.selectLesson(l.id)}>
                  <span className="cp-check" />
                  <span>{l.title}</span>
                  <small>Editar aula →</small>
                </button>
              ))}
            </div>
          ))}
          {!firstLesson && <p style={{ color: "var(--c-muted)" }}>Adicione módulos e aulas na barra lateral.</p>}
        </section>
      )}
    </div>
  );
}
