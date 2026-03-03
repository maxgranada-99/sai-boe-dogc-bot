import { XMLParser } from "fast-xml-parser";
import { fetchText } from "../http.js";

const BOE_AYUDAS_RSS = "https://www.boe.es/rss/canal.php?c=ayudas"; // canal “Ayudas” :contentReference[oaicite:0]{index=0}

export async function getBoeAyudasItems() {
  const xml = await fetchText(BOE_AYUDAS_RSS);
  const parser = new XMLParser({ ignoreAttributes: false });
  const feed = parser.parse(xml);

  const items = feed?.rss?.channel?.item ?? [];
  const normalized = (Array.isArray(items) ? items : [items]).map((it) => ({
    id: it.guid?.["#text"] || it.guid || it.link,
    title: it.title,
    link: it.link,
    pubDate: it.pubDate
  }));

  return normalized.filter((x) => x.id && x.link);
}