
"use client";

import type { Projeto, Cliente, FichaTecnica, Empresa } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Search, Loader2, Briefcase, Eye, FileDown, Tags } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, Timestamp, orderBy, limit, getDoc } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { generateTechnicalSheetPdf } from "@/lib/pdfUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const projectSchema = z.object({
  nome: z.string().min(3, "Nome do projeto deve ter no mínimo 3 caracteres."),
  descricao: z.string().optional(),
  clienteId: z.string().min(1, "Selecione um cliente."),
  status: z.enum(['Planejamento', 'Em Andamento', 'Concluído', 'Cancelado']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [projects, setProjects] = useState<Projeto[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true); // General loading for page data
  const [formSubmitting, setFormSubmitting] = useState(false); // For form submission
  const [projectActionLoading, setProjectActionLoading] = useState<Record<string, boolean>>({}); // For individual project actions like PDF download
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Projeto | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { nome: "", descricao: "", clienteId: "", status: "Planejamento" },
  });

  const fetchClientsAndProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const clientQuery = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const clientSnapshot = await getDocs(clientQuery);
      const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
      setClients(clientsData);

      const projectQuery = query(collection(db, "projetos"), where("owner", "==", user.uid), orderBy("dataCriacao", "desc"));
      const projectSnapshot = await getDocs(projectQuery);
      const projectsData = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Projeto));
      setProjects(projectsData);

    } catch (error) {
      toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar projetos e clientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchClientsAndProjects();
  }, [fetchClientsAndProjects]);

  const openNewForm = useCallback(() => {
    setEditingProject(null);
    setIsFormOpen(true);
  }, [setIsFormOpen, setEditingProject]);

  useEffect(() => {
    if (editingProject) {
      reset(editingProject);
    } else {
      reset({ nome: "", descricao: "", clienteId: "", status: "Planejamento" });
    }
  }, [editingProject, reset, isFormOpen]);

  useEffect(() => {
    const shouldOpenModal = searchParams.get('openNewProject') === 'true';
    if (shouldOpenModal) {
      openNewForm();
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, openNewForm, router, pathname]);


  const onSubmit = async (data: ProjectFormData) => {
    if (!user) return;
    setFormSubmitting(true);
    try {
      const projectData = {
        ...data,
        owner: user.uid,
        dataCriacao: editingProject?.dataCriacao || Timestamp.now(), 
      };

      if (editingProject && editingProject.id) {
        const projectRef = doc(db, "projetos", editingProject.id);
        await updateDoc(projectRef, projectData);
        toast({ title: "Projeto atualizado!", description: "Os dados do projeto foram atualizados." });
      } else {
        await addDoc(collection(db, "projetos"), projectData);
        toast({ title: "Projeto adicionado!", description: "Novo projeto cadastrado com sucesso." });
      }
      fetchClientsAndProjects(); 
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao salvar projeto", description: "Não foi possível salvar os dados.", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setProjectActionLoading(prev => ({ ...prev, [projectId]: true }));
    try {
      await deleteDoc(doc(db, "projetos", projectId));
      toast({ title: "Projeto excluído", description: "O projeto foi removido com sucesso." });
      fetchClientsAndProjects(); 
    } catch (error) {
      toast({ title: "Erro ao excluir", description: "Não foi possível remover o projeto.", variant: "destructive" });
    } finally {
      setProjectActionLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleDownloadTechnicalSheet = async (projectId: string) => {
    if (!user) return;
    setProjectActionLoading(prev => ({ ...prev, [`pdf_${projectId}`]: true }));
    try {
      const q = query(
        collection(db, "fichasTecnicas"),
        where("owner", "==", user.uid),
        where("projetoId", "==", projectId),
        orderBy("dataCriacao", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "Nenhuma Ficha Encontrada", description: "Não há fichas técnicas para este projeto.", variant: "default" });
        return;
      }
      
      const fichaDoc = querySnapshot.docs[0];
      const fichaData = { id: fichaDoc.id, ...fichaDoc.data() } as FichaTecnica;
      
      await generateTechnicalSheetPdf(fichaData);
      toast({ title: "PDF Gerado!", description: "O download da ficha técnica foi iniciado." });

    } catch (error: any) {
      toast({ title: "Erro ao Baixar Ficha", description: error.message || "Não foi possível baixar a ficha técnica.", variant: "destructive" });
    } finally {
      setProjectActionLoading(prev => ({ ...prev, [`pdf_${projectId}`]: false }));
    }
  };

  const openEditForm = (project: Projeto) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const filteredProjects = projects.filter(project =>
    project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clients.find(c => c.id === project.clienteId)?.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getClientName = (clienteId: string) => {
    return clients.find(c => c.id === clienteId)?.nome || "Desconhecido";
  }

  const projectStatusOptions: Projeto['status'][] = ['Planejamento', 'Em Andamento', 'Concluído', 'Cancelado'];


  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Projetos"
        description="Crie, edite e acompanhe o status dos seus projetos."
        actions={
          <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Projeto
          </Button>
        }
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingProject(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
            <DialogDescription>
              {editingProject ? "Atualize os dados do projeto." : "Preencha os dados para cadastrar um novo projeto."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <Label htmlFor="nome">Nome do Projeto</Label>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => <Input id="nome" {...field} />}
              />
              {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <Label htmlFor="clienteId">Cliente</Label>
              <Controller
                name="clienteId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger id="clienteId">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id!}>{client.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clienteId && <p className="text-sm text-destructive mt-1">{errors.clienteId.message}</p>}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
               {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
            </div>
             <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Controller
                name="descricao"
                control={control}
                render={({ field }) => <Textarea id="descricao" {...field} placeholder="Detalhes sobre o projeto..." />}
              />
            </div>
            <DialogFooter className="sticky bottom-0 bg-background py-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Projeto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
           <div className="mt-2">
            <Input
              placeholder="Buscar projeto ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && projects.length === 0 && clients.length === 0 ? ( 
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-2">Carregando projetos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Nenhum projeto encontrado.</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente um termo de busca diferente." : "Comece adicionando seu primeiro projeto."}
                </p>
                {!searchTerm && (
                    <Button onClick={openNewForm} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Projeto
                    </Button>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Projeto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.nome}</TableCell>
                      <TableCell>{getClientName(project.clienteId)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium
                          ${project.status === 'Concluído' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                            project.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                            project.status === 'Planejamento' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell>{project.dataCriacao ? format(project.dataCriacao.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDownloadTechnicalSheet(project.id!)} disabled={projectActionLoading[`pdf_${project.id!}`]}>
                              {projectActionLoading[`pdf_${project.id!}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                              <span className="sr-only">Baixar Ficha Técnica</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Baixar Ficha Técnica</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                              <Tags className="h-4 w-4" />
                              <span className="sr-only">Baixar Etiquetas</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Baixar Etiquetas (em breve)</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditForm(project)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar Projeto</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar Projeto</p></TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button variant="destructive" size="icon" className="h-8 w-8" disabled={projectActionLoading[project.id!]}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir Projeto</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Excluir Projeto</p></TooltipContent>
                            </Tooltip>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o projeto "{project.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProject(project.id!)} disabled={projectActionLoading[project.id!]}>
                                {projectActionLoading[project.id!] ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

