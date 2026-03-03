import path from "node:path";
import { loadState, saveState } from "./src/state.js";
import { getBoeAyudasItems } from "./src/sources/boe_ayudas.js";
import { extractPdfLinksFromPage } from "./src/boe_extract_pdfs.js";
import { fetchBuffer } from "./src/http.js";
import { buildBody, buildSubject, sendMail } from "./src/email.js";
const FORCE_SEND = String(process.env.FORCE_SEND || "false").toLowerCase() === "true";

function todayMadridISO() {
  // Acció simple: data “d’avui” segons runner (ja ho fixarem si vols amb TZ)
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 180);
}

async function run() {
  const dateStr = todayMadridISO();

  const state = loadState();
  const seen = new Set(state.seen || []);

  const boe = await getBoeAyudasItems();

  const newItems = boe.filter((it) => !seen.has(it.id)).slice(0, 10); // límit prudencial
  if (newItems.length === 0 && !FORCE_SEND) {
    console.log("Cap novetat (BOE ayudas).");
    return;
  }

  // Per cada item nou: troba PDFs a la pàgina
  for (const it of newItems) {
    try {
      it.pdfs = await extractPdfLinksFromPage(it.link);
    } catch (e) {
      console.warn("No he pogut extreure PDFs:", it.link, e.message);
      it.pdfs = [];
    }
  }

  // Baixa PDFs i adjunta (límit: 8 adjunts)
  const attachments = [];
  for (const it of newItems) {
    for (const pdfUrl of (it.pdfs || [])) {
      if (attachments.length >= 8) break;
      try {
        const buf = await fetchBuffer(pdfUrl);
        attachments.push({
          filename: sanitizeFilename(path.basename(new URL(pdfUrl).pathname) || "document.pdf"),
          content: buf
        });
      } catch (e) {
        console.warn("No he pogut descarregar PDF:", pdfUrl, e.message);
      }
    }
    if (attachments.length >= 8) break;
  }

  const subject = buildSubject(dateStr, newItems.length);
  const body = buildBody(dateStr, newItems);

  await sendMail({ subject, text: body, attachments });

  // Marca com vistos
  newItems.forEach((it) => seen.add(it.id));
  state.seen = [...seen].slice(-5000);
  saveState(state);

  console.log(`Enviat correu: ${newItems.length} novetat(s).`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});