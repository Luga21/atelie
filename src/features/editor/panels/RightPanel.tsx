"use client";
import { useEditor } from "../state/editorStore";
import { BlockPanel } from "./BlockPanel";
import { CoursePanel } from "./CoursePanel";
import { ThemePanel } from "./ThemePanel";

/** Painel contextual: mostra apenas as configurações relevantes ao que está selecionado. */
export function RightPanel() {
  const panel = useEditor((s) => s.panel);
  const selectedBlockId = useEditor((s) => s.selectedBlockId);
  if (!panel || (panel === "block" && !selectedBlockId)) return null;
  return (
    <aside
      className="flex w-[320px] shrink-0 flex-col border-l border-ink-800 bg-ink-900 animate-slide max-[1100px]:absolute max-[1100px]:inset-y-0 max-[1100px]:right-0 max-[1100px]:z-40 max-[1100px]:shadow-2xl max-[1100px]:shadow-black/60"
      aria-label="Propriedades"
    >
      {panel === "block" && selectedBlockId && <BlockPanel blockId={selectedBlockId} />}
      {panel === "theme" && <ThemePanel />}
      {panel === "course" && <CoursePanel />}
    </aside>
  );
}

export function PanelHeader({ icon, title, subtitle, actions, onClose }: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-ink-800 px-4 py-3.5">
      {icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-800 [&>svg]:size-4">{icon}</span>}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[14px] font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11.5px] leading-snug text-ink-400">{subtitle}</p>}
      </div>
      {actions}
      <button type="button" onClick={onClose} aria-label="Fechar painel" className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-ink-800 hover:text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
