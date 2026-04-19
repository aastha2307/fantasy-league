import { mkdir, writeFile } from "fs/promises";
import path from "path";
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
 * Saves the image buffer and returns a stable public URL.
 *
 * On Cloud Run (Firebase App Hosting) the local disk is ephemeral — files
 * disappear on restart or when a different instance serves the request.
 * When NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set, the image is uploaded to
 * Firebase Storage and a permanent download-token URL is returned (the token
 * is stored in the file's custom metadata, which bypasses Storage security
 * rules for reads without requiring any ACL or IAM changes).
 *
 * Without the env var (local dev, no bucket configured) it falls back to
 * writing under public/uploads so the dev server can serve the file at /uploads/…
 */
async function saveImageAndGetUrl(buf: Buffer, storagePath: string): Promise<string> {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (bucketName) {
    ensureFirebaseAdminApp();
    const downloadToken = nanoid();
    const fileRef = getStorage().bucket(bucketName).file(storagePath);
    await fileRef.save(buf, {
      contentType: "image/png",
      metadata: {
        // Firebase serves this URL permanently; the token acts as a bearer
        // credential and is validated server-side against this metadata field.
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });
    const encodedPath = encodeURIComponent(storagePath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;
  }

  // Local dev fallback — serve via Next.js public/
  const abs = path.join(process.cwd(), "public", storagePath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  return `/${storagePath}`;
}

/**
 * Saves image, runs OCR, returns stable public URL, parsed XI, and team points (if found).
 */
export async function processDream11Screenshot(
  buf: Buffer,
  subFolder: string
): Promise<{ ocrText: string; playersJson: string; imagePublicPath: string; ocrPoints: number | null }> {
  const storagePath = `uploads/${subFolder}/${nanoid()}.png`;

  const imagePublicPath = await saveImageAndGetUrl(buf, storagePath);

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
    console.error("Tesseract OCR failed (screenshot already saved):", e);
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
