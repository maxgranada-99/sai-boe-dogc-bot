import path from "node:path";
import fs from "node:fs";
import { loadState, saveState } from "./src/state.js";
import { getBoeAyudasItems } from "./src/sources/boe_ayudas.js";
import { extractPdfLinksFromPage } from "./src/boe_extract_pdfs.js";
import { fetchBuffer } from "./src/http.js";
import { buildBody, buildSubject, sendMail } from "./src/email.js";
import { getDogcItems } from "./src/sources/dogc_search.js";
import { getDogcItems } from "./src/sources/dogc_opendata.js";

const FORCE_SEND =
  String(process.env.FORCE_SEND || "false").toLowerCase() === "true";

const filters = JSON.parse(
  fs.readFileSync("./config/filters.json", "utf-8")
);

function scoreItem(item, source = "es") {
  const text = (item.title || "").toLowerCase();
  const cfg = filters[source];

  let score = 0;

  for (const word of cfg.include) {
    if (text.includes(word.toLowerCase())) score += 1;
  }

  for (const word of cfg.exclude) {
    if (text.includes(word.toLowerCase())) score -= 3;
  }

  return score;
}

function explainScore(item, source = "es") {
  const text = (item.title || "").toLowerCase();
  const cfg = filters[source];

  const hitsInclude = cfg.include.filter((w) =>
    text.includes(w.toLowerCase())
  );

  const hitsExclude = cfg.exclude.filter((w) =>
    text.includes(w.toLowerCase())
  );

  const score = hitsInclude.length * 1 + hitsExclude.length * -3;

  return { score, hitsInclude, hitsExclude };
}

function todayMadridISO() {
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
  const dogc = await getDogcItems();

  const combined = [
  ...boe.map((it) => ({ ...it, source: "boe" })),
  ...dogc.map((it) => ({ ...it, source: "dogc" }))
];

  const newItems = combined.filter((it) => !seen.has(it.id)).slice(0, 20);

  const rejected = [];
  const filteredItems = [];

  for (const it of newItems) {
    const info = explainScore(it, "es");

    if (info.score >= filters.min_score) {
      it._score = info.score;
      filteredItems.push(it);
    } else {
      rejected.push({
        title: it.title,
        link: it.link,
        score: info.score,
        hitsInclude: info.hitsInclude,
        hitsExclude: info.hitsExclude,
      });
    }
  }

  fs.mkdirSync("out", { recursive: true });
  fs.writeFileSync(
    "out/rejected.json",
    JSON.stringify(rejected, null, 2),
    "utf-8"
  );

  if (filteredItems.length === 0 && !FORCE_SEND) {
    console.log("Cap novetat rellevant segons filtre.");
    return;
  }

  // Extreure PDFs només dels filtrats
  for (const it of filteredItems) {
    try {
      it.pdfs = await extractPdfLinksFromPage(it.link);
    } catch (e) {
      console.warn("No he pogut extreure PDFs:", it.link, e.message);
      it.pdfs = [];
    }
  }

  // Baixar PDFs (màxim 8)
  const attachments = [];

  for (const it of filteredItems) {
    for (const pdfUrl of it.pdfs || []) {
      if (attachments.length >= 8) break;

      try {
        const buf = await fetchBuffer(pdfUrl);

        attachments.push({
          filename: sanitizeFilename(
            path.basename(new URL(pdfUrl).pathname) || "document.pdf"
          ),
          content: buf,
        });
      } catch (e) {
        console.warn("No he pogut descarregar PDF:", pdfUrl, e.message);
      }
    }

    if (attachments.length >= 8) break;
  }

  const subject = buildSubject(dateStr, filteredItems.length);
  const body = buildBody(dateStr, filteredItems);

  await sendMail({ subject, text: body, attachments });

  filteredItems.forEach((it) => seen.add(it.id));
  state.seen = [...seen].slice(-5000);
  saveState(state);

  console.log(
    `Enviat correu amb ${filteredItems.length} convocatòria(es).`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});