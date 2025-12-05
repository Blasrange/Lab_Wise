import type { Equipment } from "../types";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase-admin/firestore";
import * as admin from "firebase-admin";

export async function getEquipments(): Promise<Equipment[]> {
  const db = getFirestore(admin.app());
  const equipmentCollection = collection(db, "equipment");
  const querySnapshot = await getDocs(equipmentCollection);
  const equipments: Equipment[] = [];
  querySnapshot.forEach((doc) => {
    equipments.push({ id: doc.id, ...doc.data() } as Equipment);
  });
  return equipments.sort((a, b) => (a.instrument > b.instrument ? 1 : -1));
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const db = getFirestore(admin.app());
  const docRef = doc(db, "equipment", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Equipment;
  }
  return null;
}

export async function getEquipmentByInternalCode(
  internalCode: string
): Promise<Equipment | null> {
  const db = getFirestore(admin.app());
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
