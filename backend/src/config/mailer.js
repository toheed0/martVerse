import nodemailer from "nodemailer";

// SMTP is optional on purpose. A password reset is useless without a way to
// deliver the link, but requiring a mail account before anyone can run the
// project locally is worse — so with no SMTP configured the mail is printed to
// the server console instead, and the flow stays testable end to end.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export const mailIsConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const FROM = process.env.MAIL_FROM || "MartVerse <no-reply@martverse.local>";

const transporter = mailIsConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      // 465 is implicit TLS; everything else starts plain and upgrades with
      // STARTTLS, which is what port 587 expects.
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    // Development fallback. Loud and boxed so the link is findable in a busy
    // log, and explicit that nothing was actually delivered.
    console.log(
      [
        "",
        "┌─ EMAIL NOT SENT — no SMTP configured ─────────────────────",
        `│ To:      ${to}`,
        `│ Subject: ${subject}`,
        "│",
        ...text.trim().split("\n").map((line) => `│ ${line}`),
        "└───────────────────────────────────────────────────────────",
        "",
      ].join("\n")
    );

    return { delivered: false };
  }

  await transporter.sendMail({ from: FROM, to, subject, text, html });

  return { delivered: true };
};
