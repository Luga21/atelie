/**
 * Repositório de treinamentos. A aplicação só conhece esta interface; a implementação
 * IndexedDB pode ser trocada por uma remota (API/banco em nuvem) sem tocar na interface.
 */
import { uid } from "@/core/model/ids";
import { collectAssetIds, normalizeCourse, remapAssetIds, summarizeCourse } from "@/core/model/schema";
import type { Course, CourseSummary, Folder, StoredAsset } from "@/core/model/types";
import { getDB } from "./db";

export interface CourseRepository {
  list(): Promise<CourseSummary[]>;
  get(id: string): Promise<Course | null>;
  save(course: Course): Promise<void>;
  remove(id: string): Promise<void>;
  duplicate(id: string): Promise<Course | null>;
}

export interface AssetRepository {
  put(courseId: string, file: Blob, name: string): Promise<StoredAsset>;
  get(id: string): Promise<StoredAsset | undefined>;
  listByCourse(courseId: string): Promise<StoredAsset[]>;
}

export interface FolderRepository {
  list(): Promise<Folder[]>;
  save(folder: Folder): Promise<void>;
  remove(id: string): Promise<void>;
}

/* ------------------------------------------------------------- IndexedDB */

export const assetRepository: AssetRepository = {
  async put(courseId, blob, name) {
    const asset: StoredAsset = {
      id: uid("a"),
      courseId,
      name,
      mime: blob.type || "application/octet-stream",
      size: blob.size,
      blob,
      createdAt: Date.now(),
    };
    await (await getDB()).put("assets", asset);
    return asset;
  },
  async get(id) {
    return (await getDB()).get("assets", id);
  },
  async listByCourse(courseId) {
    return (await getDB()).getAllFromIndex("assets", "byCourse", courseId);
  },
};

export const courseRepository: CourseRepository = {
  async list() {
    const all = await (await getDB()).getAll("summaries");
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async get(id) {
    const raw = await (await getDB()).get("courses", id);
    return raw ? normalizeCourse(raw) : null;
  },

  async save(course) {
    const db = await getDB();
    const tx = db.transaction(["courses", "summaries"], "readwrite");
    await Promise.all([tx.objectStore("courses").put(course), tx.objectStore("summaries").put(summarizeCourse(course)), tx.done]);
  },

  async remove(id) {
    const db = await getDB();
    const assetKeys = await db.getAllKeysFromIndex("assets", "byCourse", id);
    const tx = db.transaction(["courses", "summaries", "assets"], "readwrite");
    await Promise.all([
      tx.objectStore("courses").delete(id),
      tx.objectStore("summaries").delete(id),
      ...assetKeys.map((k) => tx.objectStore("assets").delete(k)),
      tx.done,
    ]);
  },

  /** Duplica o curso e copia suas mídias, remapeando as referências. */
  async duplicate(id) {
    const src = await this.get(id);
    if (!src) return null;
    const newId = uid("c");
    const map = new Map<string, string>();
    for (const assetId of collectAssetIds(src)) {
      const a = await assetRepository.get(assetId);
      if (!a) continue;
      const copy = await assetRepository.put(newId, a.blob, a.name);
      map.set(assetId, copy.id);
    }
    const now = Date.now();
    const copy: Course = {
      ...remapAssetIds(src, map),
      id: newId,
      title: `${src.title} (cópia)`,
      lms: { ...src.lms, identifier: uid("pkg") },
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    await this.save(copy);
    return copy;
  },
};

export const folderRepository: FolderRepository = {
  async list() {
    const all = await (await getDB()).getAll("folders");
    return all.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  },
  async save(folder) {
    await (await getDB()).put("folders", folder);
  },
  async remove(id) {
    const db = await getDB();
    // Cursos da pasta voltam para "sem pasta".
    const courses = await db.getAll("courses");
    for (const c of courses.filter((c) => c.folderId === id)) await courseRepository.save({ ...c, folderId: null });
    await db.delete("folders", id);
  },
};
