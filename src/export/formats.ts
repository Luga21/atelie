/**
 * Catálogo de formatos de exportação. Novos formatos (SCORM 1.2, SCORM 2004, xAPI)
 * entram aqui implementando `run`, reaproveitando `buildHtmlPackage` + um ProgressAdapter próprio.
 */
import type { Course } from "@/core/model/types";
import { exportCourseHtml } from "./html";
import { exportCourseJson } from "./json";
import { exportCourseScorm } from "./scorm";

export interface ExportFormat {
  id: string;
  label: string;
  description: string;
  available: boolean;
  run?: (course: Course) => Promise<void>;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "html",
    label: "HTML independente (.zip)",
    description: "Site completo para hospedar em qualquer servidor ou abrir localmente.",
    available: true,
    run: exportCourseHtml,
  },
  {
    id: "json",
    label: "Projeto editável (.json)",
    description: "Backup completo com mídias, para importar novamente na ferramenta.",
    available: true,
    run: exportCourseJson,
  },
  {
    id: "scorm12",
    label: "SCORM 1.2 (.zip)",
    description: "Compatível com praticamente todos os LMS. Conclusão, nota e retomada.",
    available: true,
    run: (course) => exportCourseScorm(course, "1.2"),
  },
  {
    id: "scorm2004",
    label: "SCORM 2004 4ª ed. (.zip)",
    description: "Conclusão e aprovação separadas, progresso e mais espaço para retomada.",
    available: true,
    run: (course) => exportCourseScorm(course, "2004"),
  },
];
