
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações da Conta"
        description="Gerencie suas preferências e configurações de conta."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6 text-primary" />
            Preferências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Opções de configuração da conta do usuário aparecerão aqui. (Em breve)
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium">Notificações</h4>
              <p className="text-sm text-muted-foreground">Gerenciar preferências de notificação.</p>
            </div>
            <div>
              <h4 className="font-medium">Tema</h4>
              <p className="text-sm text-muted-foreground">Escolher entre tema claro ou escuro.</p>
            </div>
             <div>
              <h4 className="font-medium">Segurança</h4>
              <p className="text-sm text-muted-foreground">Alterar senha, ativar 2FA.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
