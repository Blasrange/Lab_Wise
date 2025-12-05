"use server";
/**
 * @fileOverview A Genkit flow for sending upcoming maintenance reminder notifications.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { sendEmail } from "@/ai/flows/send-email";
import { generateMaintenanceReminderEmail } from "@/ai/email-templates/maintenance-reminder";
import type { Equipment, EquipmentHistory, User } from "@/lib/types";
import { addNotificationLog } from "@/services/notificationService";

// Define the schema for the flow's input
const MaintenanceReminderInputSchema = z.object({
  equipment: z.any().describe("The full equipment object"),
  task: z.any().describe("The upcoming maintenance task object"),
  recipient: z.any().describe("The user object for the recipient"),
});
export type MaintenanceReminderInput = z.infer<
  typeof MaintenanceReminderInputSchema
>;

// The main exported function
export async function sendMaintenanceReminderEmail(
  input: MaintenanceReminderInput
): Promise<{ success: boolean; error?: string }> {
  return maintenanceReminderFlow(input);
}

// Define the Genkit flow
const maintenanceReminderFlow = ai.defineFlow(
  {
    name: "maintenanceReminderFlow",
    inputSchema: MaintenanceReminderInputSchema,
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

    const subject = `Recordatorio: Mantenimiento Programado - ${equipment.instrument}`;
    const emailHtml = generateMaintenanceReminderEmail({
      equipment,
      task,
      recipientName: recipient.name,
    });

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: subject,
      html: emailHtml,
    });

    // Log the notification attempt
    await addNotificationLog({
      notificationType: "maintenance_reminder",
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
