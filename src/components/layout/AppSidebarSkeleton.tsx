
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const AnodeLogoSkeleton = () => (
  <Skeleton className="h-8 w-8 rounded-md bg-primary/10" />
);

export function AppSidebarSkeleton() {
  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="pointer-events-none bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-4 flex items-center gap-2">
        <AnodeLogoSkeleton />
        <Skeleton className="h-6 w-24 bg-primary/10" /> {/* Placeholder for "ANODE Lite" title */}
      </SidebarHeader>
      
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {[...Array(6)].map((_, index) => (
            <SidebarMenuSkeleton key={index} showIcon={true} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 mt-auto">
        <SidebarMenu>
          <SidebarMenuSkeleton showIcon={true} /> {/* Logout skeleton */}
        </SidebarMenu>
        <div className="mt-4 p-2 text-xs text-center text-sidebar-foreground/70 opacity-50">
          <Skeleton className="h-4 w-32 mx-auto mb-1 bg-primary/10" />
          <Skeleton className="h-4 w-20 mx-auto bg-primary/10" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
