"use server";
/**
 * @fileOverview A Genkit flow for sending upcoming calibration notifications.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { sendEmail } from "@/ai/flows/send-email";
import { generateCalibrationDueEmail } from "@/ai/email-templates/calibration-due";
import type { Equipment, User } from "@/lib/types";
import { addNotificationLog } from "@/services/notificationService";

// Define the schema for the flow's input
const CalibrationDueInputSchema = z.object({
  equipment: z.any().describe("The full equipment object"),
  recipient: z.any().describe("The user object for the recipient"),
  daysUntilDue: z.number().describe("Days until the calibration is due"),
});
export type CalibrationDueInput = z.infer<typeof CalibrationDueInputSchema>;

// The main exported function
export async function sendCalibrationDueEmail(
  input: CalibrationDueInput
): Promise<{ success: boolean; error?: string }> {
  return calibrationDueFlow(input);
}

// Define the Genkit flow
const calibrationDueFlow = ai.defineFlow(
  {
    name: "calibrationDueFlow",
    inputSchema: CalibrationDueInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    const { equipment, recipient, daysUntilDue } = input as {
      equipment: Equipment;
      recipient: User;
      daysUntilDue: number;
    };

    const subject = `Calibración Próxima a Vencer - ${equipment.instrument}`;
    const emailHtml = generateCalibrationDueEmail({
      equipment,
      recipientName: recipient.name,
      daysUntilDue,
    });

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: subject,
      html: emailHtml,
    });

    // Log the notification attempt
    await addNotificationLog({
      notificationType: "calibration_due",
      equipmentName: equipment.instrument,
      equipmentInternalCode: equipment.internalCode,
      subject: subject,
      recipients: [recipient.email],
      status: emailResult.success ? "Sent" : "Failed",
      error: emailResult.error,
    });

    return emailResult;
  }
);
