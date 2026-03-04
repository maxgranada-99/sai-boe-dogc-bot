import fs from "node:fs";

export async function getDogcItems() {
  // PAS 2: placeholder segur.
  // Al pas 3 hi posarem la consulta real al DOGC.
  try {
    const cfg = JSON.parse(fs.readFileSync("./config/dogc_keywords.json", "utf-8"));
    console.log(`[DOGC] Keywords carregades: ${cfg.queries?.length || 0}`);
  } catch (e) {
    console.warn("[DOGC] No he pogut llegir config/dogc_keywords.json:", e.message);
  }

  return []; // de moment no retorna res (encara)
}