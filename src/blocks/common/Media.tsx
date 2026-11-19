"use client";
import { useRef, useState } from "react";
import type { MediaRef } from "@/core/model/types";
import { useEditorServices, useMediaUrl, type RenderMode } from "../engine/context";

interface MediaImageProps {
  media: MediaRef | null;
  alt: string;
  mode: RenderMode;
  className?: string;
  /** Chamado após upload pelo placeholder (apenas no editor). */
  onUpload?: (ref: MediaRef) => void;
  placeholderLabel?: string;
  onClick?: () => void;
}

/** Imagem resolvida pelo MediaResolver. No editor, sem imagem, exibe um placeholder com upload. */
export function MediaImage({ media, alt, mode, className, onUpload, placeholderLabel, onClick }: MediaImageProps) {
  const url = useMediaUrl(media);
  if (url) return <img src={url} alt={alt} className={className} onClick={onClick} loading="lazy" draggable={false} />;
  if (mode === "edit") return <UploadPlaceholder accept="image/*" label={placeholderLabel ?? "Adicionar imagem"} onUpload={onUpload} className={className} />;
  if (media) return <div className={`cr-media-missing ${className ?? ""}`} aria-hidden />;
  return null;
}

export function UploadPlaceholder({ accept, label, onUpload, className }: {
  accept: string;
  label: string;
  onUpload?: (ref: MediaRef) => void;
  className?: string;
}) {
  const services = useEditorServices();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file || !services || !onUpload) return;
    setBusy(true);
    try {
      onUpload(await services.uploadMedia(file));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`cr-upload ${drag ? "is-drag" : ""} ${className ?? ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </svg>
      <span>{busy ? "Enviando…" : label}</span>
      {onUpload && services && (
        <button type="button" className="cr-upload-btn" onClick={() => input.current?.click()} disabled={busy}>
          Escolher arquivo
        </button>
      )}
      <small>ou arraste e solte aqui · também é possível usar uma URL no painel</small>
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}
