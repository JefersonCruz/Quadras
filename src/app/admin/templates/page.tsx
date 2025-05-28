
"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText, Tag, Edit, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GlobalLabelTemplate } from "@/types/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, Timestamp, getDocs, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const labelTemplateSchema = z.object({
  name: z.string().min(3, "Nome do template deve ter no mínimo 3 caracteres."),
  description: z.string().min(5, "Descrição deve ter no mínimo 5 caracteres."),
});

type LabelTemplateFormData = z.infer<typeof labelTemplateSchema>;

export default function AdminTemplatesPage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [isLabelDialogFormOpen, setIsLabelDialogFormOpen] = useState(false);
  const [editingLabelTemplate, setEditingLabelTemplate] = useState<GlobalLabelTemplate | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [labelTemplates, setLabelTemplates] = useState<GlobalLabelTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<GlobalLabelTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);


  const { control, handleSubmit, reset, formState: { errors } } = useForm<LabelTemplateFormData>({
    resolver: zodResolver(labelTemplateSchema),
    defaultValues: { name: "", description: "" },
  });

  const fetchLabelTemplates = useCallback(async () => {
    if (!user || !isAdmin) {
      setLabelTemplates([]);
      setLoadingTemplates(false);
      return;
    }
    setLoadingTemplates(true);
    try {
      const templatesCollection = collection(db, "globalLabelTemplates");
      const q = query(templatesCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const templatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlobalLabelTemplate));
      setLabelTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching label templates:", error);
      toast({
        title: "Erro ao Carregar Templates",
        description: "Não foi possível buscar os templates de etiqueta.",
        variant: "destructive",
      });
      setLabelTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchLabelTemplates();
  }, [fetchLabelTemplates]);

  const openNewLabelTemplateForm = () => {
    setEditingLabelTemplate(null);
    reset({ name: "", description: "" });
    setIsLabelDialogFormOpen(true);
  };

  const onLabelTemplateSubmit = async (data: LabelTemplateFormData) => {
    if (!user || !user.uid || !isAdmin) {
      toast({
        title: "Erro de Autenticação ou Permissão",
        description: "Usuário não autenticado ou sem permissão para esta ação.",
        variant: "destructive",
      });
      setFormSubmitting(false);
      return;
    }

    setFormSubmitting(true);
    try {
      const newTemplateData: Omit<GlobalLabelTemplate, 'id'> = {
        name: data.name,
        description: data.description,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      };
      
      await addDoc(collection(db, "globalLabelTemplates"), newTemplateData);
      
      toast({
        title: editingLabelTemplate ? "Template de Etiqueta Atualizado!" : "Novo Template de Etiqueta Adicionado!",
        description: `O template "${data.name}" foi salvo com sucesso.`,
      });
      
      setIsLabelDialogFormOpen(false);
      fetchLabelTemplates(); 
    } catch (error) {
      console.error("Error saving label template:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o template de etiqueta.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDeleteConfirmationDialog = (template: GlobalLabelTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLabelTemplate = async () => {
    if (!templateToDelete || !templateToDelete.id || !isAdmin) {
      toast({
        title: "Erro",
        description: "Template não selecionado ou permissão negada.",
        variant: "destructive",
      });
      return;
    }
    setDeletingTemplate(true);
    try {
      await deleteDoc(doc(db, "globalLabelTemplates", templateToDelete.id));
      toast({
        title: "Template Excluído!",
        description: `O template "${templateToDelete.name}" foi removido com sucesso.`,
      });
      fetchLabelTemplates();
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Error deleting label template:", error);
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível remover o template.",
        variant: "destructive",
      });
    } finally {
      setDeletingTemplate(false);
    }
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
            <Button onClick={openNewLabelTemplateForm} className="mb-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Template de Etiqueta
            </Button>
            
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Carregando templates...</p>
              </div>
            ) : labelTemplates.length > 0 ? (
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Template</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Criado Em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labelTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{template.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {template.createdAt ? format(template.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" disabled>
                            <Edit className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openDeleteConfirmationDialog(template)}
                            disabled={deletingTemplate && templateToDelete?.id === template.id}
                          >
                            {deletingTemplate && templateToDelete?.id === template.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Trash2 className="h-3 w-3 mr-1" />} 
                            Excluir
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
            <Button disabled className="mb-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Template de Ficha
            </Button>
            <div className="mt-4 p-4 border rounded-md bg-muted/50 min-h-[100px] flex items-center justify-center">
                <p className="text-muted-foreground">Lista de templates de fichas técnicas (em breve).</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isLabelDialogFormOpen} onOpenChange={(open) => { setIsLabelDialogFormOpen(open); if(!open) setEditingLabelTemplate(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLabelTemplate ? "Editar Template de Etiqueta" : "Novo Template de Etiqueta"}</DialogTitle>
            <DialogDescription>
              {editingLabelTemplate ? "Atualize os dados do template." : "Preencha os dados para cadastrar um novo template de etiqueta global."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onLabelTemplateSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome do Template</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} placeholder="Ex: Iluminação Cozinha (Residencial)" />}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Descrição Curta</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea id="description" {...field} placeholder="Uma breve descrição do propósito do template." rows={3} />}
              />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingLabelTemplate ? "Salvar Alterações" : "Adicionar Template")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {templateToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o template "{templateToDelete.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLabelTemplate} disabled={deletingTemplate}>
                {deletingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
