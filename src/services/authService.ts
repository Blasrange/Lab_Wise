import type { User, UserLocation } from "@/lib/types";
import { addActivityLog } from "./activityLogService";
import { getFirebaseApp } from "@/firebase/config";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

/**
 * Validates a user's password and returns the user object if successful.
 * This is a Server Action and should only be called from client components.
 * @param email The user's email.
 * @param pass The password to validate.
 * @returns A promise that resolves to the User object (without password) if valid, otherwise null.
 */
export async function validateUserCredentials(
  email: string,
  pass: string
): Promise<User | null> {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, "id">;
        return { id: firebaseUser.uid, ...userData };
      }
    }
    return null;
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    // Optionally log failed login attempts
    await addActivityLog({
      user: "System",
      actionType: "SYSTEM_ERROR",
      description: `Failed login attempt for email: ${email}`,
      details: { error: (error as Error).message },
    });
    return null;
  }
}

/**
 * Finds a user by email, excluding the password.
 * This is a Server Action.
 * @param email The email of the user to find.
 * @returns A promise that resolves to the User object (without password) if found, otherwise null.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("email", "==", email));

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Finds a user by their ID (UID).
 * @param uid The user's unique ID.
 * @returns A promise that resolves to the User object if found, otherwise null.
 */
export async function findUserById(uid: string): Promise<User | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  return null;
}

export async function updateUserLocation(
  userId: string,
  location: UserLocation
): Promise<User | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const userRef = doc(db, "users", userId);

  try {
    const updateData = {
      location: location,
      lastLogin: new Date().toISOString(),
    };

    await updateDoc(userRef, updateData);

    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      return { id: userId, ...updatedUserDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Failed to update user location:", error);
    // Fallback to update just the login time if location update fails
    return await updateLastLogin(userId);
  }
}

export async function updateLastLogin(userId: string): Promise<User | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, { lastLogin: new Date().toISOString() });
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      return { id: userId, ...updatedUserDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Failed to update last login time:", error);
    return null;
  }
}
