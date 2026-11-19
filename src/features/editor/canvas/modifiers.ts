import type { Modifier } from "@dnd-kit/core";

/** Restringe o arraste ao eixo vertical (evita dependência extra de @dnd-kit/modifiers). */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
