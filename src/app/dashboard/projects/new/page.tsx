
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewProjectRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the projects page with a query param to open the modal
    router.replace("/dashboard/projects?openNewProject=true");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-foreground">Abrindo formulário de novo projeto...</p>
    </div>
  );
}
