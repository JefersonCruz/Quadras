
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  Tag,
  FileText,
  Building,
  LogOut,
  Settings,
  UserCog,
  Zap,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  LayoutGrid,
  Sparkles,
  NotebookText,
  FileSignature,
  Calculator, // Added for Orçamentos
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"; 
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const AnodeLogo = () => (
  <div className="inline-flex items-center justify-center rounded-md bg-primary p-2">
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  </div>
);


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { state: sidebarState } = useSidebar(); 

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout realizado", description: "Você foi desconectado." });
      router.push("/login");
    } catch (error) {
      toast({ title: "Erro no Logout", description: "Não foi possível desconectar.", variant: "destructive" });
    }
  };

  const commonMenuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/dashboard/clients", label: "Clientes", icon: Users },
    { href: "/dashboard/projects", label: "Projetos", icon: Briefcase },
    { href: "/dashboard/quotes", label: "Orçamentos", icon: Calculator }, // New Quotes Link
    { href: "/dashboard/labels", label: "Etiquetas", icon: Tag },
    { href: "/dashboard/technical-sheets", label: "Fichas Técnicas", icon: NotebookText },
    { href: "/dashboard/contracts", label: "Contratos", icon: FileSignature },
    { href: "/dashboard/smart-suggestions", label: "Sugestões IA", icon: Sparkles },
    { href: "/dashboard/company", label: "Minha Empresa", icon: Building },
  ];

  const adminMenuItems = [
    { href: "/admin", label: "Painel Admin", icon: ShieldCheck },
    { href: "/admin/users", label: "Usuários", icon: UserCog },
    { href: "/admin/templates", label: "Templates Globais", icon: Settings },
  ];

  const menuItems = isAdmin ? [...commonMenuItems, ...adminMenuItems] : commonMenuItems;

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader className="p-4 flex items-center gap-2">
        <AnodeLogo />
        {sidebarState === "expanded" && (
           <h1 className="text-xl font-semibold text-sidebar-foreground">ANODE Lite</h1>
        )}
        <SidebarTrigger className="ml-auto md:hidden" />
      </SidebarHeader>
      
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href)) || (item.href === "/admin" && pathname.startsWith("/admin"))}
                  tooltip={item.label}
                  aria-label={item.label}
                  className="justify-start"
                >
                  <item.icon className="shrink-0" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="justify-start" tooltip="Sair" aria-label="Sair">
              <LogOut className="shrink-0" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {sidebarState === "expanded" && user && (
          <div className="mt-4 p-2 text-xs text-center text-sidebar-foreground/70">
            <p>{user.displayName || user.email}</p>
            <p>Versão 1.0.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
