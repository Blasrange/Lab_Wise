"use server";
/**
 * @fileOverview A Genkit flow for sending emails.
 *
 * - sendEmail - A function that sends an email.
 * - SendEmailInput - The input type for the sendEmail function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import * as nodemailer from "nodemailer";
import { addActivityLog } from "@/services/activityLogService";

const SendEmailInputSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export async function sendEmail(
  input: SendEmailInput
): Promise<{ success: boolean; error?: string }> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: "sendEmailFlow",
    inputSchema: SendEmailInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    console.log("Sending email with input:", input);

    // Using user-provided Gmail SMTP settings from environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.MAIL_PORT || "587", 10),
      secure: (process.env.MAIL_PORT || "587") === "465", // Typically true for 465, false for 587
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from:
        process.env.MAIL_FROM_ADDRESS ||
        '"LabWise Notifier" <noreply@labwise.dev>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);

      return { success: true };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      addActivityLog({
        user: "System",
        actionType: "SYSTEM_ERROR",
        description: "Failed to send email.",
        details: {
          context: "sendEmailFlow",
          to: input.to,
          subject: input.subject,
          error: error.message || "Unknown error",
        },
      });
      return { success: false, error: error.message };
    }
  }
);
