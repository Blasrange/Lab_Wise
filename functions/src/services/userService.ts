import type { User } from "../types";
import { getFirestore, collection, getDocs } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

export async function getUsers(): Promise<User[]> {
  const db = getFirestore(admin.app());
  const usersCollection = collection(db, "users");
  const querySnapshot = await getDocs(usersCollection);
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() } as User);
  });
  return users;
}
