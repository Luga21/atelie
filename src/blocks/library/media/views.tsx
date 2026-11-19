"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { uid } from "@/core/model/ids";
import type { MediaRef } from "@/core/model/types";
import { EditableText } from "../../common/Editable";
import { Lightbox } from "../../common/Lightbox";
import { MediaImage, UploadPlaceholder } from "../../common/Media";
import { MediaResolverContext, useEditorServices, useMediaUrl, type BlockViewProps } from "../../engine/context";
import type { AudioContent, AudioSettings, GalleryContent, GallerySettings } from "./definitions";

/** Resolve várias referências de mídia de uma vez (para lightbox/carrossel). */
function useMediaUrls(refs: (MediaRef | null)[]): (string | null)[] {
  const resolver = useContext(MediaResolverContext);
  const key = refs.map((r) => (r ? (r.kind === "url" ? r.url : r.id) : "")).join("|");
  const [, force] = useState(0);
  useEffect(() => {
    let alive = true;
    refs.forEach((r) => {
      if (r?.kind === "asset" && !resolver.peek(r.id)) resolver.load(r.id).then(() => alive && force((n) => n + 1));
    });
    return () => {
      alive = false;
    };
  }, [key, resolver]); // eslint-disable-line react-hooks/exhaustive-deps
  return refs.map((r) => (!r ? null : r.kind === "url" ? r.url || null : resolver.peek(r.id)));
}

/* ---------------------------------------------------------------- Galeria */
export function GalleryView({ block, mode, update }: BlockViewProps<GalleryContent, GallerySettings>) {
  const s = block.settings;
  const edit = mode === "edit";
  const images = block.content.images;
  const urls = useMediaUrls(images.map((i) => i.media));
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const services = useEditorServices();
  const multi = useRef<HTMLInputElement>(null);

  const viewable = images.map((img, i) => ({ img, url: urls[i] })).filter((x) => x.url);
  const lightboxItems = viewable.map((x) => ({ url: x.url!, alt: x.img.alt, caption: x.img.caption }));

  if (edit) {
    return (
      <div className="cr-gallery" data-layout="grid" data-cols={s.columns} data-aspect={s.aspect}>
        {images.map((img, i) => (
          <figure key={img.id} className="cr-gallery-item">
            <MediaImage media={img.media} alt={img.alt} mode="edit" className="cr-gallery-img" placeholderLabel="Imagem"
              onUpload={(m) => update?.((d) => { d.content.images[i].media = m; })} />
            {s.showCaptions && (
              <EditableText as="figcaption" className="cr-caption" value={img.caption} editable placeholder="Legenda"
                onChange={(v) => update?.((d) => { d.content.images[i].caption = v; }, `${block.id}:cap:${img.id}`)} />
            )}
          </figure>
        ))}
        <div className="cr-gallery-actions">
          <button type="button" className="cr-inline-add" onClick={() => multi.current?.click()} disabled={!services}>+ Adicionar imagens</button>
          <input ref={multi} type="file" accept="image/*" multiple hidden onChange={async (e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (!services) return;
            const refs: MediaRef[] = [];
            for (const f of files) refs.push(await services.uploadMedia(f));
            update?.((d) => {
              // Preenche espaços vazios antes de criar novos itens.
              for (const ref of refs) {
                const empty = d.content.images.find((x) => !x.media);
                if (empty) empty.media = ref;
                else d.content.images.push({ id: uid("g"), media: ref, alt: "", caption: "" });
              }
            });
          }} />
        </div>
      </div>
    );
  }

  if (viewable.length === 0) return null;

  if (s.layout === "carousel") {
    const idx = Math.min(slide, viewable.length - 1);
    const cur = viewable[idx];
    return (
      <div className="cr-gallery" data-layout="carousel" data-aspect={s.aspect}>
        <div className="cr-carousel">
          <button type="button" className="cr-carousel-stage" onClick={() => setOpen(idx)} aria-label="Ampliar imagem">
            <img key={cur.img.id} src={cur.url!} alt={cur.img.alt} className="cr-gallery-img" />
          </button>
          {viewable.length > 1 && (
            <>
              <button type="button" className="cr-carousel-nav is-prev" aria-label="Imagem anterior" onClick={() => setSlide((idx - 1 + viewable.length) % viewable.length)}>‹</button>
              <button type="button" className="cr-carousel-nav is-next" aria-label="Próxima imagem" onClick={() => setSlide((idx + 1) % viewable.length)}>›</button>
            </>
          )}
        </div>
        {s.showCaptions && cur.img.caption && <p className="cr-caption">{cur.img.caption}</p>}
        {viewable.length > 1 && (
          <div className="cr-dots" role="tablist" aria-label="Imagens">
            {viewable.map((x, i) => (
              <button key={x.img.id} type="button" role="tab" aria-selected={i === idx} aria-label={`Imagem ${i + 1}`}
                className={i === idx ? "is-active" : ""} onClick={() => setSlide(i)} />
            ))}
          </div>
        )}
        {open !== null && <Lightbox items={lightboxItems} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
      </div>
    );
  }

  return (
    <div className="cr-gallery" data-layout="grid" data-cols={s.columns} data-aspect={s.aspect}>
      {viewable.map((x, i) => (
        <figure key={x.img.id} className="cr-gallery-item">
          <button type="button" className="cr-gallery-btn" onClick={() => setOpen(i)} aria-label={`Ampliar ${x.img.alt || `imagem ${i + 1}`}`}>
            <img src={x.url!} alt={x.img.alt} className="cr-gallery-img" loading="lazy" />
          </button>
          {s.showCaptions && x.img.caption && <figcaption className="cr-caption">{x.img.caption}</figcaption>}
        </figure>
      ))}
      {open !== null && <Lightbox items={lightboxItems} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Áudio */
export function AudioView({ block, mode, update }: BlockViewProps<AudioContent, AudioSettings>) {
  const c = block.content;
  const edit = mode === "edit";
  const url = useMediaUrl(c.source);
  const set = <K extends keyof AudioContent>(k: K) => (v: AudioContent[K]) => update?.((d) => { d.content[k] = v; }, `${block.id}:${k}`);

  return (
    <div className="cr-audio">
      <div className="cr-audio-head">
        <span className="cr-audio-icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 14h3l4 4V6L6 10H3z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
        </span>
        <div className="cr-audio-text">
          <EditableText as="h4" className="cr-h" value={c.title} editable={edit} placeholder="Título do áudio" onChange={set("title")} />
          {(c.description || edit) && <EditableText as="p" className="cr-audio-desc" value={c.description} editable={edit} placeholder="Descrição (opcional)" onChange={set("description")} />}
        </div>
      </div>
      {url ? (
        <audio className="cr-audio-player" src={url} controls preload="metadata" />
      ) : edit ? (
        <UploadPlaceholder accept="audio/*" label="Adicionar áudio (MP3, WAV, M4A…)" onUpload={(m) => set("source")(m)} className="cr-audio-empty" />
      ) : null}
      {block.settings.showTranscript && c.transcript.trim() && (
        <details className="cr-audio-transcript" open={edit}>
          <summary>Transcrição</summary>
          <p>{c.transcript}</p>
        </details>
      )}
    </div>
  );
}
