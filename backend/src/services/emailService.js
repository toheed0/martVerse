import { sendMail } from "../config/mailer.js";

// The reset link points at the storefront, not the API — the buyer opens a page
// that collects a new password, and that page is the one that calls the API.
const clientUrl = () => process.env.CLIENT_URL || "http://localhost:3000";

export const sendPasswordResetEmail = async ({ to, name, token, expiresInMinutes }) => {
  // encodeURIComponent because the token goes in a query string. It is
  // hex today, but the encoding should not depend on that staying true.
  const link = `${clientUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Reset your MartVerse password";

  const text = `Hi ${name},

Someone asked to reset the password on your MartVerse account.

Open this link to choose a new one:
${link}

The link stops working in ${expiresInMinutes} minutes, and using it signs you
out everywhere else.

If this wasn't you, ignore this email — nothing has changed, and your current
password still works.`;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 34rem; color: #1a1714;">
      <p>Hi ${name},</p>

      <p>Someone asked to reset the password on your MartVerse account.</p>

      <p style="margin: 1.75rem 0;">
        <a href="${link}"
           style="background: #1e3d33; color: #f7f4ee; padding: 0.85rem 1.75rem; border-radius: 999px; text-decoration: none; font-weight: 600; display: inline-block;">
          Choose a new password
        </a>
      </p>

      <p style="color: #6b635a; font-size: 0.9rem;">
        The link stops working in ${expiresInMinutes} minutes, and using it signs
        you out everywhere else.
      </p>

      <p style="color: #6b635a; font-size: 0.9rem;">
        If this wasn't you, ignore this email — nothing has changed, and your
        current password still works.
      </p>

      <p style="color: #6b635a; font-size: 0.8rem; word-break: break-all; margin-top: 2rem;">
        If the button does not work, paste this into your browser:<br />${link}
      </p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
};
