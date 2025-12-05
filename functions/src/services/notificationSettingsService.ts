

import type { NotificationSetting } from "../types";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

const MOCK_NOTIFICATION_SETTINGS: Omit<NotificationSetting, 'recipients'>[] = [
    {
      id: "config-001",
      type: "calibration_due",
      title: "notifications_page.settings.calibration_due.title",
      description: "notifications_page.settings.calibration_due.description",
      daysBefore: 7,
      isActive: true
    },
    {
      id: "config-002",
      type: "maintenance_reminder",
      title: "notifications_page.settings.maintenance_reminder.title",
      description: "notifications_page.settings.maintenance_reminder.description",
      daysBefore: 3,
      isActive: true
    },
    {
      id: "config-003",
      type: "maintenance_completed",
      title: "notifications_page.settings.maintenance_completed.title",
      description: "notifications_page.settings.maintenance_completed.description",
      daysBefore: 0,
      isActive: true
    },
    {
      id: "config-004",
      type: "maintenance_overdue",
      title: "notifications_page.settings.maintenance_overdue.title",
      description: "notifications_page.settings.maintenance_overdue.description",
      daysBefore: 0,
      isActive: true
    }
];

/**
 * Creates the initial default notification settings in Firestore if they don't exist.
 * This function is idempotent and safe to call multiple times.
 */
export async function seedNotificationSettings(): Promise<void> {
    const db = getFirestore(admin.app());
    const settingsCollection = collection(db, "notification-settings");
    console.log("Checking if notification settings need to be seeded...");

    const snapshot = await getDocs(settingsCollection);
    if (!snapshot.empty) {
        console.log("Notification settings already exist. No seeding needed.");
        return;
    }

    console.log("Seeding notification settings as collection is empty...");
    const batch = writeBatch(db);

    MOCK_NOTIFICATION_SETTINGS.forEach(setting => {
        const docRef = doc(db, "notification-settings", setting.id);
        const dataWithRecipients: NotificationSetting = {
            ...setting,
            recipients: ["admin@labwise.com", "supervisor@labwise.com"] // Add default recipients
        };
        batch.set(docRef, dataWithRecipients);
    });

    await batch.commit();
    console.log(`${MOCK_NOTIFICATION_SETTINGS.length} notification settings seeded successfully.`);
}


export async function getNotificationSettings(): Promise<NotificationSetting[]> {
    const db = getFirestore(admin.app());
    const settingsCollection = collection(db, "notification-settings");
    const querySnapshot = await getDocs(settingsCollection);
    
    if (querySnapshot.empty) {
        // This case should ideally not be hit if seeding is done properly.
        return [];
    }

    const settings: NotificationSetting[] = [];
    querySnapshot.forEach((doc) => {
        settings.push({ id: doc.id, ...doc.data() } as NotificationSetting);
    });
    return settings;
}
