/**
 * @fileoverview Service for handling system-wide activity logs.
 * This service uses Firebase Firestore.
 */

import type { ActivityLog } from "@/lib/types";
import { getFirebaseApp } from "@/firebase/config";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * Retrieves all activity logs, sorted with the most recent first.
 * @returns A promise that resolves to an array of ActivityLog objects.
 */
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const logsCollection = collection(db, "activity-logs");
  const q = query(logsCollection, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  const logs: ActivityLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() } as ActivityLog);
  });
  return logs;
}

/**
 * Adds a new activity log entry.
 * @param logData The data for the new log entry.
 * @returns A promise that resolves to the newly created ActivityLog object.
 */
export async function addActivityLog(
  logData: Omit<ActivityLog, "id" | "timestamp">
): Promise<ActivityLog> {
  const app = getFirebaseApp();
  const db = getFirestore(app);

  const newLog: Omit<ActivityLog, "id"> = {
    ...logData,
    timestamp: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "activity-logs"), newLog);

  return { id: docRef.id, ...newLog } as ActivityLog;
}
