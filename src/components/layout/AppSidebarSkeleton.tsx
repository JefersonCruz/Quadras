
"use client";

// import { Skeleton } from "@/components/ui/skeleton"; // Removed import

export function AppSidebarSkeleton() {
  return (
    <div className="hidden md:flex flex-col h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-md bg-sidebar-accent/30 animate-pulse" />
        <div className="h-6 w-32 bg-sidebar-accent/30 animate-pulse" />
      </div>
      {/* Menu Items Skeleton */}
      <div className="flex-grow space-y-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-sidebar-accent/30 animate-pulse" />
            <div className="h-5 w-full bg-sidebar-accent/30 animate-pulse" />
          </div>
        ))}
      </div>
      {/* Footer Skeleton */}
      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-sidebar-accent/30 animate-pulse" />
            <div className="h-5 w-full bg-sidebar-accent/30 animate-pulse" />
        </div>
        <div className="pt-4 text-center space-y-1">
            <div className="h-3 w-3/4 mx-auto bg-sidebar-accent/30 animate-pulse" />
            <div className="h-3 w-1/2 mx-auto bg-sidebar-accent/30 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
