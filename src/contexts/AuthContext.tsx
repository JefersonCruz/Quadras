
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
  loading: boolean; // Indicates if auth state is still being determined
  db: Firestore;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // Start as true, set to false once auth state is known

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "usuarios", firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const appUserData = userDocSnap.data() as Usuario;
            setUserData(appUserData);
            setIsAdmin(appUserData.role === "admin");
          } else {
            console.warn(`[AuthContext] User document ${firebaseUser.uid} not found in Firestore.`);
            setUserData(null);
            setIsAdmin(false);
          }
        } catch (firestoreError) {
          console.error("[AuthContext] Error fetching user data from Firestore:", firestoreError);
          setUserData(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false); // Auth state resolved
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm mt-4">Verificando autenticação...</p>
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
