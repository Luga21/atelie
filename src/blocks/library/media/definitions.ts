import type { MediaRef } from "@/core/model/types";
import { uid } from "@/core/model/ids";
import type { BlockDefinition } from "../../engine/definition";

/* ---------------------------------------------------------------- Galeria */
export interface GalleryImage { id: string; media: MediaRef | null; alt: string; caption: string }
export interface GalleryContent { images: GalleryImage[] }
export interface GallerySettings { layout: "grid" | "carousel"; columns: 2 | 3 | 4; aspect: "square" | "landscape" | "portrait"; showCaptions: boolean }
export const galleryBlock: BlockDefinition<GalleryContent, GallerySettings> = {
  type: "gallery",
  version: 1,
  category: "content",
  name: "Galeria",
  description: "Várias imagens em grade ou carrossel, com ampliação.",
  keywords: ["galeria", "fotos", "imagens", "carrossel", "slides"],
  create: () => ({
    content: {
      images: [1, 2, 3].map(() => ({ id: uid("g"), media: null, alt: "", caption: "" })),
    },
    settings: { layout: "grid", columns: 3, aspect: "landscape", showCaptions: true },
  }),
};

/* ------------------------------------------------------------------ Áudio */
export interface AudioContent { source: MediaRef | null; title: string; description: string; transcript: string }
export interface AudioSettings { showTranscript: boolean }
export const audioBlock: BlockDefinition<AudioContent, AudioSettings> = {
  type: "audio",
  version: 1,
  category: "content",
  name: "Áudio",
  description: "Podcast, narração ou trecho de áudio, com transcrição.",
  keywords: ["áudio", "podcast", "narração", "som", "mp3"],
  create: () => ({
    content: { source: null, title: "Ouça este trecho", description: "", transcript: "" },
    settings: { showTranscript: true },
  }),
};
