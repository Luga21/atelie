/**
 * Caminho base da publicação (ex.: "/atelie" no GitHub Pages; vazio localmente).
 * Necessário para URLs montadas manualmente (fetch, service worker, manifesto);
 * `next/link` e `router.push` já aplicam o basePath sozinhos.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

export const withBase = (path: string) => `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
