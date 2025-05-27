
"use client"; // Added "use client" as useToast can only be used in client components

import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText, Tag, Edit, Trash2, PlusCircle } from "lucide-react"; // Added PlusCircle
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast"; // Added useToast

// Mock data for label templates
const mockLabelTemplates = [
  { id: "1", name: "Padrão Residencial - Iluminação", description: "Etiqueta para circuitos de iluminação em quadros residenciais." },
  { id: "2", name: "Padrão Residencial - Tomadas TUG", description: "Etiqueta para circuitos de Tomadas de Uso Geral." },
  { id: "3", name: "Padrão Comercial - Força Motriz", description: "Etiqueta para motores e equipamentos de força." },
  { id: "4", name: "IDR Geral", description: "Etiqueta para Dispositivo Diferencial Residual geral." },
  { id: "5", name: "DPS Geral", description: "Etiqueta para Dispositivo de Proteção contra Surtos geral." },
];

export default function AdminTemplatesPage() {
  const { toast } = useToast(); // Initialized toast

  const handleAddNewLabelTemplate = () => {
    toast({
      title: "Em Desenvolvimento",
      description: "A funcionalidade para adicionar novos templates de etiqueta está em desenvolvimento.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Templates Globais"
        description="Adicione, edite ou remova templates padrão para etiquetas e fichas técnicas que estarão disponíveis para todos os usuários."
      />
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Tag className="mr-2 text-primary"/> Templates de Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie os modelos de etiquetas padrão disponíveis para todos os usuários da plataforma.
            </p>
            <Button onClick={handleAddNewLabelTemplate} className="mb-4"> {/* Removed disabled, added onClick */}
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Template de Etiqueta
            </Button>
            
            {mockLabelTemplates.length > 0 ? (
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Template</TableHead>
                      <TableHead>Descrição Curta</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLabelTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{template.description}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" disabled>
                            <Edit className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" disabled>
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="mt-4 p-4 border rounded-md bg-muted/50 min-h-[100px] flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum template de etiqueta global cadastrado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 text-primary"/> Templates de Fichas Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie os modelos de fichas técnicas padrão disponíveis para todos os usuários.
            </p>
            <Button disabled className="mb-4"> {/* This one remains disabled for now */}
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Template de Ficha
            </Button>
             {/* Placeholder for list of sheet templates */}
            <div className="mt-4 p-4 border rounded-md bg-muted/50 min-h-[100px] flex items-center justify-center">
                <p className="text-muted-foreground">Lista de templates de fichas técnicas (em breve).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
