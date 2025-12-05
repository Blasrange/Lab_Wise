"use server";
/**
 * @fileOverview A Genkit flow for sending overdue maintenance notifications.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { sendEmail } from "@/ai/flows/send-email";
import { generateOverdueMaintenanceEmail } from "@/ai/email-templates/overdue-maintenance";
import type { Equipment, EquipmentHistory, User } from "@/lib/types";
import { addNotificationLog } from "@/services/notificationService";

// Define the schema for the flow's input
const OverdueMaintenanceInputSchema = z.object({
  equipment: z.any().describe("The full equipment object"),
  task: z.any().describe("The overdue maintenance task object"),
  recipient: z.any().describe("The user object for the recipient"),
});
export type OverdueMaintenanceInput = z.infer<
  typeof OverdueMaintenanceInputSchema
>;

// The main exported function that can be called from server-side code
export async function sendOverdueMaintenanceEmail(
  input: OverdueMaintenanceInput
): Promise<{ success: boolean; error?: string }> {
  return overdueMaintenanceFlow(input);
}

// Define the Genkit flow
const overdueMaintenanceFlow = ai.defineFlow(
  {
    name: "overdueMaintenanceFlow",
    inputSchema: OverdueMaintenanceInputSchema,
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

    const subject = `Mantenimiento VENCIDO - ${equipment.instrument}`;
    const emailHtml = generateOverdueMaintenanceEmail({
      equipment,
      task,
      recipientName: recipient.name,
    });

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: subject,
      html: emailHtml,
    });

    // Log the notification attempt regardless of success or failure
    await addNotificationLog({
      notificationType: "maintenance_overdue",
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
