"use client";
import { useState } from "react";
import { uid } from "@/core/model/ids";
import type { MediaRef } from "@/core/model/types";
import { EditableText, RichText } from "../../common/Editable";
import { MediaImage, UploadPlaceholder } from "../../common/Media";
import { useMediaUrl, type BlockViewProps } from "../../engine/context";
import type {
  ColumnsContent, ColumnsSettings, DividerContent, DividerSettings, HeadingContent, HeadingSettings, ImageContent,
  ImageSettings, ListContent, ListSettings, QuoteContent, QuoteSettings, TextContent, TextImageContent,
  TextImageSettings, TextSettings, VideoContent, VideoSettings,
} from "./definitions";

/** Atalho: cria um setter que grava um campo do conteúdo com chave de agrupamento do histórico. */
function useField<C, S>({ block, update }: BlockViewProps<C, S>) {
  return <K extends keyof C>(key: K) =>
    (value: C[K]) =>
      update?.((d) => {
        (d.content as C)[key] = value;
      }, `${block.id}:${String(key)}`);
}

/* ------------------------------------------------------------------ Texto */
export function TextView(props: BlockViewProps<TextContent, TextSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const s = block.settings;
  return (
    <div className={`cr-text cr-text--${s.variant}`} style={{ textAlign: s.align }}>
      <RichText html={block.content.html} editable={mode === "edit"} onChange={set("html")} placeholder="Comece a escrever…" />
    </div>
  );
}

/* ----------------------------------------------------------------- Título */
export function HeadingView(props: BlockViewProps<HeadingContent, HeadingSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const s = block.settings;
  const edit = mode === "edit";
  return (
    <header className={`cr-heading cr-heading--${s.size}`} style={{ textAlign: s.align }}>
      <EditableText as={s.size} className="cr-h" value={block.content.title} editable={edit} onChange={set("title")} placeholder="Título" />
      {s.accentLine && <span className="cr-accent-line" style={s.align === "center" ? { marginInline: "auto" } : undefined} />}
      {s.showSubtitle && (
        <EditableText as="p" className="cr-subtitle" value={block.content.subtitle} editable={edit} onChange={set("subtitle")} placeholder="Subtítulo" multiline />
      )}
    </header>
  );
}

/* ----------------------------------------------------------------- Imagem */
export function ImageView(props: BlockViewProps<ImageContent, ImageSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const s = block.settings;
  const [zoomed, setZoomed] = useState(false);
  const url = useMediaUrl(block.content.media);
  const canZoom = mode === "view" && s.zoom && !!url;
  return (
    <figure className={`cr-image cr-image--${s.size}`} data-align={s.align}>
      <MediaImage
        media={block.content.media}
        alt={block.content.alt}
        mode={mode}
        className={`cr-image-img ${s.rounded ? "is-rounded" : ""} ${canZoom ? "is-zoomable" : ""}`}
        onUpload={(m) => set("media")(m)}
        onClick={canZoom ? () => setZoomed(true) : undefined}
      />
      {(block.content.caption || mode === "edit") && (
        <EditableText as="figcaption" className="cr-caption" value={block.content.caption} editable={mode === "edit"} onChange={set("caption")} placeholder="Legenda (opcional)" />
      )}
      {zoomed && url && (
        <div className="cr-lightbox" role="dialog" aria-label="Imagem ampliada" onClick={() => setZoomed(false)}>
          <img src={url} alt={block.content.alt} />
          <button type="button" className="cr-lightbox-close" aria-label="Fechar">×</button>
        </div>
      )}
    </figure>
  );
}

/* ------------------------------------------------------- Texto com imagem */
export function TextImageView(props: BlockViewProps<TextImageContent, TextImageSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const s = block.settings;
  const edit = mode === "edit";
  return (
    <div className="cr-textimage" data-side={s.imageSide} data-ratio={s.imageRatio} data-valign={s.verticalAlign}>
      <div className="cr-textimage-media">
        <MediaImage media={block.content.media} alt={block.content.alt} mode={mode} className="cr-textimage-img" onUpload={(m) => set("media")(m)} />
      </div>
      <div className="cr-textimage-body">
        {s.showTitle && <EditableText as="h3" className="cr-h" value={block.content.title} editable={edit} onChange={set("title")} placeholder="Título" />}
        <RichText html={block.content.html} editable={edit} onChange={set("html")} placeholder="Texto…" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Vídeo */
export function parseVideoUrl(url: string): { kind: "embed" | "file"; src: string } | null {
  const u = url.trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return { kind: "embed", src: `https://player.vimeo.com/video/${vm[1]}` };
  return { kind: "file", src: u };
}

export function VideoView(props: BlockViewProps<VideoContent, VideoSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const src = block.content.source;
  const assetUrl = useMediaUrl(src?.kind === "asset" ? src : null);
  const parsed = src?.kind === "url" ? parseVideoUrl(src.url) : assetUrl ? { kind: "file" as const, src: assetUrl } : null;
  const ratio = block.settings.aspect.replace(":", " / ");
  return (
    <figure className="cr-video">
      {parsed ? (
        <div className="cr-video-frame" style={{ aspectRatio: ratio }}>
          {parsed.kind === "embed" ? (
            <iframe src={parsed.src} title={block.content.caption || "Vídeo"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <video src={parsed.src} controls preload="metadata" />
          )}
          {mode === "edit" && <div className="cr-video-shield" />}
        </div>
      ) : mode === "edit" ? (
        <UploadPlaceholder accept="video/*" label="Adicionar vídeo" onUpload={(m: MediaRef) => set("source")(m)} className="cr-video-empty" />
      ) : null}
      {(block.content.caption || mode === "edit") && (
        <EditableText as="figcaption" className="cr-caption" value={block.content.caption} editable={mode === "edit"} onChange={set("caption")} placeholder="Legenda (opcional)" />
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ Lista */
export function ListView(props: BlockViewProps<ListContent, ListSettings>) {
  const { block, mode, update } = props;
  const set = useField(props);
  const s = block.settings;
  const edit = mode === "edit";
  const Tag = s.style === "number" ? "ol" : "ul";
  return (
    <div className="cr-list">
      {s.showTitle && <EditableText as="h3" className="cr-h" value={block.content.title} editable={edit} onChange={set("title")} placeholder="Título da lista" />}
      <Tag className={`cr-list-items cr-list--${s.style}`} data-cols={s.columns}>
        {block.content.items.map((item, i) => (
          <li key={item.id}>
            <span className="cr-list-marker" aria-hidden>
              {s.style === "number" ? i + 1 : s.style === "check" ? "✓" : ""}
            </span>
            <EditableText
              value={item.text}
              editable={edit}
              placeholder="Item"
              onChange={(v) => update?.((d) => { d.content.items[i].text = v; }, `${block.id}:item:${item.id}`)}
            />
          </li>
        ))}
      </Tag>
      {edit && (
        <button type="button" className="cr-inline-add" onClick={() => update?.((d) => { d.content.items.push({ id: uid("i"), text: "Novo item" }); })}>
          + Adicionar item
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Citação */
export function QuoteView(props: BlockViewProps<QuoteContent, QuoteSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const edit = mode === "edit";
  return (
    <blockquote className={`cr-quote cr-quote--${block.settings.style}`}>
      <span className="cr-quote-mark" aria-hidden>“</span>
      <EditableText as="p" className="cr-quote-text" value={block.content.text} editable={edit} onChange={set("text")} placeholder="Citação" multiline />
      <footer>
        <EditableText as="strong" value={block.content.author} editable={edit} onChange={set("author")} placeholder="Autor" />
        {(block.content.role || edit) && <EditableText as="span" value={block.content.role} editable={edit} onChange={set("role")} placeholder="Cargo ou contexto" />}
      </footer>
    </blockquote>
  );
}

/* ---------------------------------------------------------------- Divisor */
export function DividerView(props: BlockViewProps<DividerContent, DividerSettings>) {
  const { block, mode } = props;
  const set = useField(props);
  const showLabel = block.settings.style !== "space" && (block.content.label || mode === "edit");
  return (
    <div className={`cr-divider cr-divider--${block.settings.style}`} role="separator">
      {block.settings.style === "dots" ? <span className="cr-dots">• • •</span> : <span className="cr-divider-line" />}
      {showLabel && (
        <EditableText as="span" className="cr-divider-label" value={block.content.label} editable={mode === "edit"} onChange={set("label")} placeholder="Rótulo opcional" />
      )}
      {block.settings.style === "line" && showLabel && <span className="cr-divider-line" />}
    </div>
  );
}

/* ---------------------------------------------------------------- Colunas */
export function ColumnsView(props: BlockViewProps<ColumnsContent, ColumnsSettings>) {
  const { block, mode, update } = props;
  const s = block.settings;
  const edit = mode === "edit";
  const cols = block.content.columns.slice(0, s.count);
  return (
    <div className={`cr-columns ${s.card ? "is-card" : ""}`} data-count={s.count}>
      {cols.map((c, i) => (
        <div key={c.id} className="cr-column">
          {s.showImages && (
            <MediaImage
              media={c.media}
              alt={c.title}
              mode={mode}
              className="cr-column-img"
              onUpload={(m) => update?.((d) => { d.content.columns[i].media = m; })}
            />
          )}
          <EditableText as="h4" className="cr-h" value={c.title} editable={edit} placeholder="Título"
            onChange={(v) => update?.((d) => { d.content.columns[i].title = v; }, `${block.id}:col:${c.id}:t`)} />
          <RichText html={c.html} editable={edit} placeholder="Conteúdo…"
            onChange={(v) => update?.((d) => { d.content.columns[i].html = v; }, `${block.id}:col:${c.id}:h`)} />
        </div>
      ))}
    </div>
  );
}
