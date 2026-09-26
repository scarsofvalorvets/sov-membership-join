/**
 * Outbound email for magic-link sign-in.
 *
 * - EMAIL_SERVER set  -> send through that SMTP server with nodemailer.
 * - EMAIL_SERVER unset -> DO NOT send; print the link to the server console.
 *   This is the local-dev path and guarantees no real email leaves a dev box.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

export async function sendMagicLink(to: string, url: string): Promise<void> {
  if (!emailConfigured()) {
    const bar = "=".repeat(72);
    console.log(
      `\n${bar}\n[dev] Magic sign-in link for ${to} (email not configured, nothing sent):\n${url}\n${bar}\n`
    );
    return;
  }

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER);
  const host = new URL(url).host;
  await transport.sendMail({
    to,
    from: process.env.EMAIL_FROM,
    subject: "Sign in to Scars of Valor Foundation",
    text: `Sign in to ${host}:\n\n${url}\n\nThis link expires in 24 hours and can be used once. If you did not request it, you can ignore this email.\n\nScars of Valor Foundation`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1c1917">
<h2 style="margin:0 0 12px">Scars of Valor Foundation</h2>
<p>Use the button below to sign in to ${host}.</p>
<p style="margin:24px 0"><a href="${url}" style="background:#f59e0b;color:#0c0a09;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Sign in</a></p>
<p style="font-size:13px;color:#57534e">This link expires in 24 hours and can be used once. If you did not request it, you can ignore this email.</p>
</div>`,
  });
}
