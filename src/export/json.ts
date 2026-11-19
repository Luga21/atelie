/**
 * Exportação/importação do projeto editável em JSON.
 * As mídias locais são embutidas em base64, tornando o arquivo autocontido.
 */
import { uid } from "@/core/model/ids";
import { collectAssetIds, CourseFormatError, normalizeCourse, remapAssetIds } from "@/core/model/schema";
import type { Course } from "@/core/model/types";
import { assetRepository, courseRepository } from "@/storage/repository";
import { base64ToBlob, blobToBase64, downloadBlob, slugify } from "./download";

export const PROJECT_FORMAT = "atelie-course";
export const PROJECT_FORMAT_VERSION = 1;

interface ProjectFile {
  format: typeof PROJECT_FORMAT;
  formatVersion: number;
  exportedAt: string;
  course: Course;
  assets: Record<string, { name: string; mime: string; data: string }>;
}

export async function buildProjectFile(course: Course): Promise<ProjectFile> {
  const assets: ProjectFile["assets"] = {};
  for (const id of collectAssetIds(course)) {
    const a = await assetRepository.get(id);
    if (a) assets[id] = { name: a.name, mime: a.mime, data: await blobToBase64(a.blob) };
  }
  return { format: PROJECT_FORMAT, formatVersion: PROJECT_FORMAT_VERSION, exportedAt: new Date().toISOString(), course, assets };
}

export async function exportCourseJson(course: Course) {
  const file = await buildProjectFile(course);
  downloadBlob(new Blob([JSON.stringify(file)], { type: "application/json" }), `${slugify(course.title)}.course.json`);
}

/**
 * Importa um arquivo de projeto. Sempre cria um novo treinamento (novos ids de curso e mídias),
 * para nunca sobrescrever um projeto existente.
 */
export async function importCourseJson(file: File): Promise<Course> {
  let parsed: any;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new CourseFormatError("O arquivo não é um JSON válido.");
  }
  if (parsed?.format !== PROJECT_FORMAT || !parsed.course) {
    throw new CourseFormatError("Este arquivo não é um projeto exportado por esta ferramenta.");
  }
  if (parsed.formatVersion > PROJECT_FORMAT_VERSION) {
    throw new CourseFormatError("O arquivo foi exportado por uma versão mais nova da ferramenta.");
  }
  const base = normalizeCourse(parsed.course);
  const newId = uid("c");
  const map = new Map<string, string>();
  for (const [oldId, a] of Object.entries<any>(parsed.assets ?? {})) {
    if (!a?.data || !a?.mime) continue;
    const stored = await assetRepository.put(newId, base64ToBlob(a.data, a.mime), String(a.name ?? "arquivo"));
    map.set(oldId, stored.id);
  }
  const now = Date.now();
  const course: Course = { ...remapAssetIds(base, map), id: newId, folderId: null, createdAt: now, updatedAt: now };
  await courseRepository.save(course);
  return course;
}
