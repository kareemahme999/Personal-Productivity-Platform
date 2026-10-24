import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email. When no SMTP is configured (development), the message is
 * logged to the console so flows such as password reset remain testable.
 */
export async function sendMail(input: SendMailInput): Promise<{ delivered: boolean; preview?: string }> {
  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.log(`\n[mail:dev] To: ${input.to}\n[mail:dev] Subject: ${input.subject}\n[mail:dev] Body:\n${input.text}\n`);
    return { delivered: false, preview: input.text };
  }
  await t.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  return { delivered: true };
}
