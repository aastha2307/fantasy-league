import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import * as Tesseract from "tesseract.js";
import { extractDream11PointsBestEffort } from "@/lib/parse-dream11-points-ocr";
import { extractTeamPlayersFromOcr } from "@/lib/parse-dream11-ocr";

const emptyTeam = JSON.stringify({
  players: [] as string[],
  captain: "",
  viceCaptain: "",
});

/**
 * Saves image under public/, runs OCR, returns relative public URL, parsed XI, and team points (if found).
 */
export async function processDream11Screenshot(
  buf: Buffer,
  publicDirUnderUploads: string
): Promise<{ ocrText: string; playersJson: string; imagePublicPath: string; ocrPoints: number | null }> {
  const ext = "png";
  const rel = `uploads/${publicDirUnderUploads}/${nanoid()}.${ext}`;
  const abs = path.join(process.cwd(), "public", rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);

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
    console.error("Tesseract OCR failed (screenshot still saved):", e);
    text = "";
  }

  const extracted = extractTeamPlayersFromOcr(text);
  const playersJson =
    extracted.players.length > 0 ? JSON.stringify(extracted) : emptyTeam;
  const ocrPoints = extractDream11PointsBestEffort(text);

  return {
    ocrText: text,
    playersJson,
    imagePublicPath: `/${rel}`,
    ocrPoints,
  };
}

export { emptyTeam };
