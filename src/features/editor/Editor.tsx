"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EditorServicesContext, MediaResolverContext, type EditorServices } from "@/blocks/engine/context";
import { localAssetResolver, primeAsset } from "@/storage/assetResolver";
import { assetRepository, courseRepository } from "@/storage/repository";
import { Button } from "@/ui/primitives";
import { Canvas } from "./canvas/Canvas";
import { RichTextToolbar } from "./canvas/RichTextToolbar";
import { RightPanel } from "./panels/RightPanel";
import { useEditor } from "./state/editorStore";
import { useAutosave } from "./state/useAutosave";
import { StructureSidebar } from "./structure/StructureSidebar";
import { TopBar } from "./TopBar";

const MAX_UPLOAD_MB = 80;

function isTypingTarget(el: EventTarget | null) {
  const e = el as HTMLElement | null;
  return !!e && (e.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName));
}

export function Editor({ courseId }: { courseId: string | null }) {
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const course = useEditor((s) => s.course);
  const [reloadKey, setReloadKey] = useState(0);

  // Se o store perder o documento (ex.: hot reload em desenvolvimento), recarrega do armazenamento.
  useEffect(() => {
    if (state === "ready" && (!course || course.id !== courseId)) {
      setState("loading");
      setReloadKey((k) => k + 1);
    }
  }, [state, course, courseId]);

  useEffect(() => {
    if (!courseId) {
      setState("missing");
      return;
    }
    let alive = true;
    courseRepository
      .get(courseId)
      .then((c) => {
        if (!alive) return;
        if (!c) return setState("missing");
        useEditor.getState().load(c);
        setState("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setError((e as Error).message);
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [courseId, reloadKey]);

  useAutosave();

  // Gancho de depuração/teste automatizado (apenas em desenvolvimento).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Promise.all([import("@/export/html"), import("@/export/json"), import("@/export/scorm")]).then(([html, json, scorm]) => {
      (window as unknown as Record<string, unknown>).__atelieDebug = {
        getCourse: () => useEditor.getState().course,
        buildHtmlPackage: html.buildHtmlPackage,
        buildScormPackage: scorm.buildScormPackage,
        buildProjectFile: json.buildProjectFile,
        importCourseJson: json.importCourseJson,
      };
    });
  }, []);

  // Atalhos de teclado globais do editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const st = useEditor.getState();
      const typing = isTypingTarget(e.target);
      if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
      } else if (mod && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        st.redo();
      } else if (mod && e.key.toLowerCase() === "d" && st.selectedBlockId && !typing) {
        e.preventDefault();
        st.duplicateBlock(st.selectedBlockId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && st.selectedBlockId && !typing) {
        e.preventDefault();
        st.removeBlock(st.selectedBlockId);
      } else if (e.key === "Escape" && !typing) {
        if (st.inserter) st.closeInserter();
        else st.selectBlock(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const services = useMemo<EditorServices>(
    () => ({
      async uploadMedia(file) {
        const c = useEditor.getState().course;
        if (!c) throw new Error("Nenhum treinamento aberto.");
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Arquivo maior que ${MAX_UPLOAD_MB} MB.`);
        const asset = await assetRepository.put(c.id, file, file.name);
        primeAsset(asset.id, file);
        return { kind: "asset", id: asset.id };
      },
      selectBlock: (id) => useEditor.getState().selectBlock(id),
    }),
    [],
  );

  if (state === "loading") {
    return <div className="grid h-screen place-items-center text-sm text-ink-400">Abrindo treinamento…</div>;
  }
  if (state !== "ready" || !course) {
    return (
      <div className="grid h-screen place-items-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-white">{state === "error" ? "Erro ao abrir o treinamento" : "Treinamento não encontrado"}</h1>
          <p className="mt-2 text-sm text-ink-400">{error ?? "Ele pode ter sido excluído ou estar salvo em outro navegador."}</p>
          <Link href="/"><Button variant="primary" className="mt-6">Voltar ao painel</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <MediaResolverContext.Provider value={localAssetResolver}>
      <EditorServicesContext.Provider value={services}>
        <div className="flex h-screen flex-col overflow-hidden">
          <TopBar />
          <div className="relative flex min-h-0 flex-1">
            <StructureSidebar />
            <Canvas />
            <RightPanel />
          </div>
        </div>
        <RichTextToolbar />
      </EditorServicesContext.Provider>
    </MediaResolverContext.Provider>
  );
}
