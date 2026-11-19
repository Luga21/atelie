import { defaultTheme } from "../theme/presets";
import { uid } from "./ids";
import { COURSE_SCHEMA_VERSION, type Course, type Lesson, type Module } from "./types";

export function createLesson(title = "Nova aula"): Lesson {
  return { id: uid("l"), title, blocks: [] };
}

export function createModule(title = "Novo módulo", withLesson = true): Module {
  return { id: uid("m"), title, lessons: withLesson ? [createLesson("Primeira aula")] : [] };
}

export function createCourse(input: { title?: string; description?: string; folderId?: string | null } = {}): Course {
  const now = Date.now();
  return {
    schemaVersion: COURSE_SCHEMA_VERSION,
    id: uid("c"),
    title: input.title?.trim() || "Treinamento sem título",
    description: input.description?.trim() ?? "",
    cover: { image: null, eyebrow: "", buttonLabel: "Começar", showOutline: true },
    theme: defaultTheme(),
    lms: { passingScore: 70, identifier: uid("pkg") },
    modules: [createModule("Módulo 1")],
    status: "draft",
    folderId: input.folderId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
