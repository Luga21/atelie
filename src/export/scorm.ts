/**
 * Exportação SCORM 1.2 e SCORM 2004 (4ª edição).
 *
 * O pacote é o mesmo do HTML independente (player, dados, mídias) com:
 *   - window.__EXPORT_TARGET__ = "scorm12" | "scorm2004", que faz o runtime usar o adaptador SCORM;
 *   - imsmanifest.xml na raiz, com um único SCO apontando para index.html.
 *
 * A nota mínima do curso (course.lms.passingScore) vai para o manifest
 * (adlcp:masteryscore no 1.2; minNormalizedMeasure no 2004) e também é aplicada pelo próprio SCO,
 * de modo que o resultado é o mesmo com ou sem sequenciamento no LMS.
 */
import { zipSync, strToU8, type Zippable } from "fflate";
import "@/blocks/definitions";
import { getBlockDefinition } from "@/blocks/engine/registry";
import type { Course } from "@/core/model/types";
import { downloadBlob, slugify } from "./download";
import { buildHtmlPackage } from "./html";

export type ScormExportVersion = "1.2" | "2004";

const xml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/** Identificadores do manifest precisam ser xs:ID válidos (iniciar com letra, sem espaços). */
const xmlId = (s: string) => {
  const v = s.replace(/[^A-Za-z0-9_.-]/g, "_");
  return /^[A-Za-z_]/.test(v) ? v : `id_${v}`;
};

/** Lista todos os caminhos de arquivo do pacote (para os elementos <file>). */
export function listFiles(tree: Zippable, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([name, v]) =>
    v instanceof Uint8Array ? [`${prefix}${name}`] : Array.isArray(v) ? [`${prefix}${name}`] : listFiles(v as Zippable, `${prefix}${name}/`),
  );
}

/** O curso tem atividades com nota? (define se há nota mínima/aprovação). */
export function hasGradedActivities(course: Course): boolean {
  return course.modules.some((m) =>
    m.lessons.some((l) =>
      l.blocks.some((b) => {
        const s = getBlockDefinition(b.type)?.scoring;
        return !!s && s.maxScore({ content: b.content, settings: b.settings }) > 0;
      }),
    ),
  );
}

export function buildManifest(course: Course, version: ScormExportVersion, files: string[]): string {
  const id = xmlId(course.lms.identifier);
  const title = xml(course.title || "Treinamento");
  const graded = hasGradedActivities(course);
  const fileTags = files.filter((f) => f !== "imsmanifest.xml").map((f) => `      <file href="${xml(f)}"/>`).join("\n");

  if (version === "1.2") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG_${id}">
    <organization identifier="ORG_${id}">
      <title>${title}</title>
      <item identifier="ITEM_${id}" identifierref="RES_${id}" isvisible="true">
        <title>${title}</title>${graded ? `\n        <adlcp:masteryscore>${course.lms.passingScore}</adlcp:masteryscore>` : ""}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_${id}" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileTags}
    </resource>
  </resources>
</manifest>
`;
  }

  const sequencing = graded
    ? `
        <imsss:sequencing>
          <imsss:objectives>
            <imsss:primaryObjective objectiveID="PRIMARY_${id}" satisfiedByMeasure="true">
              <imsss:minNormalizedMeasure>${(course.lms.passingScore / 100).toFixed(2)}</imsss:minNormalizedMeasure>
            </imsss:primaryObjective>
          </imsss:objectives>
        </imsss:sequencing>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="ORG_${id}">
    <organization identifier="ORG_${id}">
      <title>${title}</title>
      <item identifier="ITEM_${id}" identifierref="RES_${id}" isvisible="true">
        <title>${title}</title>${sequencing}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_${id}" type="webcontent" adlcp:scormType="sco" href="index.html">
${fileTags}
    </resource>
  </resources>
</manifest>
`;
}

export async function buildScormPackage(course: Course, version: ScormExportVersion): Promise<Zippable> {
  const pkg = await buildHtmlPackage(course, version === "1.2" ? "scorm12" : "scorm2004");
  const files = listFiles(pkg.files);
  return { ...pkg.files, "imsmanifest.xml": strToU8(buildManifest(course, version, files)) };
}

export async function exportCourseScorm(course: Course, version: ScormExportVersion) {
  const files = await buildScormPackage(course, version);
  const zipped = zipSync(files, { level: 6 });
  const suffix = version === "1.2" ? "scorm12" : "scorm2004";
  downloadBlob(new Blob([zipped as BlobPart], { type: "application/zip" }), `${slugify(course.title)}-${suffix}.zip`);
}
