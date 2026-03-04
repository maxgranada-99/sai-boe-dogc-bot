import { fetchJson } from "../http.js";

const BASE = "https://analisi.transparenciacatalunya.cat/resource/n6hn-rmy7.json";

export async function getDogcItems({ limit = 50 } = {}) {
  const url = `${BASE}?$limit=${encodeURIComponent(String(limit))}`;

  console.log("[DOGC] url:", url);

  let rows = [];
  try {
    rows = await fetchJson(url);
  } catch (e) {
    console.warn("[DOGC] fetch failed:", e.message);
    return [];
  }

  // DEBUG (pots deixar-ho uns dies i després ho traiem)
  console.log(
    "[DOGC] keys sample:",
    rows?.[0] ? Object.keys(rows[0]).slice(0, 30) : []
  );

  return rows
    .map((r) => {
      const documentId = r.n_mero_de_control || null;

      const title = r.t_tol_de_la_norma || r.t_tol_de_la_norma_es || "";

      const date = r.data_de_publicaci_del_diari || null;

      // Preferim PDF perquè és el que normalment voldràs adjuntar
      const link = r.format_pdf || r.url_es_formato_pdf || r.format_html || null;

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