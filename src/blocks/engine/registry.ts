import type { Block } from "@/core/model/types";
import { uid } from "@/core/model/ids";
import { DEFAULT_BLOCK_STYLE, type BlockDefinition } from "./definition";

const definitions = new Map<string, BlockDefinition>();

/** Registra um tipo de bloco. Chamado uma vez por tipo em blocks/definitions.ts. */
export function registerBlock(def: BlockDefinition): void {
  if (definitions.has(def.type)) throw new Error(`Bloco "${def.type}" já registrado`);
  definitions.set(def.type, def);
}

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return definitions.get(type);
}

export function listBlockDefinitions(): BlockDefinition[] {
  return [...definitions.values()];
}

/** Cria uma nova instância de bloco com os valores padrão da definição. */
export function createBlock(type: string): Block {
  const def = definitions.get(type);
  if (!def) throw new Error(`Tipo de bloco desconhecido: ${type}`);
  const data = def.create();
  return {
    id: uid("b"),
    type,
    version: def.version,
    content: data.content,
    settings: data.settings,
    style: { ...DEFAULT_BLOCK_STYLE, ...data.style },
  };
}

/** Cópia profunda com novo id (o conteúdo não guarda referências cruzadas, então é seguro). */
export function cloneBlock(block: Block): Block {
  // JSON (e não structuredClone) para também funcionar com rascunhos (Proxy) do Immer.
  return { ...(JSON.parse(JSON.stringify(block)) as Block), id: uid("b") };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Completa chaves ausentes de `target` com os valores de `defaults` (recursivo apenas em objetos). */
function fillDefaults<T>(target: unknown, defaults: T): T {
  if (!isPlainObject(target) || !isPlainObject(defaults)) return (target ?? defaults) as T;
  const out: Record<string, unknown> = { ...target };
  for (const [k, dv] of Object.entries(defaults)) {
    if (!(k in out) || out[k] === undefined) out[k] = structuredClone(dv);
    else if (isPlainObject(dv) && isPlainObject(out[k])) out[k] = fillDefaults(out[k], dv);
  }
  return out as T;
}

/**
 * Normaliza um bloco vindo do armazenamento/importação:
 * aplica migrações de versão e completa configurações novas com os padrões.
 * Assim, evoluir um componente não quebra treinamentos já criados.
 * Tipos desconhecidos são preservados intactos (o renderizador mostra um aviso).
 */
export function normalizeBlock(raw: Block): Block {
  const def = definitions.get(raw.type);
  const style = fillDefaults(raw.style, DEFAULT_BLOCK_STYLE);
  if (!def) return { ...raw, style };
  let data = { content: raw.content, settings: raw.settings };
  const from = typeof raw.version === "number" ? raw.version : 1;
  if (from < def.version && def.migrate) data = def.migrate(data, from);
  const defaults = def.create();
  return {
    id: raw.id || uid("b"),
    type: raw.type,
    version: def.version,
    content: fillDefaults(data.content, defaults.content),
    settings: fillDefaults(data.settings, defaults.settings),
    style,
  };
}
