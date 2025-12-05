import type { EquipmentHistory } from "../types";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

export async function getHistoryForEquipment(
  equipmentId: string
): Promise<EquipmentHistory[]> {
  const db = getFirestore(admin.app());
  const historyCollection = collection(db, "equipment-history");
  const q = query(historyCollection, where("equipmentId", "==", equipmentId));
  const querySnapshot = await getDocs(q);
  const history: EquipmentHistory[] = [];
  querySnapshot.forEach((doc) => {
    history.push({ id: doc.id, ...doc.data() } as EquipmentHistory);
  });
  return history.sort(
    (a, b) =>
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );
}
