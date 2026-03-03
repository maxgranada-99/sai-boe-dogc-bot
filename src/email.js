import nodemailer from "nodemailer";

export function buildSubject(dateStr, count) {
  return `[SAI] Alertes ajuts BOE (${dateStr}) — ${count} novetat(s)`;
}

export function buildBody(dateStr, items) {
  const lines = [];
  lines.push(`Bon dia,`);
  lines.push(``);
  lines.push(`Resum de novetats detectades al BOE (canal “Ayudas”) — ${dateStr}:`);
  lines.push(``);

  items.forEach((it, idx) => {
    lines.push(`${idx + 1}) ${it.title}`);
    lines.push(`   Enllaç: ${it.link}`);
    if (it.pdfs?.length) {
      lines.push(`   PDFs:`);
      it.pdfs.forEach((p) => lines.push(`     - ${p}`));
    }
    lines.push(``);
  });

  lines.push(`—`);
  lines.push(`SAI (ACCIÓ)`);
  return lines.join("\n");
}

export async function sendMail({ subject, text, attachments }) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
    MAIL_TO
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
    throw new Error("Falten variables d'entorn SMTP_* o MAIL_* (revisa Secrets del repo).");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || "false").toLowerCase() === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    requireTLS: true
  });

  await transporter.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject,
    text,
    attachments
  });
}