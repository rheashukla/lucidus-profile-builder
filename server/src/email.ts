import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendMagicLink(to: string, url: string) {
  if (!resend) {
    // Dev: no Resend key, so print the link instead of sending it.
    console.log(`\n[magic link] ${to}\n  ${url}\n`);
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Lucidus <onboarding@resend.dev>',
    to,
    subject: 'Your Portfolio Builder sign-in link',
    text: `Open this link to sign in and keep working on your projects:\n\n${url}\n\nIt works once and expires in 15 minutes. If you didn't ask for it, ignore this email.`,
    html: `<p>Open this link to sign in and keep working on your projects:</p><p><a href="${url}">Sign in to Portfolio Builder</a></p><p>It works once and expires in 15 minutes. If you didn't ask for it, ignore this email.</p>`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
