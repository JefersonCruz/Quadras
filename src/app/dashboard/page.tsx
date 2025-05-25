
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Briefcase, Tag, NotebookText, Sparkles, Building, PlusCircle } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const quickActions = [
    { title: "Novo Cliente", href: "/dashboard/clients/new", icon: Users, description: "Cadastre um novo cliente rapidamente." },
    { title: "Novo Projeto", href: "/dashboard/projects/new", icon: Briefcase, description: "Inicie um novo projeto para um cliente." },
    { title: "Criar Etiqueta", href: "/dashboard/labels", icon: Tag, description: "Gere etiquetas técnicas para seus projetos." },
    { title: "Gerar Ficha", href: "/dashboard/technical-sheets", icon: NotebookText, description: "Crie fichas técnicas detalhadas." },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Painel Principal" 
        description="Bem-vindo ao ANODE Lite. Gerencie seus clientes, projetos e documentação técnica."
      />

      <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground">Ações Rápidas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.href} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
                <action.icon className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">{action.description}</p>
                <Button asChild size="sm" className="w-full">
                  <Link href={action.href}><PlusCircle className="mr-2 h-4 w-4" /> Ir</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> Sugestões Inteligentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Utilize nossa IA para obter sugestões de templates para etiquetas e fichas técnicas, otimizando seu tempo.
            </p>
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Smart Suggestions Illustration" 
              width={600} 
              height={300} 
              className="rounded-md mb-4"
              data-ai-hint="technology abstract" 
            />
            <Button asChild>
              <Link href="/dashboard/smart-suggestions">Acessar Sugestões IA</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="text-accent"/> Perfil da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Mantenha os dados da sua empresa atualizados para uma apresentação profissional em seus documentos.
            </p>
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Company Profile Illustration" 
              width={600} 
              height={300} 
              className="rounded-md mb-4"
              data-ai-hint="office building" 
            />
            <Button asChild>
              <Link href="/dashboard/company">Gerenciar Perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      
      {/* Placeholder for future charts/widgets */}
      {/* <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground">Visão Geral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Projetos Ativos</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">12</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Clientes Cadastrados</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">45</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Etiquetas Geradas (Mês)</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">230</p></CardContent>
          </Card>
        </div>
      </section> */}
    </div>
  );
}
