/**
 * @fileoverview Service for handling equipment history data operations.
 * This service uses Firebase Firestore.
 */

import type { EquipmentHistory, MaintenanceType } from "@/lib/types";
import { getFirebaseApp } from "@/firebase/config";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getEquipmentById } from "./equipmentService";
import { addActivityLog } from "./activityLogService";

/**
 * Retrieves the history for a specific piece of equipment.
 * @param equipmentId The ID of the equipment.
 * @returns A promise that resolves to an array of EquipmentHistory objects.
 */
export async function getHistoryForEquipment(
  equipmentId: string
): Promise<EquipmentHistory[]> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const historyCollection = collection(db, "equipment-history");
  const q = query(historyCollection, where("equipmentId", "==", equipmentId));
  const querySnapshot = await getDocs(q);
  const history: EquipmentHistory[] = [];
  querySnapshot.forEach((doc) => {
    history.push({ id: doc.id, ...doc.data() } as EquipmentHistory);
  });

  // Sort by date client-side as Firestore requires an index for this query
  return history.sort(
    (a, b) =>
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );
}

/**
 * Adds a new maintenance history record to an equipment's sub-collection.
 * @param equipmentId The ID of the equipment.
 * @param maintenanceData The maintenance history record to add.
 * @param performingUser The name of the user performing the action.
 * @param completionDate Optional completion date.
 * @returns A promise that resolves to the newly created EquipmentHistory object.
 */
export async function addMaintenanceToEquipment(
  equipmentId: string,
  maintenanceData: Omit<
    EquipmentHistory,
    "id" | "equipmentId" | "date" | "user"
  >,
  performingUser: string,
  completionDate?: string
): Promise<EquipmentHistory> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const historyCollection = collection(db, `equipment-history`);

  const newHistoryEntry: Omit<EquipmentHistory, "id"> = {
    ...maintenanceData,
    equipmentId: equipmentId,
    date: completionDate || new Date().toISOString(),
    user: performingUser,
    responsible: maintenanceData.responsible,
    maintenanceType: maintenanceData.maintenanceType || "Otro",
    description: maintenanceData.description || "",
  };

  const docRef = await addDoc(historyCollection, newHistoryEntry);

  const equipment = await getEquipmentById(equipmentId);
  if (equipment) {
    await addActivityLog({
      user: performingUser,
      actionType: "MAINTENANCE_SCHEDULED",
      description: `Scheduled new task "${maintenanceData.action}" for "${equipment.instrument}"`,
      details: {
        equipmentId: equipmentId,
        equipmentName: equipment.instrument,
        task: maintenanceData.action,
        status: maintenanceData.status,
        type: newHistoryEntry.maintenanceType,
      },
    });
  }

  return { id: docRef.id, ...newHistoryEntry };
}
