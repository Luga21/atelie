/**
 * Mapa tipo → View. É a única parte visual dos blocos incluída no player exportado.
 * A mesma View atende o canvas (mode="edit") e o player (mode="view"), mantendo
 * os dois ambientes fiéis um ao outro sem duplicar componentes.
 */
import "./definitions";
import type { BlockView } from "./engine/context";
import {
  ColumnsView, DividerView, HeadingView, ImageView, ListView, QuoteView, TextImageView, TextView, VideoView,
} from "./library/content/views";
import { AccordionView, FlashcardsView, ProcessView, TabsView } from "./library/interactive/views";
import { ChoiceView } from "./library/activity/views";
import { AudioView, GalleryView } from "./library/media/views";
import { HotspotsView, RevealCardsView, TableView, TimelineView } from "./library/explore/views";
import { MatchingView, OpenQuestionView, SortingView } from "./library/practice/views";
import { GateView, PerformanceView, ScenarioView } from "./library/experience/views";

export const BLOCK_VIEWS: Record<string, BlockView> = {
  text: TextView,
  heading: HeadingView,
  image: ImageView,
  "text-image": TextImageView,
  video: VideoView,
  list: ListView,
  quote: QuoteView,
  divider: DividerView,
  columns: ColumnsView,
  accordion: AccordionView,
  tabs: TabsView,
  flashcards: FlashcardsView,
  process: ProcessView,
  "multiple-choice": ChoiceView,
  "multiple-select": ChoiceView,
  "true-false": ChoiceView,
  gallery: GalleryView,
  audio: AudioView,
  "reveal-cards": RevealCardsView,
  hotspots: HotspotsView,
  timeline: TimelineView,
  table: TableView,
  matching: MatchingView,
  sorting: SortingView,
  "open-question": OpenQuestionView,
  scenario: ScenarioView,
  gate: GateView,
  performance: PerformanceView,
};
