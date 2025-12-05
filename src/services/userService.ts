/**
 * @fileoverview Service for handling user data operations.
 * This service uses Firebase Firestore and Firebase Auth.
 */

import type { User } from "@/lib/types";
import { addActivityLog } from "./activityLogService";
import { firebaseConfig, getFirebaseApp } from "@/firebase/config";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { initializeApp, getApp, deleteApp } from "firebase/app";

/**
 * Retrieves the list of all users.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(): Promise<User[]> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const usersCollection = collection(db, "users");
  const querySnapshot = await getDocs(usersCollection);
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() } as User);
  });
  return users;
}

/**
 * Adds a new user to Firebase Auth and Firestore.
 * This function creates a secondary Firebase app instance to create the user,
 * which prevents the current admin from being logged out.
 * @param userData The user data to add.
 * @param performingUser The name of the user performing the action.
 * @returns A promise that resolves to the newly created User object.
 */
export async function addUser(
  userData: Omit<User, "id" | "avatar">,
  performingUser: string
): Promise<User> {
  const secondaryAppName = "secondary-auth-app";
  let secondaryApp;

  try {
    secondaryApp = getApp(secondaryAppName);
  } catch (error) {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);
  const db = getFirestore(getFirebaseApp()); // Use the main app's firestore instance

  if (!userData.password) {
    throw new Error("Password is required to create a new user.");
  }

  try {
    // Create user with the secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email,
      userData.password
    );
    const firebaseUser = userCredential.user;

    const { password, ...userDataToSave } = userData;

    const newUser: Omit<User, "id"> = {
      ...userDataToSave,
      avatar: `/avatars/0${Math.floor(Math.random() * 5) + 1}.png`,
    };

    // Save user data to Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);

    // Log the activity
    await addActivityLog({
      user: performingUser,
      actionType: "USER_CREATED",
      description: `Created new user "${newUser.name}" with role ${newUser.role}.`,
      details: {
        entityId: firebaseUser.uid,
        entityName: newUser.name,
        role: newUser.role,
        after: newUser,
      },
    });

    // Clean up the secondary app instance
    deleteApp(secondaryApp).catch((err) =>
      console.error("Failed to delete secondary app", err)
    );

    return { id: firebaseUser.uid, ...newUser } as User;
  } catch (error: any) {
    // Clean up the secondary app instance on error as well
    deleteApp(secondaryApp).catch((err) =>
      console.error("Failed to delete secondary app on error", err)
    );

    if (error.code === "auth/email-already-in-use") {
      throw new Error("email-in-use");
    }
    console.error("Error creating user: ", error);
    throw error;
  }
}

/**
 * Updates an existing user in Firestore.
 * @param updatedUser The user data to update.
 * @param performingUser The name of the user performing the action.
 * @returns A promise that resolves to the updated User object if found, otherwise null.
 */
export async function updateUser(
  updatedUser: User,
  performingUser: string
): Promise<User | null> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  const userRef = doc(db, "users", updatedUser.id);
  const { id, password, ...dataToUpdate } = updatedUser;

  // Fetch original user to log changes correctly
  const originalUserDoc = await getDoc(userRef);
  const originalUser = originalUserDoc.data() as User | undefined;

  await updateDoc(userRef, dataToUpdate);

  if (originalUser && originalUser.status !== updatedUser.status) {
    await addActivityLog({
      user: performingUser,
      actionType: "USER_STATUS_TOGGLED",
      description: `Toggled status for user "${updatedUser.name}" to ${updatedUser.status}.`,
      details: {
        entityId: updatedUser.id,
        entityName: updatedUser.name,
        newStatus: updatedUser.status,
        before: originalUser,
        after: dataToUpdate,
      },
    });
  } else {
    await addActivityLog({
      user: performingUser,
      actionType: "USER_UPDATED",
      description: `Updated user profile for "${updatedUser.name}".`,
      details: {
        entityId: updatedUser.id,
        entityName: updatedUser.name,
        before: originalUser,
        after: dataToUpdate,
      },
    });
  }

  return updatedUser;
}

/**
 * Deletes a user from Firestore. Note: This does not delete the user from Firebase Auth.
 * @param id The ID of the user to delete.
 * @returns A promise that resolves to true if the user was deleted, otherwise false.
 */
export async function deleteUser(id: string): Promise<boolean> {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  try {
    await deleteDoc(doc(db, "users", id));
    // TODO: Also delete user from Firebase Auth. This requires admin privileges.
    return true;
  } catch (error) {
    console.error("Error deleting user: ", error);
    return false;
  }
}
