"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import type { Course } from "@/core/model/types";
import { CoursePlayer } from "@/features/player/CoursePlayer";
import { createMemoryProgress } from "@/features/player/progress";
import { localAssetResolver } from "@/storage/assetResolver";
import { courseRepository } from "@/storage/repository";
import { cn } from "@/ui/cn";
import { Button } from "@/ui/primitives";

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: { id: Device; label: string; icon: React.ReactNode; width: number | null; height: number | null }[] = [
  { id: "desktop", label: "Desktop", icon: <Monitor size={16} />, width: null, height: null },
  { id: "tablet", label: "Tablet", icon: <Tablet size={16} />, width: 820, height: 1100 },
  { id: "mobile", label: "Celular", icon: <Smartphone size={16} />, width: 390, height: 780 },
];

/** Visualização do aluno, isolada do editor. Progresso em memória (reinicia a cada sessão). */
export function PreviewShell({ courseId, lessonId }: { courseId: string | null; lessonId: string | null }) {
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [device, setDevice] = useState<Device>("desktop");
  const [run, setRun] = useState(0);
  const progress = useMemo(() => createMemoryProgress(), [run]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!courseId) return setCourse(null);
    courseRepository.get(courseId).then(setCourse).catch(() => setCourse(null));
  }, [courseId]);

  if (course === undefined) return <div className="grid h-screen place-items-center text-sm text-ink-400">Carregando visualização…</div>;
  if (!course) {
    return (
      <div className="grid h-screen place-items-center text-center">
        <div>
          <p className="text-ink-300">Treinamento não encontrado.</p>
          <Link href="/"><Button variant="primary" className="mt-4">Voltar ao painel</Button></Link>
        </div>
      </div>
    );
  }

  const d = DEVICES.find((x) => x.id === device)!;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-800 bg-ink-900 px-3">
        <Link href={`/editor?id=${course.id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={15} /> Voltar ao editor</Button>
        </Link>
        <span className="hidden truncate text-[13px] text-ink-400 md:block">Visualização do aluno · <span className="text-ink-100">{course.title}</span></span>
        <div className="mx-auto flex rounded-lg border border-ink-700 bg-ink-950 p-0.5" role="radiogroup" aria-label="Dispositivo">
          {DEVICES.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={device === x.id} onClick={() => setDevice(x.id)} title={x.label}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors",
                device === x.id ? "bg-ink-700 text-white" : "text-ink-400 hover:text-white")}>
              {x.icon}<span className="hidden sm:inline">{x.label}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setRun((r) => r + 1)} title="Reiniciar progresso e respostas">
          <RotateCcw size={15} /> <span className="hidden sm:inline">Reiniciar</span>
        </Button>
      </header>
      <div className={cn("flex-1 overflow-auto scroll-thin", device !== "desktop" && "bg-[radial-gradient(circle_at_1px_1px,#1d2027_1px,transparent_0)] [background-size:22px_22px] p-8")}>
        <div
          className={cn("relative mx-auto overflow-y-auto overflow-x-hidden scroll-thin",
            device === "desktop" ? "h-full w-full" : "rounded-[28px] border-[10px] border-ink-800 shadow-2xl shadow-black/60")}
          style={{
            ...(d.width ? { width: d.width + 20, height: d.height ?? undefined, maxHeight: "100%" } : {}),
            // altura visível do "dispositivo", usada pela barra lateral sticky do player
            ["--vh" as string]: d.height ? `min(${d.height - 20}px, calc(100vh - 140px))` : "calc(100vh - 56px)",
          }}
        >
          <CoursePlayer key={run} course={course} resolver={localAssetResolver} progress={progress} embedded startLessonId={run === 0 ? lessonId : null} />
        </div>
      </div>
    </div>
  );
}
