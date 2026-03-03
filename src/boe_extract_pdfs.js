import * as cheerio from "cheerio";
import { fetchText } from "./http.js";

export async function extractPdfLinksFromPage(url) {
  const html = await fetchText(url);
  const $ = cheerio.load(html);

  const links = new Set();

  $("a").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;

    // Normalitza relatius
    const abs = href.startsWith("http") ? href : new URL(href, url).toString();

    if (abs.toLowerCase().endsWith(".pdf")) links.add(abs);
  });

  return [...links];
}