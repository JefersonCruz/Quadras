
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { 
  Users, 
  Briefcase, 
  Tag, 
  NotebookText, 
  Sparkles, 
  Building, 
  PlusCircle, 
  Edit3, 
  FileSignature,
  ArrowRight,
  ListChecks,
  Compass
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardPage() {
  const mainActions = [
    { title: "Novo Cliente", href: "/dashboard/clients/new", icon: Users, description: "Cadastre um novo cliente rapidamente." },
    { title: "Novo Projeto", href: "/dashboard/projects/new", icon: Briefcase, description: "Inicie um novo projeto para um cliente." },
    { title: "Criar Etiqueta", href: "/dashboard/labels", icon: Tag, description: "Gere etiquetas técnicas para circuitos." },
  ];

  const additionalResources = [
    { title: "Nova Ficha Técnica", href: "/dashboard/technical-sheets", icon: NotebookText, description: "Elabore fichas técnicas detalhadas.", tooltip: "Criar uma nova Ficha Técnica" },
    { title: "Novo Contrato", href: "/dashboard/contracts/new", icon: FileSignature, description: "Crie contratos de prestação de serviço.", tooltip: "Criar um novo Contrato Digital" },
    { title: "Sugestões com IA", href: "/dashboard/smart-suggestions", icon: Sparkles, description: "Use IA para sugestões de templates.", imageUrl: "https://placehold.co/600x300.png", imageHint: "technology abstract", tooltip: "Explorar Sugestões Inteligentes com IA" },
    { title: "Perfil da Empresa", href: "/dashboard/company", icon: Building, description: "Gerencie os dados da sua empresa.", imageUrl: "https://placehold.co/600x300.png", imageHint: "office building", tooltip: "Gerenciar Perfil da Empresa" },
  ];

  const gettingStartedSteps = [
    { title: "Configure sua Empresa", description: "Preencha os dados em 'Minha Empresa'.", href: "/dashboard/company", icon: Building, tooltip: "Ir para Configurações da Empresa" },
    { title: "Adicione seu Primeiro Cliente", description: "Cadastre um cliente na seção 'Clientes'.", href: "/dashboard/clients/new", icon: Users, tooltip: "Adicionar Novo Cliente" },
    { title: "Crie um Projeto", description: "Inicie um projeto e vincule-o a um cliente.", href: "/dashboard/projects/new", icon: Briefcase, tooltip: "Criar Novo Projeto" },
    { title: "Explore as Funcionalidades", description: "Utilize Etiquetas, Fichas, Contratos e mais.", href: "/dashboard/labels", icon: Edit3, tooltip: "Explorar Etiquetas" },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-10">
        <PageHeader
          title="Bem-vindo ao Painel ANODE Lite!"
          description="Seu centro de controle para gestão eficiente de clientes, projetos e documentação técnica."
        />

        {/* Ações Principais */}
        <section>
          <h3 className="text-2xl font-semibold mb-5 text-foreground flex items-center"><Compass className="mr-3 h-7 w-7 text-primary"/>Ações Principais</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mainActions.map((action) => (
              <Card key={action.href} className="hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <CardTitle className="text-xl font-semibold">{action.title}</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-md">
                    <action.icon className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground mb-5">{action.description}</p>
                </CardContent>
                <CardFooter>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild size="default" className="w-full">
                        <Link href={action.href}><PlusCircle className="mr-2" /> Acessar</Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ir para {action.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Guia de Início Rápido */}
        <section>
          <Card className="bg-card/70 border-primary/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <ListChecks className="mr-3 h-7 w-7 text-primary" />Guia de Início Rápido (Launchpad)
              </CardTitle>
              <CardDescription>Siga estes passos para configurar e começar a usar o ANODE Lite.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-4">
                {gettingStartedSteps.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-4 pb-3 border-b border-border last:border-b-0 last:pb-0">
                    <div className="flex-shrink-0 mt-1 p-2 bg-primary/10 text-primary rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">
                       {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link href={step.href}><ArrowRight className="h-4 w-4" /></Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{step.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
               <div className="pt-3 text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="link">
                      <Link href="/dashboard/tutorial">Ver Tutorial Completo <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Acessar o guia detalhado de uso da plataforma</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </section>
        
        {/* Recursos Adicionais */}
        <section>
          <h3 className="text-2xl font-semibold mb-5 text-foreground">Recursos Adicionais</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {additionalResources.map((resource) => (
              <Card key={resource.href} className="hover:shadow-lg transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden">
                {resource.imageUrl && (
                  <div className="relative h-40 w-full">
                    <Image 
                      src={resource.imageUrl} 
                      alt={`Imagem para ${resource.title}`} 
                      layout="fill" 
                      objectFit="cover"
                      data-ai-hint={resource.imageHint || "feature illustration"}
                    />
                  </div>
                )}
                <CardHeader className={resource.imageUrl ? "pt-4" : ""}>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <resource.icon className="h-5 w-5 mr-2 text-accent" />
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground h-10">{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Content can be added here if needed later */}
                </CardContent>
                <CardFooter>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={resource.href}>Acessar {resource.title}</Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{resource.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </TooltipProvider>
  );
}
