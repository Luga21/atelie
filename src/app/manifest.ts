import type { MetadataRoute } from "next";
import { withBase } from "@/core/env";

export const dynamic = "force-static";

/** Manifesto do app instalável (PWA): ícone, nome e janela própria ao instalar pelo navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ateliê — autoria de treinamentos",
    short_name: "Ateliê",
    description: "Crie treinamentos e-learning interativos com um editor visual baseado em blocos.",
    lang: "pt-BR",
    start_url: withBase("/"),
    scope: withBase("/"),
    display: "standalone",
    background_color: "#0a0b0e",
    theme_color: "#101116",
    icons: [
      { src: withBase("/icons/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBase("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withBase("/icons/icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
