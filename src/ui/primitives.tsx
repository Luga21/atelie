"use client";
/** Primitivas de interface do app (estilo próprio, inspiradas na abordagem do shadcn/ui). */
import {
  forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/* ----------------------------------------------------------------- Button */
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_1px_0_rgb(255_255_255/0.15)_inset]",
  secondary: "bg-ink-800 text-ink-100 hover:bg-ink-750 border border-ink-700",
  ghost: "text-ink-200 hover:bg-ink-800 hover:text-white",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  function Button({ variant = "secondary", size = "md", className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors select-none",
          "disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2",
          size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-sm",
          VARIANTS[variant],
          className,
        )}
        {...rest}
      />
    );
  },
);

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean; size?: "sm" | "md" }>(
  function IconButton({ label, active, size = "md", className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "inline-grid place-items-center rounded-lg transition-colors text-ink-300 hover:text-white hover:bg-ink-800",
          "disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-brand-400",
          size === "sm" ? "h-7 w-7" : "h-9 w-9",
          active && "bg-ink-800 text-white",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

/* ------------------------------------------------------------------ Inputs */
const fieldBase =
  "w-full rounded-lg bg-ink-900 border border-ink-700 text-[13px] text-ink-100 placeholder:text-ink-500 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-9 px-3", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, "px-3 py-2 min-h-[72px] resize-y leading-relaxed", className)} {...rest} />;
});

export function Select<T extends string | number>({ value, onChange, options, className }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <select
      className={cn(fieldBase, "h-9 px-2.5 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237f8494%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_10px_center] pr-8", className)}
      value={String(value)}
      onChange={(e) => {
        const opt = options.find((o) => String(o.value) === e.target.value);
        if (opt) onChange(opt.value);
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
      ))}
    </select>
  );
}

/** Controle segmentado (S/M/L, alinhamentos etc.). */
export function Segmented<T extends string | number>({ value, onChange, options, className }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-lg bg-ink-900 border border-ink-700 p-0.5 gap-0.5", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 h-7 px-2 rounded-md text-[12px] font-medium inline-flex items-center justify-center transition-colors whitespace-nowrap",
            o.value === value ? "bg-ink-700 text-white shadow-sm" : "text-ink-400 hover:text-ink-100",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-brand-500" : "bg-ink-600")}
    >
      <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
    </button>
  );
}

/* --------------------------------------------------------- Menu suspenso */
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
  separator?: boolean;
}

/** Menu com posicionamento fixo (portal), fecha ao clicar fora ou com Esc. */
export function Menu({ trigger, items, align = "end", width = 220 }: {
  trigger: (props: { onClick: (e: React.MouseEvent) => void; "aria-expanded": boolean }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  width?: number;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setPos(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPos(null);
    const t = setTimeout(() => document.addEventListener("mousedown", close));
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", () => setPos(null), { once: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [pos]);

  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = align === "end" ? r.right - width : r.left;
    const estH = items.length * 34 + 12;
    const top = r.bottom + 6 + estH > window.innerHeight ? Math.max(8, r.top - estH - 6) : r.bottom + 6;
    setPos({ top, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
  };

  return (
    <>
      {trigger({ onClick: open, "aria-expanded": !!pos })}
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left, width }}
            className="fixed z-[200] rounded-xl border border-ink-700 bg-ink-850/98 backdrop-blur p-1.5 shadow-2xl shadow-black/50 animate-pop"
          >
            {items.map((it, i) =>
              it.separator ? (
                <div key={i} className="my-1 h-px bg-ink-700" />
              ) : (
                <button
                  key={i}
                  role="menuitem"
                  type="button"
                  disabled={it.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPos(null);
                    it.onSelect?.();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 h-8 text-[13px] text-left transition-colors disabled:opacity-40",
                    it.danger ? "text-red-300 hover:bg-red-500/15" : "text-ink-100 hover:bg-ink-750",
                  )}
                >
                  {it.icon && <span className="text-ink-400 [&>svg]:size-4">{it.icon}</span>}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.hint && <span className="text-[11px] text-ink-500">{it.hint}</span>}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

/* ------------------------------------------------------------------ Dialog */
export function Dialog({ open, onClose, title, description, children, width = 440 }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] grid place-items-center bg-black/60 backdrop-blur-[2px] p-4 animate-fade" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width, maxWidth: "100%" }}
        className="rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-2xl shadow-black/60 animate-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-[17px] font-semibold text-white">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-ink-400 leading-relaxed">{description}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------- Toast */
type ToastItem = { id: number; message: string; tone: "default" | "error" | "success" };
let toastId = 0;
const listeners = new Set<(t: ToastItem[]) => void>();
let toasts: ToastItem[] = [];

export function toast(message: string, tone: ToastItem["tone"] = "default") {
  const t = { id: ++toastId, message, tone };
  toasts = [...toasts, t];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    listeners.forEach((l) => l(toasts));
  }, 3800);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-xl px-4 py-2.5 text-sm shadow-xl shadow-black/40 border animate-pop",
            t.tone === "error" ? "bg-red-950 border-red-800 text-red-100" : t.tone === "success" ? "bg-ink-800 border-emerald-700/60 text-emerald-100" : "bg-ink-800 border-ink-700 text-ink-100",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Misc */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 text-[10px] font-medium text-ink-400">{children}</kbd>;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-white", className)}>
      <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9a85ff" />
            <stop offset="1" stopColor="#5536d6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#lg)" />
        <path d="M9 22.5 15.2 9h1.6L23 22.5h-3.1l-1.3-3H13.4l-1.3 3Zm5.4-5.6h3.2L16 13.1Z" fill="#fff" />
      </svg>
      Ateliê
    </span>
  );
}
