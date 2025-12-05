

/**
 * @fileoverview Service for handling notification settings in Firestore.
 */

import type { NotificationSetting } from "@/lib/types";
import { getFirebaseApp } from "@/firebase/config";
import { getFirestore, collection, getDocs, doc, writeBatch, query, getDoc, updateDoc, addDoc, where } from "firebase/firestore";
import { MOCK_NOTIFICATION_SETTINGS } from '@/lib/data';

function generateTypeFromTitle(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, ''); // Remove invalid characters
}


/**
 * Retrieves all notification settings from Firestore.
 * If the collection is empty, it will be an empty array.
 * @returns A promise that resolves to an array of NotificationSetting objects.
 */
export async function getNotificationSettings(): Promise<NotificationSetting[]> {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const settingsCollection = collection(db, "notification-settings");
    
    const querySnapshot = await getDocs(query(settingsCollection));
    
    const settings: NotificationSetting[] = [];
    querySnapshot.forEach((doc) => {
        settings.push({ id: doc.id, ...doc.data() } as NotificationSetting);
    });
    return settings;
}

/**
 * Creates the initial default notification settings in Firestore if they don't exist.
 * This function is idempotent and safe to call multiple times.
 */
export async function seedNotificationSettings(): Promise<void> {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const settingsCollection = collection(db, "notification-settings");
    console.log("Checking if notification settings need to be seeded...");

    const snapshot = await getDocs(settingsCollection);
    if (!snapshot.empty) {
        console.log("Notification settings already exist. No seeding needed.");
        return;
    }

    console.log("Seeding notification settings as collection is empty...");
    const batch = writeBatch(db);
    
    const defaultSettings: Omit<NotificationSetting, 'id'>[] = [
        {
          type: "calibration_due",
          title: "Calibración Próxima",
          description: "Notificación cuando una calibración externa está próxima a vencer.",
          daysBefore: 7,
          isActive: true,
          recipients: ["admin@labwise.com", "supervisor@labwise.com"]
        },
        {
          type: "maintenance_reminder",
          title: "Recordatorio Mantenimiento",
          description: "Recordatorio de mantenimientos programados.",
          daysBefore: 3,
          isActive: true,
          recipients: ["admin@labwise.com", "supervisor@labwise.com"]
        },
        {
          type: "maintenance_completed",
          title: "Mantenimiento Completado",
          description: "Notificación cuando se completa un mantenimiento.",
          daysBefore: 0,
          isActive: true,
          recipients: ["admin@labwise.com", "supervisor@labwise.com"]
        },
        {
          type: "maintenance_overdue",
          title: "Mantenimiento Vencido",
          description: "Notificación cuando un mantenimiento está vencido.",
          daysBefore: 0,
          isActive: true,
          recipients: ["admin@labwise.com", "supervisor@labwise.com"]
        }
    ];

    defaultSettings.forEach(setting => {
        const docRef = doc(settingsCollection); // Auto-generate ID
        batch.set(docRef, setting);
    });

    await batch.commit();
    console.log(`${defaultSettings.length} notification settings seeded successfully.`);
}

/**
 * Updates a specific notification setting in Firestore.
 * @param setting The complete notification setting object to update/save.
 */
export async function updateNotificationSetting(setting: NotificationSetting): Promise<void> {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const settingRef = doc(db, "notification-settings", setting.id);
    
    const dataToUpdate = { ...setting };
    
    await updateDoc(settingRef, dataToUpdate);
}

/**
 * Adds a new custom notification setting to Firestore.
 * The 'type' (ID) is generated automatically from the title.
 * @param settingData The data for the new notification setting, containing 'title' and 'description'.
 */
export async function addNotificationSetting(settingData: Omit<NotificationSetting, 'id' | 'type' | 'recipients' | 'isActive' | 'daysBefore'>): Promise<void> {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    const settingsCollection = collection(db, "notification-settings");

    const generatedType = generateTypeFromTitle(settingData.title);

    // Check if a setting with this generated type already exists
    const q = query(settingsCollection, where("type", "==", generatedType));
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error(`Ya existe un tipo de notificación con un ID similar a "${generatedType}". Por favor, elija un título diferente.`);
    }

    const newSetting: Omit<NotificationSetting, 'id'> = {
        ...settingData,
        type: generatedType,
        daysBefore: 0,
        recipients: [],
        isActive: true,
    };

    await addDoc(settingsCollection, newSetting);
}
