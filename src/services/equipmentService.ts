/**
 * @fileoverview Service for handling equipment data operations.
 * This service uses Firebase Firestore.
 */

import type { Equipment, EquipmentHistory } from "@/lib/types";
import { format, addMonths, parseISO } from "date-fns";
import { addActivityLog } from "./activityLogService";
import { getFirebaseApp } from "@/firebase/config";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { addMaintenanceToEquipment } from "./historyService";

const generateToken = () => Math.random().toString(36).substring(2, 12);
const DEFAULT_IMAGE_URL = "https://picsum.photos/seed/placeholder/200/200";

export const calculateNextCalibration = (
  lastDate: string,
  periodicity: string
): string => {
  try {
    const monthsToAdd = parseInt(periodicity.match(/\d+/)?.[0] || "0", 10);
    if (monthsToAdd > 0 && lastDate) {
      const lastCalibrationDate = parseISO(lastDate);
      const nextCalibrationDate = addMonths(lastCalibrationDate, monthsToAdd);
      return format(nextCalibrationDate, "yyyy-MM-dd");
    }
  } catch (error) {
    console.error("Error calculating next calibration date:", error);
  }
  return "";
};

/**
 * Retrieves the list of all equipment.
 * @returns A promise that resolves to an array of Equipment objects.
 */
export async function getEquipments(): Promise<Equipment[]> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const equipmentCollection = collection(db, "equipment");
  const querySnapshot = await getDocs(equipmentCollection);
  const equipments: Equipment[] = [];
  querySnapshot.forEach((doc) => {
    equipments.push({ id: doc.id, ...doc.data() } as Equipment);
  });
  return equipments.sort((a, b) => (a.instrument > b.instrument ? 1 : -1));
}

/**
 * Retrieves a single piece of equipment by its ID.
 * @param id The ID of the equipment to retrieve.
 * @returns A promise that resolves to the Equipment object if found, otherwise null.
 */
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const docRef = doc(db, "equipment", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Equipment;
  }
  return null;
}

/**
 * Retrieves a single piece of equipment by its internal code.
 * @param internalCode The internal code of the equipment to retrieve.
 * @returns A promise that resolves to the Equipment object if found, otherwise null.
 */
export async function getEquipmentByInternalCode(
  internalCode: string
): Promise<Equipment | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const q = query(
    collection(db, "equipment"),
    where("internalCode", "==", internalCode)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Equipment;
  }
  return null;
}

/**
 * Retrieves a single piece of equipment by its QR Token.
 * @param qrToken The QR token of the equipment to retrieve.
 * @returns A promise that resolves to the Equipment object if found, otherwise null.
 */
export async function getEquipmentByQrToken(
  qrToken: string
): Promise<Equipment | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const q = query(collection(db, "equipment"), where("qrToken", "==", qrToken));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Equipment;
  }
  return null;
}

/**
 * Adds a new piece of equipment to the database.
 * @param equipmentData The equipment data to add.
 * @param performingUser The name of the user performing the action.
 * @returns A promise that resolves to the newly created Equipment object.
 */
export async function addEquipment(
  equipmentData: Omit<
    Equipment,
    "id" | "imageHint" | "qrToken" | "nextExternalCalibration"
  >,
  performingUser: string
): Promise<Equipment> {
  const app = getFirebaseApp();
  const db = getFirestore(app);

  const nextCalibration = calculateNextCalibration(
    equipmentData.lastExternalCalibration,
    equipmentData.externalCalibrationPeriodicity
  );

  const newEquipmentData: Omit<Equipment, "id"> = {
    ...equipmentData,
    lastExternalCalibration: equipmentData.lastExternalCalibration,
    nextExternalCalibration:
      nextCalibration || new Date().toISOString().split("T")[0],
    imageUrl: equipmentData.imageUrl || DEFAULT_IMAGE_URL,
    imageHint: "equipment photo",
    qrToken: "", // Will be replaced by document ID
  };

  const docRef = await addDoc(collection(db, "equipment"), newEquipmentData);

  // Use the document ID as the QR token for a stable identifier
  await updateDoc(docRef, { qrToken: docRef.id });

  // Add "Created" entry in the history sub-collection
  await addMaintenanceToEquipment(
    docRef.id,
    {
      action: "Equipo Creado",
      status: "Completado",
      responsible: performingUser,
      scheduledDate: new Date().toISOString(),
      maintenanceType: "Otro",
    },
    performingUser,
    new Date().toISOString()
  );

  await addActivityLog({
    user: performingUser,
    actionType: "EQUIPMENT_CREATED",
    description: `Created new equipment "${newEquipmentData.instrument}"`,
    details: {
      entityId: docRef.id,
      entityName: newEquipmentData.instrument,
      after: newEquipmentData,
    },
  });

  return {
    id: docRef.id,
    ...newEquipmentData,
    qrToken: docRef.id,
  } as Equipment;
}

/**
 * Updates an existing piece of equipment.
 * @param updatedData The equipment data to update.
 * @param performingUser The name of the user performing the action.
 * @returns A promise that resolves to the updated Equipment object if found, otherwise null.
 */
export async function updateEquipment(
  updatedData: Equipment,
  performingUser: string
): Promise<Equipment | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const docRef = doc(db, "equipment", updatedData.id);

  // Fetch original equipment to log changes
  const originalDoc = await getDoc(docRef);
  const originalData = originalDoc.exists() ? originalDoc.data() : null;

  const nextCalibration = calculateNextCalibration(
    format(new Date(updatedData.lastExternalCalibration), "yyyy-MM-dd"),
    updatedData.externalCalibrationPeriodicity
  );

  const dataToUpdate: Partial<Equipment> = {
    ...updatedData,
    imageUrl: updatedData.imageUrl || DEFAULT_IMAGE_URL,
    nextExternalCalibration:
      nextCalibration || updatedData.nextExternalCalibration,
  };

  // Ensure a QR token exists, using the ID for stability
  if (!dataToUpdate.qrToken) {
    dataToUpdate.qrToken = updatedData.id;
  }

  // Remove id from data to prevent it from being written into the document
  const { id, ...finalData } = dataToUpdate;

  await updateDoc(docRef, finalData);

  await addActivityLog({
    user: performingUser,
    actionType: "EQUIPMENT_UPDATED",
    description: `Updated equipment "${updatedData.instrument}"`,
    details: {
      entityId: updatedData.id,
      entityName: updatedData.instrument,
      before: originalData,
      after: finalData,
    },
  });

  return dataToUpdate as Equipment;
}

/**
 * Deletes a piece of equipment by its ID.
 * @param id The ID of the equipment to delete.
 * @returns A promise that resolves to true if the equipment was deleted, otherwise false.
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  try {
    await deleteDoc(doc(db, "equipment", id));
    // Note: This does not delete the history sub-collection.
    // A cloud function would be needed for that in production.
    return true;
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return false;
  }
}
