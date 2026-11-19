"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bold, Italic, Link2, List, ListOrdered, RemoveFormatting, Strikethrough, Underline, Unlink } from "lucide-react";
import { cn } from "@/ui/cn";

type Cmd = { cmd: string; icon: React.ReactNode; label: string; state?: string };

const COMMANDS: Cmd[] = [
  { cmd: "bold", icon: <Bold size={15} />, label: "Negrito (Ctrl+B)", state: "bold" },
  { cmd: "italic", icon: <Italic size={15} />, label: "Itálico (Ctrl+I)", state: "italic" },
  { cmd: "underline", icon: <Underline size={15} />, label: "Sublinhado (Ctrl+U)", state: "underline" },
  { cmd: "strikeThrough", icon: <Strikethrough size={15} />, label: "Tachado", state: "strikeThrough" },
  { cmd: "insertUnorderedList", icon: <List size={15} />, label: "Lista com marcadores", state: "insertUnorderedList" },
  { cmd: "insertOrderedList", icon: <ListOrdered size={15} />, label: "Lista numerada", state: "insertOrderedList" },
];

/**
 * Barra flutuante de formatação para qualquer área [data-rte] do canvas.
 * Aparece ao selecionar texto, sem modais ou painéis.
 */
export function RichTextToolbar() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [linkMode, setLinkMode] = useState(false);
  const [url, setUrl] = useState("");
  const savedRange = useRef<Range | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (barRef.current?.contains(document.activeElement)) return; // digitando o link
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setPos(null);
        setLinkMode(false);
        return;
      }
      const node = sel.anchorNode;
      const el = (node instanceof Element ? node : node?.parentElement)?.closest("[data-rte]");
      if (!el) {
        setPos(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      setPos({ top: Math.max(8, rect.top - 46), left: Math.min(window.innerWidth - 340, Math.max(8, rect.left + rect.width / 2 - 165)) });
      const st: Record<string, boolean> = {};
      for (const c of COMMANDS) if (c.state) st[c.cmd] = document.queryCommandState(c.state);
      st.link = !!(node instanceof Element ? node : node?.parentElement)?.closest("a");
      setActive(st);
    };
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  if (!pos) return null;

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    // Atualiza estados após o comando
    const st: Record<string, boolean> = {};
    for (const c of COMMANDS) if (c.state) st[c.cmd] = document.queryCommandState(c.state);
    setActive((a) => ({ ...a, ...st }));
  };

  const applyLink = () => {
    const sel = document.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    const v = url.trim();
    if (v) exec("createLink", /^(https?:|mailto:|tel:|#)/i.test(v) ? v : `https://${v}`);
    setLinkMode(false);
    setUrl("");
  };

  return createPortal(
    <div
      ref={barRef}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[250] flex items-center gap-0.5 rounded-xl border border-ink-700 bg-ink-900 p-1 text-ink-200 shadow-2xl shadow-black/50 animate-pop"
      onMouseDown={(e) => {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }}
      role="toolbar"
      aria-label="Formatação de texto"
    >
      {linkMode ? (
        <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
          <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…"
            onKeyDown={(e) => e.key === "Escape" && setLinkMode(false)}
            className="h-8 w-56 rounded-lg border border-ink-700 bg-ink-950 px-2.5 text-[13px] text-white outline-none focus:border-brand-500" />
          <button type="submit" className="h-8 rounded-lg bg-brand-500 px-3 text-[12px] font-semibold text-white">Aplicar</button>
        </form>
      ) : (
        <>
          {COMMANDS.map((c, i) => (
            <span key={c.cmd} className="contents">
              {i === 4 && <span className="mx-0.5 h-5 w-px bg-ink-700" />}
              <button type="button" aria-label={c.label} title={c.label} aria-pressed={!!active[c.cmd]} onClick={() => exec(c.cmd)}
                className={cn("grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-ink-750 hover:text-white", active[c.cmd] && "bg-brand-500/25 text-brand-200")}>
                {c.icon}
              </button>
            </span>
          ))}
          <span className="mx-0.5 h-5 w-px bg-ink-700" />
          {active.link ? (
            <button type="button" aria-label="Remover link" title="Remover link" onClick={() => exec("unlink")}
              className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/25 text-brand-200 hover:bg-ink-750"><Unlink size={15} /></button>
          ) : (
            <button type="button" aria-label="Inserir link" title="Inserir link" onClick={() => {
              const sel = document.getSelection();
              savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
              setLinkMode(true);
            }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink-750 hover:text-white"><Link2 size={15} /></button>
          )}
          <button type="button" aria-label="Limpar formatação" title="Limpar formatação" onClick={() => exec("removeFormat")}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ink-750 hover:text-white"><RemoveFormatting size={15} /></button>
        </>
      )}
    </div>,
    document.body,
  );
}
