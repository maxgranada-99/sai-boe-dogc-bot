import fs from "node:fs";
import path from "node:path";

const STATE_PATH = path.join(process.cwd(), "data", "state.json");

export function loadState() {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { seen: [] };
  }
}

export function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}