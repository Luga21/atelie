"use client";
import { useEffect } from "react";
import { courseRepository } from "@/storage/repository";
import type { Course } from "@/core/model/types";
import { useEditor } from "./editorStore";

const DEBOUNCE_MS = 700;

/**
 * Salvamento automático: observa o documento no store e grava no repositório
 * com debounce. Também força a gravação ao ocultar a aba e ao sair do editor.
 */
export function useAutosave() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let saved: Course | null = useEditor.getState().course;
    let saving = false;

    const flush = async () => {
      clearTimeout(timer);
      const current = useEditor.getState().course;
      if (!current || current === saved || saving) return;
      saving = true;
      useEditor.getState().setSaveStatus("saving");
      try {
        await courseRepository.save(current);
        saved = current;
        useEditor.getState().setSaveStatus("saved");
      } catch (e) {
        useEditor.getState().setSaveStatus("error", (e as Error).message);
      } finally {
        saving = false;
        if (useEditor.getState().course !== saved) timer = setTimeout(flush, DEBOUNCE_MS);
      }
    };

    const unsub = useEditor.subscribe((s, prev) => {
      if (s.course && s.course !== prev.course) {
        if (prev.course?.id !== s.course.id) {
          saved = s.course; // curso recém-carregado
          return;
        }
        if (s.saveStatus !== "saving") useEditor.getState().setSaveStatus("idle");
        clearTimeout(timer);
        timer = setTimeout(flush, DEBOUNCE_MS);
      }
    });

    const onHide = () => document.visibilityState === "hidden" && flush();
    const onUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().course !== saved) {
        flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
      flush();
    };
  }, []);
}
