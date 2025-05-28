
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
  loading: boolean; // This will be !authResolved
  db: Firestore;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authResolved, setAuthResolved] = useState(false); // Key state to manage initial loading

  useEffect(() => {
    let didUnsubscribe = false;
    console.log("[AuthContext] Mount. didUnsubscribe=false. Setting up onAuthStateChanged and timeout.");

    const loadingTimeout = setTimeout(() => {
      if (!didUnsubscribe && !authResolved) {
        console.warn("[AuthContext] Auth check TIMEOUT (15s). Forcing authResolved=true.");
        if (!didUnsubscribe) { // Double check before setting state
          setUser(null);
          setUserData(null);
          setIsAdmin(false);
          setAuthResolved(true);
        }
      }
    }, 15000);

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("[AuthContext] onAuthStateChanged triggered. firebaseUser UID:", firebaseUser ? firebaseUser.uid : "null");
        if (didUnsubscribe) {
          console.log("[AuthContext] onAuthStateChanged: Component unmounted, exiting.");
          return;
        }

        try {
          if (firebaseUser) {
            console.log("[AuthContext] firebaseUser exists. UID:", firebaseUser.uid);
            if (!didUnsubscribe) setUser(firebaseUser); // Set Firebase user immediately
            try {
              console.log("[AuthContext] Attempting to get userDocRef for UID:", firebaseUser.uid);
              const userDocRef = doc(db, "usuarios", firebaseUser.uid);
              console.log("[AuthContext] userDocRef created. Attempting getDoc.");
              const userDocSnap = await getDoc(userDocRef);
              console.log("[AuthContext] getDoc completed. userDocSnap.exists():", userDocSnap.exists());

              if (userDocSnap.exists()) {
                const appUserData = userDocSnap.data() as Usuario;
                if (!didUnsubscribe) {
                  setUserData(appUserData);
                  setIsAdmin(appUserData.role === "admin");
                }
                console.log("[AuthContext] User data from Firestore:", appUserData);
              } else {
                console.warn(`[AuthContext] User document ${firebaseUser.uid} not found in Firestore. Resetting userData/isAdmin.`);
                if (!didUnsubscribe) {
                  setUserData(null);
                  setIsAdmin(false);
                }
              }
            } catch (firestoreError: any) {
              console.error("[AuthContext] Error fetching user data from Firestore:", firestoreError);
              if (!didUnsubscribe) {
                // Still keep firebaseUser if auth is successful, but clear app-specific data
                setUserData(null);
                setIsAdmin(false);
              }
            }
          } else {
            console.log("[AuthContext] No firebaseUser. Resetting user, userData, isAdmin.");
            if (!didUnsubscribe) {
              setUser(null);
              setUserData(null);
              setIsAdmin(false);
            }
          }
        } catch (innerError: any) {
          // This catch block handles errors within the async part of onAuthStateChanged
          console.error("[AuthContext] Inner error in onAuthStateChanged async callback:", innerError);
          if (!didUnsubscribe) {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } finally {
          if (!didUnsubscribe) {
            console.log("[AuthContext] onAuthStateChanged finally block. Setting authResolved=true.");
            setAuthResolved(true);
            clearTimeout(loadingTimeout);
          }
        }
      });
    } catch (setupError) {
      // This catch block handles errors if onAuthStateChanged itself fails to set up
      console.error("[AuthContext] CRITICAL: Error setting up onAuthStateChanged listener:", setupError);
      if (!didUnsubscribe) {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        console.log("[AuthContext] Setting authResolved=true in onAuthStateChanged SETUP CATCH block due to critical error.");
        setAuthResolved(true);
        clearTimeout(loadingTimeout);
      }
    }

    return () => {
      console.log("[AuthContext] Cleanup. Setting didUnsubscribe=true.");
      didUnsubscribe = true;
      if (unsubscribe) {
        console.log("[AuthContext] Unsubscribing from onAuthStateChanged.");
        unsubscribe();
      }
      clearTimeout(loadingTimeout);
      console.log("[AuthContext] Cleared loadingTimeout in cleanup.");
    };
  }, []); // Empty dependency array ensures this runs once on mount

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
