import { nanoid } from "nanoid";
import * as Tesseract from "tesseract.js";
import { extractDream11PointsBestEffort } from "@/lib/parse-dream11-points-ocr";
import { extractTeamPlayersFromOcr } from "@/lib/parse-dream11-ocr";
import { ensureFirebaseAdminApp } from "@/lib/firebase-admin-app";
import { getStorage } from "firebase-admin/storage";

export const emptyTeam = JSON.stringify({
  players: [] as string[],
  captain: "",
  viceCaptain: "",
});

/**
 * Uploads an image buffer to Firebase Cloud Storage and returns a permanent public URL.
 * The Admin SDK's makePublic() grants allUsers storage.objects.viewer, so no Storage
 * security rules change is required for reads.
 */
async function uploadToCloudStorage(buf: Buffer, storagePath: string): Promise<string> {
  ensureFirebaseAdminApp();
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);
  await file.save(buf, { metadata: { contentType: "image/png" } });
  await file.makePublic();
  // Standard GCS public URL (stable, no expiry).
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

/**
 * Uploads image to Cloud Storage, runs OCR, returns public GCS URL, parsed XI, and team points.
 */
export async function processDream11Screenshot(
  buf: Buffer,
  subFolder: string
): Promise<{ ocrText: string; playersJson: string; imagePublicPath: string; ocrPoints: number | null }> {
  const storagePath = `uploads/${subFolder}/${nanoid()}.png`;

  const imagePublicPath = await uploadToCloudStorage(buf, storagePath);

  let text = "";
  try {
    async function ocrPass(psm?: Tesseract.PSM): Promise<string> {
      const worker = await Tesseract.createWorker("eng");
      try {
        if (psm !== undefined) {
          await worker.setParameters({ tessedit_pageseg_mode: psm });
        }
        const { data } = await worker.recognize(buf);
        return data.text ?? "";
      } finally {
        await worker.terminate();
      }
    }
    const [defaultOcr, sparseOcr] = await Promise.all([
      ocrPass(),
      ocrPass(Tesseract.PSM.SPARSE_TEXT),
    ]);
    text = [defaultOcr, sparseOcr].join("\n");
  } catch (e) {
    console.error("Tesseract OCR failed (screenshot still saved to GCS):", e);
    text = "";
  }

  const extracted = extractTeamPlayersFromOcr(text);
  const playersJson =
    extracted.players.length > 0 ? JSON.stringify(extracted) : emptyTeam;
  const ocrPoints = extractDream11PointsBestEffort(text);

  return {
    ocrText: text,
    playersJson,
    imagePublicPath,
    ocrPoints,
  };
}
