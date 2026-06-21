// Email delivery for the third-party contract link + access code (OTP).
// Uses SMTP (configured via env vars). If SMTP isn't configured it logs the
// message to the server console and reports `sent: false` so the UI can fall
// back to showing the link/code for manual sharing.

import nodemailer from "nodemailer";

interface ShareEmail {
  to: string;
  company: string;
  link: string;
  otp: string;
}

export async function sendShareEmail(opts: ShareEmail): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM || user || "no-reply@sela.sa";
  const { to, company, link, otp } = opts;

  if (!host || !user || !pass) {
    // eslint-disable-next-line no-console
    console.log(
      `[email→${to}] SMTP not configured — not sent.\n  Link: ${link}\n  OTP: ${otp}`,
    );
    return false;
  }

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
    <div style="border-bottom:2px solid #e31b23;padding-bottom:10px;margin-bottom:18px">
      <span style="font-weight:bold;font-size:22px;color:#333">SELA</span>
    </div>
    <p>Dear ${company},</p>
    <p>SELA has shared a contract for your review.</p>
    <p style="margin:22px 0">
      <a href="${link}" style="background:#F5E76B;color:#111;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Open the contract</a>
    </p>
    <p style="font-size:13px;color:#555">Or copy this link:<br><a href="${link}">${link}</a></p>
    <p>Your 6-digit access code (OTP): <b style="letter-spacing:3px;font-size:16px">${otp}</b></p>
    <p style="margin-top:24px;color:#777;font-size:12px">Best regards,<br>SELA — Contract Lifecycle Management</p>
  </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to,
      subject: "SELA — Contract for your review",
      text: `Dear ${company},\n\nSELA has shared a contract for your review.\nOpen it here: ${link}\nYour access code (OTP): ${otp}\n\nBest regards,\nSELA`,
      html,
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Email send failed:", err);
    return false;
  }
}
