"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Download, Eye, Loader2, Palette, Redo2, Settings2, Undo2 } from "lucide-react";
import { EXPORT_FORMATS } from "@/export/formats";
import { STATUS_LABEL } from "@/core/model/types";
import { cn } from "@/ui/cn";
import { relativeTime } from "@/ui/format";
import { Button, IconButton, Menu, toast } from "@/ui/primitives";
import { useEditor } from "./state/editorStore";

function SaveIndicator() {
  const status = useEditor((s) => s.saveStatus);
  const lastSavedAt = useEditor((s) => s.lastSavedAt);
  const error = useEditor((s) => s.saveError);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const content =
    status === "saving" ? (
      <><Loader2 size={13} className="animate-spin" /> Salvando…</>
    ) : status === "error" ? (
      <><AlertCircle size={13} className="text-red-400" /> Erro ao salvar</>
    ) : status === "idle" ? (
      <><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Alterações pendentes</>
    ) : (
      <><Check size={13} className="text-emerald-400" /> Salvo {lastSavedAt ? relativeTime(lastSavedAt) : ""}</>
    );
  return (
    <span className="hidden items-center gap-1.5 whitespace-nowrap text-[12px] text-ink-400 lg:inline-flex" title={error ?? "Salvamento automático neste navegador"} aria-live="polite">
      {content}
    </span>
  );
}

export function TopBar() {
  const course = useEditor((s) => s.course)!;
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const panel = useEditor((s) => s.panel);
  const selection = useEditor((s) => s.selection);
  const { apply, undo, redo, setPanel } = useEditor.getState();
  const [title, setTitle] = useState(course.title);
  const [exporting, setExporting] = useState(false);

  useEffect(() => setTitle(course.title), [course.title]);

  const previewHref = `/preview?id=${course.id}${selection.kind === "lesson" ? `&lesson=${selection.lessonId}` : ""}`;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ink-800 bg-ink-900 px-2.5">
      <Link href="/" className="inline-grid h-9 w-9 place-items-center rounded-lg text-ink-300 hover:bg-ink-800 hover:text-white" aria-label="Voltar ao painel" title="Voltar ao painel">
        <ArrowLeft size={18} />
      </Link>
      <div className="h-5 w-px bg-ink-700" />
      <div className="flex min-w-0 items-center gap-2 pl-1">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            apply((d) => { d.title = e.target.value; }, "course:title");
          }}
          onBlur={() => {
            if (!title.trim()) apply((d) => { d.title = "Treinamento sem título"; });
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Título do treinamento"
          className="h-8 min-w-0 max-w-[340px] rounded-md bg-transparent px-2 text-[14px] font-semibold text-white outline-none hover:bg-ink-800 focus:bg-ink-800 focus:ring-2 focus:ring-brand-500/40"
          style={{ width: `${Math.max(8, title.length + 2)}ch` }}
        />
        <span className="hidden whitespace-nowrap rounded-full bg-ink-800 px-2 py-0.5 text-[11px] font-medium text-ink-300 md:inline">{STATUS_LABEL[course.status]}</span>
        <SaveIndicator />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Desfazer (Ctrl+Z)" disabled={!canUndo} onClick={undo}><Undo2 size={17} /></IconButton>
        <IconButton label="Refazer (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}><Redo2 size={17} /></IconButton>
        <div className="mx-1.5 h-5 w-px bg-ink-700" />
        <Button variant="ghost" size="sm" className={cn(panel === "theme" && "bg-ink-800 text-white")} onClick={() => setPanel(panel === "theme" ? null : "theme")}>
          <Palette size={15} /> <span className="hidden sm:inline">Tema</span>
        </Button>
        <Button variant="ghost" size="sm" className={cn(panel === "course" && "bg-ink-800 text-white")} onClick={() => setPanel(panel === "course" ? null : "course")}>
          <Settings2 size={15} /> <span className="hidden sm:inline">Treinamento</span>
        </Button>
        <Link href={previewHref}>
          <Button variant="secondary" size="sm"><Eye size={15} /> <span className="hidden sm:inline">Visualizar</span></Button>
        </Link>
        <Menu
          width={300}
          trigger={(p) => (
            <Button variant="primary" size="sm" disabled={exporting} {...p}>
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Exportar <ChevronDown size={14} />
            </Button>
          )}
          items={EXPORT_FORMATS.map((f) => ({
            label: f.label,
            hint: f.available ? undefined : "Em breve",
            disabled: !f.available,
            onSelect: async () => {
              if (!f.run) return;
              setExporting(true);
              try {
                await f.run(useEditor.getState().course!);
                toast(`Exportação concluída: ${f.label}`, "success");
              } catch (e) {
                toast((e as Error).message, "error");
              } finally {
                setExporting(false);
              }
            },
          }))}
        />
      </div>
    </header>
  );
}
