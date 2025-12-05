"use server";
/**
 * @fileOverview A Genkit flow for sending maintenance completed notifications.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { sendEmail } from "@/ai/flows/send-email";
import { generateMaintenanceCompletedEmail } from "@/ai/email-templates/maintenance-completed";
import type { Equipment, EquipmentHistory, User } from "@/lib/types";
import { addNotificationLog } from "@/services/notificationService";

const MaintenanceCompletedInputSchema = z.object({
  equipment: z.any().describe("The full equipment object"),
  task: z.any().describe("The completed maintenance task object"),
  recipient: z.any().describe("The user object for the recipient"),
});
export type MaintenanceCompletedInput = z.infer<
  typeof MaintenanceCompletedInputSchema
>;

export async function sendMaintenanceCompletedEmail(
  input: MaintenanceCompletedInput
): Promise<{ success: boolean; error?: string }> {
  return maintenanceCompletedFlow(input);
}

const maintenanceCompletedFlow = ai.defineFlow(
  {
    name: "maintenanceCompletedFlow",
    inputSchema: MaintenanceCompletedInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    const { equipment, task, recipient } = input as {
      equipment: Equipment;
      task: EquipmentHistory;
      recipient: User;
    };

    const subject = `Mantenimiento COMPLETADO - ${equipment.instrument}`;
    const emailHtml = generateMaintenanceCompletedEmail({
      equipment,
      task,
      recipientName: recipient.name,
    });

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: subject,
      html: emailHtml,
    });

    await addNotificationLog({
      notificationType: "maintenance_completed",
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
