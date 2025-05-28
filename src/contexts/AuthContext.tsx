
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
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let didUnsubscribe = false;
    console.log("[AuthContext] useEffect mount. didUnsubscribe initially false.");

    const loadingTimeout = setTimeout(() => {
      if (!didUnsubscribe && !authResolved) {
        console.warn(
          "[AuthContext] Auth check timeout (15s). Forcing authResolved=true."
        );
        if (!didUnsubscribe) {
          setUser(null);
          setUserData(null);
          setIsAdmin(false);
          console.log("[AuthContext] Setting authResolved to true in TIMEOUT.");
          setAuthResolved(true);
        }
      }
    }, 15000);

    let unsubscribe: (() => void) | undefined;

    try {
      console.log("[AuthContext] Setting up onAuthStateChanged listener.");
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("[AuthContext] onAuthStateChanged triggered. firebaseUser:", firebaseUser ? firebaseUser.uid : null);
        if (didUnsubscribe) {
          console.log("[AuthContext] onAuthStateChanged: Component unmounted, aborting state updates.");
          return;
        }

        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            const userDocRef = doc(db, "usuarios", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const appUserData = userDocSnap.data() as Usuario;
              setUserData(appUserData);
              setIsAdmin(appUserData.role === "admin");
              console.log("[AuthContext] User data found:", appUserData);
            } else {
              console.warn(
                `[AuthContext] User document ${firebaseUser.uid} not found in Firestore.`
              );
              setUserData(null);
              setIsAdmin(false);
            }
          } else {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
            console.log("[AuthContext] No firebaseUser, user set to null.");
          }
        } catch (error: any) {
          const err = error as { code?: string; message?: string };
          console.warn("[AuthContext] Error fetching user data from Firestore:", err);
          if (err.code === "auth/network-request-failed") {
            console.warn(
              "⚠️ Firebase Auth: Network request failed. Check internet connection and Firebase service status."
            );
          }
          if (!didUnsubscribe) {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } finally {
          if (!didUnsubscribe) {
            console.log("[AuthContext] Setting authResolved to true in onAuthStateChanged FINALLY block.");
            setAuthResolved(true);
            clearTimeout(loadingTimeout);
          }
        }
      });
    } catch (setupError) {
      console.error(
        "[AuthContext] CRITICAL: Error setting up onAuthStateChanged listener:",
        setupError
      );
      if (!didUnsubscribe) {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        console.log("[AuthContext] Setting authResolved to true in onAuthStateChanged SETUP CATCH block.");
        setAuthResolved(true);
        clearTimeout(loadingTimeout);
      }
    }

    return () => {
      console.log("[AuthContext] useEffect cleanup. Setting didUnsubscribe to true.");
      didUnsubscribe = true;
      if (unsubscribe) {
        console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
        unsubscribe();
      }
      clearTimeout(loadingTimeout);
      console.log("[AuthContext] Cleared loadingTimeout.");
    };
  }, []);

  if (!authResolved) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm mt-4">Carregando autenticação...</p>
      </div>
    );
  }

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
