/** Gera identificadores curtos e únicos, com fallback para ambientes sem crypto.randomUUID. */
export function uid(prefix = ""): string {
  let raw: string;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  } else {
    raw = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }
  return prefix ? `${prefix}_${raw}` : raw;
}
