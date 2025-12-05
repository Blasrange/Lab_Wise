import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { generatePasswordResetEmail } from "./email-templates/password-reset";
import { getEquipments } from "./services/equipmentService";
import { getHistoryForEquipment } from "./services/historyService";
import { getUsers } from "./services/userService";
import { getNotificationSettings } from "./services/notificationSettingsService";
import { differenceInDays, parseISO, isBefore } from "date-fns";
import type { Equipment } from "./types";
import { generateOverdueMaintenanceEmail } from "./email-templates/overdue-maintenance";
import { generateCalibrationDueEmail } from "./email-templates/calibration-due";

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Reusable logic for checking and sending notifications.
 */
async function runNotificationChecks() {
  console.log("Running notification checks...");

  const equipments = await getEquipments();
  const notificationSettings = await getNotificationSettings();

  const now = new Date();

  const mailHost = process.env.MAIL_HOST;
  if (!mailHost) {
    console.error(
      "Mail service is not configured (MAIL_HOST not set). Aborting notification check."
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: parseInt(process.env.MAIL_PORT || "587", 10),
    secure: (process.env.MAIL_PORT || "587") === "465",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // --- Check for Overdue Maintenance ---
  const overdueSetting = notificationSettings.find(
    (s) => s.type === "maintenance_overdue"
  );
  if (
    overdueSetting &&
    overdueSetting.isActive &&
    overdueSetting.recipients.length > 0
  ) {
    console.log("Checking for overdue maintenance tasks...");
    const allHistory = (
      await Promise.all(equipments.map((eq) => getHistoryForEquipment(eq.id)))
    ).flat();

    const overdueTasks = allHistory.filter(
      (task) =>
        task.status === "Programado" &&
        isBefore(parseISO(task.scheduledDate), now)
    );
    console.log(`Found ${overdueTasks.length} overdue tasks.`);

    for (const task of overdueTasks) {
      const equipment = equipments.find((eq) => eq.id === task.equipmentId);
      if (equipment) {
        for (const recipientEmail of overdueSetting.recipients) {
          console.log(
            `Sending OVERDUE email for task "${task.action}" on equipment "${equipment.instrument}" to ${recipientEmail}`
          );
          const emailHtml = generateOverdueMaintenanceEmail({
            equipment,
            task,
            recipientName: recipientEmail,
          });
          await transporter.sendMail({
            from:
              process.env.MAIL_FROM_ADDRESS ||
              '"LabWise Notifier" <noreply@labwise.dev>',
            to: recipientEmail,
            subject: `Mantenimiento VENCIDO - ${equipment.instrument}`,
            html: emailHtml,
          });
        }
      }
    }
  }

  // --- Check for Upcoming Calibrations ---
  const calibSetting = notificationSettings.find(
    (s) => s.type === "calibration_due"
  );
  if (
    calibSetting &&
    calibSetting.isActive &&
    calibSetting.recipients.length > 0
  ) {
    console.log(
      `Checking for upcoming calibrations within ${calibSetting.daysBefore} days...`
    );
    for (const equipment of equipments) {
      if (equipment.nextExternalCalibration) {
        const daysUntilDue = differenceInDays(
          parseISO(equipment.nextExternalCalibration),
          now
        );
        if (daysUntilDue > 0 && daysUntilDue <= calibSetting.daysBefore) {
          for (const recipientEmail of calibSetting.recipients) {
            console.log(
              `Sending CALIBRATION DUE email for equipment "${equipment.instrument}" (due in ${daysUntilDue} days) to ${recipientEmail}`
            );
            const emailHtml = generateCalibrationDueEmail({
              equipment,
              recipientName: recipientEmail,
              daysUntilDue,
            });
            await transporter.sendMail({
              from:
                process.env.MAIL_FROM_ADDRESS ||
                '"LabWise Notifier" <noreply@labwise.dev>',
              to: recipientEmail,
              subject: `Calibración Próxima a Vencer - ${equipment.instrument}`,
              html: emailHtml,
            });
          }
        }
      }
    }
  }

  console.log("Notification checks completed successfully.");
}

/**
 * Scheduled function to run daily, check for notifications, and send them.
 */
export const checkAndSendNotifications = functions.pubsub
  .schedule("every day 08:00")
  .onRun(async (context) => {
    try {
      await runNotificationChecks();
    } catch (error) {
      console.error("Error during scheduled notification check:", error);
    }
  });
