
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Templates Globais"
        description="Adicione, edite ou remova templates padrão para etiquetas e fichas técnicas."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Tag className="mr-2 text-primary"/> Templates de Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie os modelos de etiquetas disponíveis para todos os usuários.
            </p>
            <Button disabled>Adicionar Novo Template de Etiqueta</Button>
            {/* Placeholder for list of label templates */}
            <div className="mt-4 p-4 border rounded-md bg-muted/50 min-h-[100px] flex items-center justify-center">
                <p className="text-muted-foreground">Lista de templates de etiquetas (em breve).</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 text-primary"/> Templates de Fichas Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie os modelos de fichas técnicas disponíveis para todos os usuários.
            </p>
            <Button disabled>Adicionar Novo Template de Ficha</Button>
             {/* Placeholder for list of sheet templates */}
            <div className="mt-4 p-4 border rounded-md bg-muted/50 min-h-[100px] flex items-center justify-center">
                <p className="text-muted-foreground">Lista de templates de fichas (em breve).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
