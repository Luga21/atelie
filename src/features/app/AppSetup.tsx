"use client";
import { useEffect } from "react";
import { withBase } from "@/core/env";

/**
 * Configuração global do app no navegador:
 *  - pede armazenamento persistente, para o navegador não apagar os treinamentos
 *    automaticamente quando o disco estiver cheio;
 *  - registra o service worker (somente em produção), que permite instalar o app e abri-lo offline.
 */
export function AppSetup() {
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => undefined);

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(withBase("/sw.js"), { scope: withBase("/") }).catch((e) => {
      console.warn("[app] Service worker não registrado:", e);
    });
  }, []);
  return null;
}

/** Estado do armazenamento, exibido no dashboard. */
export async function getStorageInfo(): Promise<{ persisted: boolean; usageMB: number | null }> {
  const persisted = (await navigator.storage?.persisted?.().catch(() => false)) ?? false;
  const est = await navigator.storage?.estimate?.().catch(() => null);
  return { persisted, usageMB: est?.usage != null ? Math.round((est.usage / 1024 / 1024) * 10) / 10 : null };
}
