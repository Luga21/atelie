"use client";
/**
 * Primitivas de edição inline. Em modo "view" renderizam conteúdo estático;
 * em modo "edit" viram áreas contentEditable não controladas (o DOM só é
 * sobrescrito quando o valor muda por fora, ex.: desfazer/refazer).
 */
import { createElement, useLayoutEffect, useRef, type ElementType, type KeyboardEvent } from "react";
import { sanitizeHtml } from "@/core/richtext/sanitize";

interface EditableTextProps {
  value: string;
  onChange?: (value: string) => void;
  editable: boolean;
  as?: ElementType;
  className?: string;
  placeholder?: string;
  /** Permite quebras de linha (Shift+Enter / Enter). */
  multiline?: boolean;
}

function insertPlainText(e: React.ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
}

/** Texto simples editável (títulos, rótulos, opções). */
export function EditableText({ value, onChange, editable, as = "span", className, placeholder, multiline }: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const lastEmitted = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !editable) return;
    if (value !== lastEmitted.current && el.innerText !== value) el.innerText = value;
    lastEmitted.current = value;
  }, [value, editable]);

  if (!editable) {
    return createElement(as, { className }, value);
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
  };

  return createElement(as, {
    ref,
    className: `${className ?? ""} cr-editable`,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: true,
    "data-placeholder": placeholder,
    onKeyDown,
    onPaste: insertPlainText,
    onInput: (e: React.FormEvent<HTMLElement>) => {
      const v = (e.currentTarget.innerText ?? "").replace(/\n$/, "");
      lastEmitted.current = v;
      onChange?.(v);
    },
  });
}

interface RichTextProps {
  html: string;
  onChange?: (html: string) => void;
  editable: boolean;
  className?: string;
  placeholder?: string;
}

/** Texto rico editável. A barra de formatação flutuante é do editor e atua em [data-rte]. */
export function RichText({ html, onChange, editable, className, placeholder }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !editable) return;
    if (html !== lastEmitted.current) el.innerHTML = sanitizeHtml(html);
    lastEmitted.current = html;
  }, [html, editable]);

  if (!editable) {
    return <div className={`cr-rich ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
  }

  return (
    <div
      ref={ref}
      className={`cr-rich cr-editable ${className ?? ""}`}
      contentEditable
      suppressContentEditableWarning
      data-rte=""
      data-placeholder={placeholder}
      onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
      onPaste={(e) => {
        e.preventDefault();
        const rich = e.clipboardData.getData("text/html");
        const plain = e.clipboardData.getData("text/plain");
        if (rich) document.execCommand("insertHTML", false, sanitizeHtml(rich));
        else document.execCommand("insertText", false, plain);
      }}
      onInput={(e) => {
        const v = sanitizeHtml(e.currentTarget.innerHTML);
        lastEmitted.current = v;
        onChange?.(v);
      }}
    />
  );
}
