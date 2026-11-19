/**
 * Registro central dos tipos de bloco (parte pura).
 * Para adicionar um bloco novo: crie a definição, registre aqui, adicione a View em
 * blocks/views.ts e o kit de edição em blocks/editorKit.tsx. Veja docs/ARQUITETURA.md.
 */
import { registerBlock, listBlockDefinitions } from "./engine/registry";
import {
  textBlock, headingBlock, imageBlock, textImageBlock, videoBlock, listBlock, quoteBlock, dividerBlock, columnsBlock,
} from "./library/content/definitions";
import { accordionBlock, tabsBlock, flashcardsBlock, processBlock } from "./library/interactive/definitions";
import { multipleChoiceBlock, multipleSelectBlock, trueFalseBlock } from "./library/activity/definitions";
import { audioBlock, galleryBlock } from "./library/media/definitions";
import { hotspotsBlock, revealCardsBlock, tableBlock, timelineBlock } from "./library/explore/definitions";
import { matchingBlock, openQuestionBlock, sortingBlock } from "./library/practice/definitions";
import { gateBlock, performanceBlock, scenarioBlock } from "./library/experience/definitions";

/** A ordem aqui é a ordem de exibição na biblioteca de blocos. */
const ALL = [
  headingBlock, textBlock, listBlock, quoteBlock, imageBlock, textImageBlock, galleryBlock, videoBlock, audioBlock, dividerBlock,
  accordionBlock, tabsBlock, flashcardsBlock, revealCardsBlock, hotspotsBlock, processBlock, timelineBlock,
  multipleChoiceBlock, multipleSelectBlock, trueFalseBlock, matchingBlock, sortingBlock, openQuestionBlock,
  columnsBlock, tableBlock,
  scenarioBlock, gateBlock, performanceBlock,
];

let registered = false;
export function ensureBlocksRegistered(): void {
  if (registered || listBlockDefinitions().length > 0) {
    registered = true;
    return;
  }
  ALL.forEach((d) => registerBlock(d));
  registered = true;
}

ensureBlocksRegistered();
