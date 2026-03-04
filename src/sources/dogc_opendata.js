import { fetchJson } from "../http.js";

const BASE = "https://analisi.transparenciacatalunya.cat/resource/n6hn-rmy7.json";

function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function getDogcItems({ daysBack = 2, limit = 50 } = {}) {
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  const fromStr = isoDate(from);

  const url =
    `${BASE}?` +
    [
      `$limit=${encodeURIComponent(String(limit))}`,
      `$order=${encodeURIComponent("data_publicacio DESC")}`,
      `$where=${encodeURIComponent(`data_publicacio >= '${fromStr}'`)}`,
    ].join("&");

  const rows = await fetchJson(url);

  return rows
    .map((r) => {
      const documentId =
        r.documentid || r.document_id || r.document || r.id_document || null;

      const title =
        r.titol ||
        r.titulo ||
        r.title ||
        r.descripcio ||
        r.descripcio_document ||
        "";

      const date = r.data_publicacio || r.data || r.date || null;

      const link =
        r.url ||
        r.enllac ||
        r.link ||
        (documentId
          ? `https://dogc.gencat.cat/ca/document-del-dogc/?documentId=${encodeURIComponent(
              String(documentId)
            )}`
          : null);

      const id = documentId ? `DOGC-${documentId}` : `DOGC-${link || title}`;

      return {
        id,
        source: "dogc",
        lang: "ca",
        title,
        link,
        date,
      };
    })
    .filter((it) => it.link && it.title);
}