
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
  loading: boolean;
  db: Firestore;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let didUnsubscribe = false; // Flag to prevent state updates after unmount

    // Fallback timeout to ensure loading doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (!didUnsubscribe && loading) {
        console.warn("AuthContext: Loading timeout reached (15s). Forcing loading to false due to persistent auth state resolution delay (possibly network issues).");
        if (!didUnsubscribe) { // Check again before setting state
            setLoading(false);
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
        }
      }
    }, 15000); // 15 seconds timeout

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (didUnsubscribe) return; // Prevent updates if component unmounted

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
                `AuthContext: Documento do usuário ${firebaseUser.uid} não encontrado.`
              );
              setUserData(null);
              setIsAdmin(false);
            }
          } else {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } catch (error) {
          const err = error as { code?: string; message?: string };
          console.warn("AuthContext: Erro ao buscar dados do usuário:", err);
          if (err.code === "auth/network-request-failed") {
            console.warn("⚠️ Firebase Auth: Network request failed. Check internet connection and Firebase service status.");
          }
          // Reset user state on error during user data fetch
          if (!didUnsubscribe) {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } finally {
          if (!didUnsubscribe) {
            setLoading(false);
            clearTimeout(loadingTimeout); // Clear timeout if successfully loaded/processed
          }
        }
      });
    } catch (setupError) {
      console.error("AuthContext: Erro ao configurar listener de autenticação:", setupError);
      if (!didUnsubscribe) {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        setLoading(false);
        clearTimeout(loadingTimeout); // Clear timeout on setup error
      }
    }

    return () => {
      didUnsubscribe = true;
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(loadingTimeout); // Clear timeout on unmount
    };
  }, []); // Empty dependency array: run only on mount and unmount

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm mt-4">Carregando autenticação...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading, db }}>
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
