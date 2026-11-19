"use client";
import { useEffect } from "react";

export interface LightboxItem { url: string; alt: string; caption?: string }

/** Visualizador de imagens ampliadas com navegação por setas e teclado. */
export function Lightbox({ items, index, onIndex, onClose }: {
  items: LightboxItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && items.length > 1) onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft" && items.length > 1) onIndex((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);
  if (!item) return null;
  return (
    <div className="cr-lightbox" role="dialog" aria-modal="true" aria-label="Imagem ampliada" onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()} className="cr-lightbox-figure">
        <img src={item.url} alt={item.alt} />
        {(item.caption || items.length > 1) && (
          <figcaption>
            {item.caption}
            {items.length > 1 && <span className="cr-lightbox-count">{index + 1} / {items.length}</span>}
          </figcaption>
        )}
      </figure>
      {items.length > 1 && (
        <>
          <button type="button" className="cr-lightbox-nav is-prev" aria-label="Imagem anterior"
            onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }}>‹</button>
          <button type="button" className="cr-lightbox-nav is-next" aria-label="Próxima imagem"
            onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }}>›</button>
        </>
      )}
      <button type="button" className="cr-lightbox-close" aria-label="Fechar" onClick={onClose}>×</button>
    </div>
  );
}
