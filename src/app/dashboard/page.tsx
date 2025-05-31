import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Briefcase, Tag, NotebookText, Sparkles, Building, PlusCircle, Edit3, FileSignature } from "lucide-react";
// Removed Image from next/image for debugging

export default function DashboardPage() {
  const quickActions = [
    { title: "Novo Cliente", href: "/dashboard/clients/new", icon: Users, description: "Cadastre um novo cliente para seus projetos." },
    { title: "Novo Projeto", href: "/dashboard/projects/new", icon: Briefcase, description: "Inicie um novo projeto para um cliente existente." },
    { title: "Criar Etiqueta", href: "/dashboard/labels", icon: Tag, description: "Gere etiquetas técnicas para identificar circuitos." },
    { title: "Nova Ficha Técnica", href: "/dashboard/technical-sheets", icon: NotebookText, description: "Elabore fichas técnicas detalhadas." },
    { title: "Novo Contrato", href: "/dashboard/contracts/new", icon: FileSignature, description: "Crie contratos de prestação de serviço." },
  ];

  const gettingStartedSteps = [
    { title: "1. Configure sua Empresa", description: "Acesse 'Minha Empresa' e preencha os dados. Eles serão usados em seus documentos.", href: "/dashboard/company", icon: Building },
    { title: "2. Adicione seu Primeiro Cliente", description: "Vá para 'Clientes' e cadastre as informações do seu primeiro cliente.", href: "/dashboard/clients/new", icon: Users },
    { title: "3. Crie um Projeto", description: "Em 'Projetos', inicie um novo projeto e vincule-o a um cliente.", href: "/dashboard/projects/new", icon: Briefcase },
    { title: "4. Explore as Funcionalidades", description: "Use as seções 'Etiquetas', 'Fichas Técnicas' e 'Contratos' para documentar e gerenciar seu trabalho.", href: "/dashboard/labels", icon: Edit3 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bem-vindo ao Painel ANODE Lite!"
        description="Seu centro de controle para gerenciar clientes, projetos e documentação técnica de forma eficiente."
      />

      <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground">Ações Rápidas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Card key={action.href} className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{action.title}</CardTitle>
                <action.icon className="h-6 w-6 text-accent" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4 h-10">{action.description}</p>
                <Button asChild size="sm" className="w-full">
                  <Link href={action.href}><PlusCircle className="mr-2 h-4 w-4" /> Acessar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Dicas para Começar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gettingStartedSteps.map((step) => (
            <Card key={step.title} className="bg-card/70 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription className="text-sm">{step.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={step.href}>Ir para {step.title.substring(3)}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent h-5 w-5"/> Sugestões Inteligentes com IA</CardTitle>
            <CardDescription>Acelere sua documentação com sugestões de templates baseadas em IA para etiquetas e fichas técnicas.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for Image */}
            <div 
              className="relative aspect-video mb-4 rounded-md overflow-hidden bg-muted flex items-center justify-center"
              data-ai-hint="technology abstract"
            >
              <p className="text-muted-foreground text-sm">Visualização de IA</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/smart-suggestions">Explorar Sugestões IA</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="text-accent h-5 w-5"/> Perfil da Sua Empresa</CardTitle>
            <CardDescription>Mantenha os dados da sua empresa atualizados para profissionalismo em todos os seus documentos e relatórios.</CardDescription>
          </CardHeader>
          <CardContent>
             {/* Placeholder for Image */}
            <div 
              className="relative aspect-video mb-4 rounded-md overflow-hidden bg-muted flex items-center justify-center"
              data-ai-hint="office building"
            >
              <p className="text-muted-foreground text-sm">Visualização Perfil Empresa</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/company">Gerenciar Perfil da Empresa</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
