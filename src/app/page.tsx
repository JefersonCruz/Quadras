
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, FileText, FileSignature, Briefcase, Sparkles, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const AnodeLogoFull = () => (
  <div className="flex items-center gap-2 text-2xl font-bold text-primary">
    <Zap className="h-7 w-7" />
    <span>ANODE Lite</span>
  </div>
);


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Carregando ANODE Lite...</p>
      </div>
    );
  }

  // If user is logged in, this component will redirect, so this content is for unauthenticated users.
  if (user) return null; // Avoid rendering homepage content if user is present (before redirect effect runs)

  const features = [
    {
      icon: <FileText className="h-10 w-10 text-primary mb-4" />,
      title: "Fichas Técnicas Inteligentes",
      description: "Gere fichas técnicas detalhadas e padronizadas para seus projetos elétricos com facilidade.",
    },
    {
      icon: <FileSignature className="h-10 w-10 text-primary mb-4" />,
      title: "Contratos Digitais Seguros",
      description: "Crie e gerencie contratos de prestação de serviço com assinatura eletrônica integrada.",
    },
    {
      icon: <Briefcase className="h-10 w-10 text-primary mb-4" />,
      title: "Gestão de Clientes e Projetos",
      description: "Organize seus clientes e projetos em um só lugar, simplificando seu fluxo de trabalho.",
    },
    {
      icon: <Sparkles className="h-10 w-10 text-primary mb-4" />,
      title: "Sugestões com IA",
      description: "Receba sugestões inteligentes de templates e otimize a criação de seus documentos.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <AnodeLogoFull />
          <nav className="flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Funcionalidades
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Login
            </Link>
            <Button asChild>
              <Link href="/signup">Cadastre-se Grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32 bg-gradient-to-br from-background to-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Simplifique sua Documentação Técnica
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
              ANODE Lite é a plataforma SaaS ideal para eletricistas e empresas de manutenção predial, focada na gestão eficiente e geração de fichas técnicas e contratos digitais.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/signup">
                  Comece Agora (Grátis) <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="#features">Saber Mais</Link>
              </Button>
            </div>
            <div className="mt-16">
              <Image
                src="https://placehold.co/1200x600.png"
                alt="Plataforma ANODE Lite em uso"
                width={1000}
                height={500}
                className="rounded-xl shadow-2xl mx-auto"
                data-ai-hint="modern technology abstract"
                priority
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Tudo que você precisa para uma gestão eficiente
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Desde a criação de documentos até a gestão de clientes, ANODE Lite tem as ferramentas certas.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="p-6 bg-card rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 md:py-28 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pronto para otimizar seu trabalho?
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
              Junte-se a centenas de profissionais que já estão transformando sua rotina com ANODE Lite.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="text-lg px-10 py-6">
                <Link href="/signup">
                  Criar Minha Conta <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 text-center">
          <AnodeLogoFull />
          <p className="mt-4 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ANODE Lite. Todos os direitos reservados.
          </p>
          <div className="mt-3 space-x-4">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Política de Privacidade</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary">Termos de Serviço</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
