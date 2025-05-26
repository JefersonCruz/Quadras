
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
import { AppSidebarSkeleton } from "@/components/layout/AppSidebarSkeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userDocRef = doc(db, "usuarios", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const appUserData = userDocSnap.data() as Usuario;
            setUserData(appUserData);
            // Check for admin role based on Firestore document first for simplicity
            // For more security, custom claims via Firebase Functions are recommended for admin roles
            setIsAdmin(appUserData.role === 'admin');
          } else {
            // This case might happen if user is authenticated with Firebase Auth
            // but their Firestore document wasn't created or was deleted.
            console.warn(`No Firestore document found for user ${firebaseUser.uid}`);
            setUserData(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setUserData(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error during auth state change processing:", error);
        // Ensure app doesn't get stuck in loading due to an error here
        setUser(null); // Reset to a known safe state
        setUserData(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <SidebarProvider defaultOpen={true}>
        <AppSidebarSkeleton />
        <SidebarInset>
          {/* Placeholder for AppHeader */}
          <div className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 px-4 md:px-6">
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              {/* Placeholder for user menu icon skeleton */}
              <div className="h-8 w-8 rounded-full bg-muted" />
            </div>
          </div>
          {/* Placeholder for main content with spinner */}
          <main className="flex flex-1 items-center justify-center p-4 md:p-6 lg:p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </SidebarInset>
      </SidebarProvider>
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
