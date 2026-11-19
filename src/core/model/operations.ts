/**
 * Regras de negócio da estrutura do treinamento, como funções puras que alteram
 * um rascunho (draft do Immer). A interface nunca manipula a árvore diretamente.
 */
import { cloneBlock } from "@/blocks/engine/registry";
import { createLesson, createModule } from "./factory";
import { uid } from "./ids";
import type { Block, Course, Lesson, Module } from "./types";

export interface LessonLocation {
  module: Module;
  moduleIndex: number;
  lesson: Lesson;
  lessonIndex: number;
}

export function findLesson(course: Course, lessonId: string): LessonLocation | null {
  for (let mi = 0; mi < course.modules.length; mi++) {
    const m = course.modules[mi];
    const li = m.lessons.findIndex((l) => l.id === lessonId);
    if (li >= 0) return { module: m, moduleIndex: mi, lesson: m.lessons[li], lessonIndex: li };
  }
  return null;
}

export function findBlock(course: Course, blockId: string): { lesson: Lesson; block: Block; index: number } | null {
  for (const m of course.modules)
    for (const l of m.lessons) {
      const i = l.blocks.findIndex((b) => b.id === blockId);
      if (i >= 0) return { lesson: l, block: l.blocks[i], index: i };
    }
  return null;
}

/** Rótulo do módulo para cabeçalhos, sem repetir "Módulo N" quando o título já o contém. */
export function moduleLabel(module: Module, index: number): string {
  return /^m[óo]dulo\s*\d+$/i.test(module.title.trim()) ? module.title : `Módulo ${index + 1} · ${module.title}`;
}

/** Lista plana de aulas na ordem de apresentação. */
export function flatLessons(course: Course): { lesson: Lesson; module: Module }[] {
  return course.modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, module })));
}

function move<T>(arr: T[], from: number, to: number) {
  if (from === to || from < 0 || from >= arr.length) return;
  const [item] = arr.splice(from, 1);
  arr.splice(Math.max(0, Math.min(arr.length, to)), 0, item);
}

/* ---------------------------------------------------------------- Módulos */

export function addModule(course: Course, index = course.modules.length): Module {
  const m = createModule(`Módulo ${course.modules.length + 1}`);
  course.modules.splice(index, 0, m);
  return m;
}

export function renameModule(course: Course, moduleId: string, title: string) {
  const m = course.modules.find((x) => x.id === moduleId);
  if (m) m.title = title;
}

export function removeModule(course: Course, moduleId: string) {
  course.modules = course.modules.filter((m) => m.id !== moduleId);
}

export function duplicateModule(course: Course, moduleId: string): Module | null {
  const i = course.modules.findIndex((m) => m.id === moduleId);
  if (i < 0) return null;
  const src = course.modules[i];
  const copy: Module = {
    id: uid("m"),
    title: `${src.title} (cópia)`,
    lessons: src.lessons.map((l) => ({ id: uid("l"), title: l.title, blocks: l.blocks.map(cloneBlock) })),
  };
  course.modules.splice(i + 1, 0, copy);
  return copy;
}

export function moveModule(course: Course, from: number, to: number) {
  move(course.modules, from, to);
}

/* ------------------------------------------------------------------ Aulas */

export function addLesson(course: Course, moduleId: string, index?: number): Lesson | null {
  const m = course.modules.find((x) => x.id === moduleId);
  if (!m) return null;
  const l = createLesson(`Aula ${m.lessons.length + 1}`);
  m.lessons.splice(index ?? m.lessons.length, 0, l);
  return l;
}

export function renameLesson(course: Course, lessonId: string, title: string) {
  const loc = findLesson(course, lessonId);
  if (loc) loc.lesson.title = title;
}

export function removeLesson(course: Course, lessonId: string) {
  const loc = findLesson(course, lessonId);
  if (loc) loc.module.lessons.splice(loc.lessonIndex, 1);
}

export function duplicateLesson(course: Course, lessonId: string): Lesson | null {
  const loc = findLesson(course, lessonId);
  if (!loc) return null;
  const copy: Lesson = { id: uid("l"), title: `${loc.lesson.title} (cópia)`, blocks: loc.lesson.blocks.map(cloneBlock) };
  loc.module.lessons.splice(loc.lessonIndex + 1, 0, copy);
  return copy;
}

/** Move uma aula para outro (ou o mesmo) módulo, na posição informada. */
export function moveLesson(course: Course, lessonId: string, toModuleId: string, toIndex: number) {
  const loc = findLesson(course, lessonId);
  const target = course.modules.find((m) => m.id === toModuleId);
  if (!loc || !target) return;
  const [lesson] = loc.module.lessons.splice(loc.lessonIndex, 1);
  target.lessons.splice(Math.max(0, Math.min(target.lessons.length, toIndex)), 0, lesson);
}

/* ----------------------------------------------------------------- Blocos */

export function insertBlock(course: Course, lessonId: string, block: Block, index?: number) {
  const loc = findLesson(course, lessonId);
  if (!loc) return;
  const blocks = loc.lesson.blocks;
  blocks.splice(index ?? blocks.length, 0, block);
}

export function removeBlock(course: Course, blockId: string) {
  const f = findBlock(course, blockId);
  if (f) f.lesson.blocks.splice(f.index, 1);
}

export function duplicateBlock(course: Course, blockId: string): Block | null {
  const f = findBlock(course, blockId);
  if (!f) return null;
  const copy = cloneBlock(f.block);
  f.lesson.blocks.splice(f.index + 1, 0, copy);
  return copy;
}

export function moveBlock(course: Course, lessonId: string, from: number, to: number) {
  const loc = findLesson(course, lessonId);
  if (loc) move(loc.lesson.blocks, from, to);
}
