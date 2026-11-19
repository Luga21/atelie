/**
 * Estado do editor.
 *  - `course`: documento editado (fonte de verdade do canvas e do preview).
 *  - `past` / `future`: histórico imutável (Immer compartilha estrutura, então snapshots são baratos).
 *  - seleção e painéis: estado de UI, nunca persistido no documento.
 * Toda alteração passa por `apply`, que delega às regras puras de core/model/operations.
 */
import { useMemo } from "react";
import { create } from "zustand";
import { produce, type Draft } from "immer";
import "@/blocks/definitions";
import { createBlock } from "@/blocks/engine/registry";
import * as ops from "@/core/model/operations";
import type { Block, Course } from "@/core/model/types";

const HISTORY_LIMIT = 150;
const COALESCE_MS = 1200;

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type RightPanel = "block" | "theme" | "course" | null;
export type Selection = { kind: "cover" } | { kind: "lesson"; lessonId: string };

interface EditorState {
  course: Course | null;
  past: Course[];
  future: Course[];
  lastCoalesce: { key: string; at: number } | null;

  selection: Selection;
  selectedBlockId: string | null;
  panel: RightPanel;
  /** Posição onde a biblioteca de blocos está aberta no canvas. */
  inserter: { lessonId: string; index: number } | null;

  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;

  load(course: Course): void;
  apply(recipe: (draft: Draft<Course>) => void, coalesceKey?: string): void;
  undo(): void;
  redo(): void;

  selectCover(): void;
  selectLesson(lessonId: string): void;
  selectBlock(blockId: string | null): void;
  setPanel(panel: RightPanel): void;
  openInserter(lessonId: string, index: number): void;
  closeInserter(): void;

  setSaveStatus(status: SaveStatus, error?: string | null): void;

  // Ações de alto nível
  insertBlock(type: string, lessonId: string, index: number): string;
  updateBlock(blockId: string, recipe: (b: Draft<Block>) => void, coalesceKey?: string): void;
  duplicateBlock(blockId: string): void;
  removeBlock(blockId: string): void;
  moveBlock(lessonId: string, from: number, to: number): void;
}

export const useEditor = create<EditorState>()((set, get) => ({
  course: null,
  past: [],
  future: [],
  lastCoalesce: null,
  selection: { kind: "cover" },
  selectedBlockId: null,
  panel: null,
  inserter: null,
  saveStatus: "idle",
  lastSavedAt: null,
  saveError: null,

  load(course) {
    const firstLesson = ops.flatLessons(course)[0]?.lesson.id;
    set({
      course,
      past: [],
      future: [],
      lastCoalesce: null,
      selection: firstLesson ? { kind: "lesson", lessonId: firstLesson } : { kind: "cover" },
      selectedBlockId: null,
      panel: null,
      inserter: null,
      saveStatus: "saved",
      lastSavedAt: course.updatedAt,
      saveError: null,
    });
  },

  apply(recipe, coalesceKey) {
    const { course, past, lastCoalesce } = get();
    if (!course) return;
    const next = produce(course, (d) => {
      recipe(d);
      d.updatedAt = Date.now();
    });
    if (next === course) return;
    const now = Date.now();
    const merge = !!coalesceKey && lastCoalesce?.key === coalesceKey && now - lastCoalesce.at < COALESCE_MS;
    set({
      course: next,
      past: merge ? past : [...past, course].slice(-HISTORY_LIMIT),
      future: [],
      lastCoalesce: coalesceKey ? { key: coalesceKey, at: now } : null,
    });
  },

  undo() {
    const { past, course, future } = get();
    if (!past.length || !course) return;
    const prev = past[past.length - 1];
    set({ course: prev, past: past.slice(0, -1), future: [course, ...future], lastCoalesce: null });
    fixSelection(get, set);
  },

  redo() {
    const { past, course, future } = get();
    if (!future.length || !course) return;
    const next = future[0];
    set({ course: next, past: [...past, course], future: future.slice(1), lastCoalesce: null });
    fixSelection(get, set);
  },

  selectCover: () => set({ selection: { kind: "cover" }, selectedBlockId: null, inserter: null, panel: get().panel === "block" ? "course" : get().panel ?? "course" }),
  selectLesson: (lessonId) => set({ selection: { kind: "lesson", lessonId }, selectedBlockId: null, inserter: null, panel: get().panel === "block" ? null : get().panel }),
  selectBlock: (blockId) =>
    set((s) => ({
      selectedBlockId: blockId,
      panel: blockId ? "block" : s.panel === "block" ? null : s.panel,
    })),
  setPanel: (panel) => set({ panel }),
  openInserter: (lessonId, index) => set({ inserter: { lessonId, index } }),
  closeInserter: () => set({ inserter: null }),

  setSaveStatus: (status, error = null) =>
    set({ saveStatus: status, saveError: error, ...(status === "saved" ? { lastSavedAt: Date.now() } : {}) }),

  insertBlock(type, lessonId, index) {
    const block = createBlock(type);
    get().apply((d) => ops.insertBlock(d, lessonId, block, index));
    set({ inserter: null, selectedBlockId: block.id, panel: "block" });
    return block.id;
  },

  updateBlock(blockId, recipe, coalesceKey) {
    get().apply((d) => {
      const f = ops.findBlock(d as Course, blockId);
      if (f) recipe(f.block as Draft<Block>);
    }, coalesceKey);
  },

  duplicateBlock(blockId) {
    let newId: string | null = null;
    get().apply((d) => {
      newId = ops.duplicateBlock(d as Course, blockId)?.id ?? null;
    });
    if (newId) set({ selectedBlockId: newId });
  },

  removeBlock(blockId) {
    get().apply((d) => ops.removeBlock(d as Course, blockId));
    if (get().selectedBlockId === blockId) set({ selectedBlockId: null, panel: null });
  },

  moveBlock(lessonId, from, to) {
    get().apply((d) => ops.moveBlock(d as Course, lessonId, from, to));
  },
}));

/** Após desfazer/refazer, garante que a seleção ainda aponta para algo existente. */
function fixSelection(get: () => EditorState, set: (p: Partial<EditorState>) => void) {
  const { course, selection, selectedBlockId } = get();
  if (!course) return;
  if (selection.kind === "lesson" && !ops.findLesson(course, selection.lessonId)) {
    const first = ops.flatLessons(course)[0]?.lesson.id;
    set({ selection: first ? { kind: "lesson", lessonId: first } : { kind: "cover" } });
  }
  if (selectedBlockId && !ops.findBlock(course, selectedBlockId)) set({ selectedBlockId: null, panel: null });
}

/* Seletores (objetos derivados são memoizados para não gerar renderizações em loop) */
export const useCourse = () => useEditor((s) => s.course);
export function useCurrentLesson() {
  const course = useEditor((s) => s.course);
  const selection = useEditor((s) => s.selection);
  return useMemo(
    () => (course && selection.kind === "lesson" ? ops.findLesson(course, selection.lessonId) : null),
    [course, selection],
  );
}
