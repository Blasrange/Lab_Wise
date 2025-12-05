import type {
  Equipment,
  User,
  Notification,
  NotificationSetting,
} from "./types";
import { subDays, addDays, format } from "date-fns";

const now = new Date();

export const MOCK_EQUIPMENT: Equipment[] = [];

export const MOCK_USERS: User[] = [
  // This user will now be created by the seed script.
];

export const MOCK_NOTIFICATIONS: Notification[] = [];

export const MOCK_NOTIFICATION_SETTINGS: Omit<
  NotificationSetting,
  "id" | "recipients"
>[] = [
  {
    type: "calibration_due",
    title: "notifications_page.settings.calibration_due.title",
    description: "notifications_page.settings.calibration_due.description",
    daysBefore: 7,
    isActive: true,
  },
  {
    type: "maintenance_reminder",
    title: "notifications_page.settings.maintenance_reminder.title",
    description: "notifications_page.settings.maintenance_reminder.description",
    daysBefore: 3,
    isActive: true,
  },
  {
    type: "maintenance_completed",
    title: "notifications_page.settings.maintenance_completed.title",
    description:
      "notifications_page.settings.maintenance_completed.description",
    daysBefore: 0,
    isActive: true,
  },
  {
    type: "maintenance_overdue",
    title: "notifications_page.settings.maintenance_overdue.title",
    description: "notifications_page.settings.maintenance_overdue.description",
    daysBefore: 0,
    isActive: true,
  },
];
