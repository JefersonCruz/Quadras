
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewClientRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the clients page with a query param to open the modal
    router.replace("/dashboard/clients?openNewClient=true");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Abrindo formulário de novo cliente...</p>
    </div>
  );
}
