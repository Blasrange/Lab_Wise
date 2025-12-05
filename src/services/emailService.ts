const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD?.replace(/"/g, ""),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS,
    to,
    subject,
    text,
    html,
  };
  interface MailInfo {
    messageId: string;
    envelope: {
      from: string;
      to: string[];
    };
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
  }

  interface MailResult {
    success: boolean;
    info?: MailInfo;
    error?: Error;
  }

  return transporter
    .sendMail(mailOptions)
    .then((info: MailInfo): MailResult => ({ success: true, info }))
    .catch((error: Error): MailResult => ({ success: false, error }));
}

// Eliminado para usar export ES Modules
