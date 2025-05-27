
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, Bell, Palette, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SettingsPage() {
  const settingsSections = [
    { 
      title: "Perfil do Usuário", 
      description: "Atualize suas informações pessoais e foto de perfil.", 
      icon: User, 
      href: "/dashboard/settings/profile", // Example link
      disabled: true 
    },
    { 
      title: "Notificações", 
      description: "Gerencie como você recebe alertas e atualizações.", 
      icon: Bell, 
      href: "/dashboard/settings/notifications",
      disabled: true 
    },
    { 
      title: "Aparência", 
      description: "Personalize o tema e a aparência da plataforma.", 
      icon: Palette, 
      href: "/dashboard/settings/appearance",
      disabled: true 
    },
    { 
      title: "Segurança da Conta", 
      description: "Altere sua senha e gerencie a autenticação de dois fatores.", 
      icon: Shield, 
      href: "/dashboard/settings/security",
      disabled: true 
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações da Conta"
        description="Gerencie suas preferências e configurações de conta."
      />
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <section.icon className="mr-3 h-6 w-6 text-primary" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled={section.disabled} asChild>
                {section.disabled ? (
                  <span>Gerenciar (Em breve)</span>
                ) : (
                  <Link href={section.href}>Gerenciar</Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-accent" />
            Outras Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Mais opções de configuração da conta do usuário aparecerão aqui. (Em breve)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
