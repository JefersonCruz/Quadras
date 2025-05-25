
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Settings, BarChart3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const adminSections = [
    { title: "Gerenciar Usuários", href: "/admin/users", icon: UserCog, description: "Visualize e gerencie todos os usuários da plataforma." },
    { title: "Templates Globais", href: "/admin/templates", icon: Settings, description: "Atualize e adicione novos templates de etiquetas e fichas." },
    // { title: "Planos e Assinaturas", href: "/admin/plans", icon: CreditCard, description: "Gerencie os planos de assinatura e upgrades de conta." },
    // { title: "Estatísticas do Sistema", href: "/admin/system-stats", icon: BarChartBig, description: "Acompanhe métricas de uso e performance da plataforma." },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Painel Administrativo"
        description="Gerencie usuários, templates e configurações da plataforma ANODE Lite."
      />

      <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center"><ShieldCheck className="mr-2 text-primary"/> Acesso Rápido</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => (
            <Card key={section.href} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
                <section.icon className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">{section.description}</p>
                <Button asChild size="sm" className="w-full">
                  <Link href={section.href}>Acessar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Placeholder for future admin-specific widgets or stats */}
       <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Total de Usuários:</strong> <span className="text-primary font-semibold"> (Em breve)</span></p>
              <p><strong>Projetos Criados:</strong> <span className="text-primary font-semibold"> (Em breve)</span></p>
              <p><strong>Etiquetas Geradas:</strong> <span className="text-primary font-semibold"> (Em breve)</span></p>
            </div>
            {/* More detailed stats can go here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Logs de atividades importantes do sistema aparecerão aqui. (Em breve)</p>
            {/* Activity log items */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
