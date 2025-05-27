
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Usuario } from "@/types/firestore";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: Usuario | null;
  isAdmin: boolean;
  loading: boolean; // This will represent whether auth is still being resolved
  db: Firestore;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authResolved, setAuthResolved] = useState(false); // Initially false

  useEffect(() => {
    let didUnsubscribe = false;

    const loadingTimeout = setTimeout(() => {
      if (!didUnsubscribe && !authResolved) { // Only force if not already resolved
        console.warn(
          "AuthContext: Loading timeout reached (15s). Forcing auth to resolved state."
        );
        if (!didUnsubscribe) { // Check again before setting state
          setUser(null); // Default to no user if timeout
          setUserData(null);
          setIsAdmin(false);
          setAuthResolved(true);
        }
      }
    }, 15000);

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (didUnsubscribe) return;

        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            const userDocRef = doc(db, "usuarios", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const appUserData = userDocSnap.data() as Usuario;
              setUserData(appUserData);
              setIsAdmin(appUserData.role === "admin");
            } else {
              console.warn(
                `AuthContext: User document ${firebaseUser.uid} not found.`
              );
              setUserData(null); // Ensure userData is reset if doc not found
              setIsAdmin(false);
            }
          } else {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } catch (error) {
          const err = error as { code?: string; message?: string };
          console.warn("AuthContext: Error fetching user data:", err);
          if (err.code === "auth/network-request-failed") {
            console.warn(
              "⚠️ Firebase Auth: Network request failed. Check internet connection and Firebase service status."
            );
          }
          // Reset user state on error during user data fetch
          if (!didUnsubscribe) {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } finally {
          if (!didUnsubscribe) {
            setAuthResolved(true); // Mark authentication as resolved
            clearTimeout(loadingTimeout);
          }
        }
      });
    } catch (setupError) {
      console.error(
        "AuthContext: Error setting up auth listener:",
        setupError
      );
      if (!didUnsubscribe) {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        setAuthResolved(true); // Resolve auth even on setup error to prevent freeze
        clearTimeout(loadingTimeout);
      }
    }

    return () => {
      didUnsubscribe = true;
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(loadingTimeout);
    };
  }, []); // Empty dependency array: run only on mount and unmount

  if (!authResolved) {
    // This UI is rendered on the server and on the initial client render,
    // before the useEffect hook runs and auth state is resolved.
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm mt-4">Carregando autenticação...</p>
      </div>
    );
  }

  // Once authResolved is true (only on the client, after useEffect),
  // we provide the actual context and render the children.
  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading: !authResolved, db }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
