
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import type { Firestore } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            const userDocRef = doc(db, "usuarios", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const appUserData = userDocSnap.data() as Usuario;
              setUserData(appUserData);
              setIsAdmin(appUserData.role === 'admin');
            } else {
              console.warn(`No Firestore document found for user ${firebaseUser.uid}. User will be treated as non-admin with no specific app data.`);
              setUserData(null);
              setIsAdmin(false);
            }
          } else {
            setUser(null);
            setUserData(null);
            setIsAdmin(false);
          }
        } catch (error: any) {
          // This catch is for errors during Firestore document fetching or processing
          console.warn("AuthContext: Error during user data processing:", error);
          if (error.code === 'auth/network-request-failed') {
            console.warn("AuthContext: Firebase Authentication network request failed. User will be treated as unauthenticated.");
          }
          setUser(null);
          setUserData(null);
          setIsAdmin(false);
        } finally {
          // console.log("AuthContext: Setting loading to false from onAuthStateChanged callback's finally block.");
          setLoading(false);
        }
      });
    } catch (e: any) {
      // This catch is for errors during the onAuthStateChanged listener setup itself
      console.error("AuthContext: Error setting up onAuthStateChanged listener:", e);
      setUser(null);
      setUserData(null);
      setIsAdmin(false);
      setLoading(false); // Ensure loading is false if setup fails
    }

    return () => {
      if (unsubscribe) {
        // console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
        unsubscribe();
      }
    };
  }, []); // Empty dependency array is correct for this effect

  if (loading) {
    // Simplified loading state
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
