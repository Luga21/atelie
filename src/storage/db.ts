/**
 * Banco local em IndexedDB.
 *  - courses:   documento completo de cada treinamento
 *  - summaries: resumo leve para o dashboard (atualizado a cada salvamento)
 *  - assets:    arquivos de mídia (Blob), indexados por curso
 *  - folders:   pastas/categorias do dashboard
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Course, CourseSummary, Folder, StoredAsset } from "@/core/model/types";

interface AuthoringDB extends DBSchema {
  courses: { key: string; value: Course };
  summaries: { key: string; value: CourseSummary; indexes: { byUpdated: number } };
  assets: { key: string; value: StoredAsset; indexes: { byCourse: string } };
  folders: { key: string; value: Folder };
}

const DB_NAME = "atelie-authoring";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AuthoringDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<AuthoringDB>> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB indisponível neste navegador."));
  dbPromise ??= openDB<AuthoringDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("courses", { keyPath: "id" });
      db.createObjectStore("summaries", { keyPath: "id" }).createIndex("byUpdated", "updatedAt");
      db.createObjectStore("assets", { keyPath: "id" }).createIndex("byCourse", "courseId");
      db.createObjectStore("folders", { keyPath: "id" });
    },
  });
  return dbPromise;
}
