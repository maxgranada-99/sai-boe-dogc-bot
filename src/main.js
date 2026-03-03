// src/main.js
// Pipeline mínim: prepara carpetes, inicialitza state/seen.json i genera un output de prova.

const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function main() {
  // Carpetes d’output
  ensureDir("out");
  ensureDir("out/pdfs");

  // Estat: memòria del que ja s'ha processat
  ensureDir("state");
  ensureJsonFile("state/seen.json", { version: 1, items: [] });

  // Output de prova (per veure artifacts al workflow)
  const now = new Date().toISOString();
  writeText(
    "out/README.txt",
    `SAI bot output (prova)\nGenerat: ${now}\n\nProper pas: ingestió DOGC/BOE + filtre + PDFs + correu.\n`
  );

  // Correu .eml de prova
  const eml = [
    "Subject: [PROVA] SAI - sortida automàtica",
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    "Això és un correu de prova generat pel pipeline.",
    "Si el veieu als artifacts, el workflow està OK.",
    "",
    `Data: ${now}`,
  ].join("\n");

  writeText("out/email.eml", eml);

  console.log("OK: pipeline mínim executat.");
}

main();