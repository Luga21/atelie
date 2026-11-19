import type { MediaResolver } from "@/blocks/engine/context";
import { assetRepository } from "./repository";

/**
 * Resolve assets do IndexedDB em object URLs, com cache por id.
 * Compartilhado por editor e preview (um único cache por aba).
 */
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

export const localAssetResolver: MediaResolver = {
  peek: (id) => cache.get(id) ?? null,
  load(id) {
    const hit = cache.get(id);
    if (hit) return Promise.resolve(hit);
    let p = pending.get(id);
    if (!p) {
      p = assetRepository
        .get(id)
        .then((a) => {
          if (!a) return null;
          const url = URL.createObjectURL(a.blob);
          cache.set(id, url);
          return url;
        })
        .catch(() => null)
        .finally(() => pending.delete(id));
      pending.set(id, p);
    }
    return p;
  },
};

/** Registra no cache um blob recém-enviado, para exibição imediata. */
export function primeAsset(id: string, blob: Blob) {
  if (!cache.has(id)) cache.set(id, URL.createObjectURL(blob));
}
