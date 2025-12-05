"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { useToast } from "./use-toast";
import { useI18n } from "@/lib/i18n/i18n-provider";
import {
  findUserById,
  updateUserLocation,
  updateLastLogin,
} from "@/services/authService";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseApp } from "@/firebase/config";
import { addActivityLog } from "@/services/activityLogService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useI18n();
  const router = useRouter();

  const handleAuthChange = useCallback(
    async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser = await findUserById(firebaseUser.uid);
        if (appUser) {
          setUser(appUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const auth = getAuth(getFirebaseApp());
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      setLoading(true);
      const appUser = await findUserById(firebaseUser.uid);
      if (appUser) {
        setUser(appUser);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        pass
      );
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        let appUser = await findUserById(firebaseUser.uid);
        if (appUser) {
          // Try to get location, but don't block login
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const response = await fetch(
                  `/api/location-details?lat=${latitude}&lon=${longitude}`
                );
                const locationData = await response.json();

                const updatedUser = await updateUserLocation(appUser!.id, {
                  latitude,
                  longitude,
                  city: locationData.city || "Unknown",
                  country: locationData.country || "Unknown",
                });
                if (updatedUser) {
                  setUser(updatedUser); // Update user state with location
                }
              } catch (apiError) {
                console.warn(
                  "Could not get location details, saving coordinates only.",
                  apiError
                );
                // Fallback to saving just coordinates and last login
                const updatedUser = await updateUserLocation(appUser!.id, {
                  latitude,
                  longitude,
                  city: "N/A",
                  country: "N/A",
                });
                if (updatedUser) {
                  setUser(updatedUser);
                }
              }
            },
            async (error) => {
              console.warn("Could not get user location:", error.message);
              // If location fails, still update last login
              const updatedUser = await updateLastLogin(appUser!.id);
              if (updatedUser) {
                setUser(updatedUser);
              }
            }
          );

          addActivityLog({
            user: appUser.name,
            actionType: "USER_LOGIN",
            description: `User ${appUser.name} logged in.`,
            details: { userId: appUser.id, email: appUser.email },
          });

          // Set user immediately, don't wait for location
          setUser(appUser);
          toast({
            variant: "success",
            title: t("login.toast.success_title"),
            description: t("login.toast.success_description", {
              name: appUser.name,
            }),
          });
          return;
        }
      }
      throw new Error("User data not found in database.");
    } catch (error) {
      console.error("Login Error:", error);
      throw new Error(t("login.errors.invalid_credentials"));
    }
  };

  const logout = async () => {
    const auth = getAuth(getFirebaseApp());
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting user to null
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
      });
    }
  };

  const value = { user, loading, login, logout, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
