
"use client";

import type { FichaTecnica, Cliente, Projeto, Circuito } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, PlusCircle, NotebookText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const circuitoSchema = z.object({
  nome: z.string().min(1, "Nome do circuito é obrigatório."),
  descricao: z.string().min(3, "Descrição do circuito é obrigatória."),
});

const technicalSheetSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  projetoId: z.string().min(1, "Selecione um projeto."),
  descricao: z.string().min(5, "Descrição da ficha é obrigatória."),
  circuitos: z.array(circuitoSchema).min(1, "Adicione pelo menos um circuito."),
});

type TechnicalSheetFormData = z.infer<typeof technicalSheetSchema>;

export default function TechnicalSheetsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<TechnicalSheetFormData>({
    resolver: zodResolver(technicalSheetSchema),
    defaultValues: { clienteId: "", projetoId: "", descricao: "", circuitos: [{ nome: "", descricao: "" }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "circuitos",
  });

  const selectedClientId = watch("clienteId");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const clientQuery = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const clientSnapshot = await getDocs(clientQuery);
      setClients(clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente)));

      const projectQuery = query(collection(db, "projetos"), where("owner", "==", user.uid));
      const projectSnapshot = await getDocs(projectQuery);
      setProjects(projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Projeto)));
    } catch (error) {
      toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar clientes e projetos.", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedClientId) {
      setFilteredProjects(projects.filter(p => p.clienteId === selectedClientId));
    } else {
      setFilteredProjects([]);
    }
     const currentProjectId = watch("projetoId");
    if (currentProjectId && !projects.find(p => p.id === currentProjectId && p.clienteId === selectedClientId)) {
        reset(prev => ({...prev, projetoId: ""}));
    }
  }, [selectedClientId, projects, watch, reset]);

  const onSubmit = async (data: TechnicalSheetFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const sheetData: Omit<FichaTecnica, 'id' | 'pdfUrl'> = {
        ...data,
        owner: user.uid,
        dataCriacao: Timestamp.now(),
      };
      await addDoc(collection(db, "fichasTecnicas"), sheetData);
      toast({ title: "Ficha Técnica criada!", description: "A nova ficha técnica foi salva com sucesso." });
      reset(); 
    } catch (error) {
      toast({ title: "Erro ao criar ficha", description: "Não foi possível salvar a ficha técnica.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geração de Fichas Técnicas"
        description="Crie fichas técnicas detalhadas para seus projetos."
      />
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Nova Ficha Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
                 <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Carregando dados...</p></div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clienteId">Cliente</Label>
                  <Controller name="clienteId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                      <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id!}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  {errors.clienteId && <p className="text-sm text-destructive mt-1">{errors.clienteId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="projetoId">Projeto</Label>
                  <Controller name="projetoId" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId || filteredProjects.length === 0}>
                      <SelectTrigger><SelectValue placeholder={!selectedClientId ? "Selecione um cliente" : "Selecione um projeto"} /></SelectTrigger>
                      <SelectContent>{filteredProjects.map(p => <SelectItem key={p.id} value={p.id!}>{p.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  {errors.projetoId && <p className="text-sm text-destructive mt-1">{errors.projetoId.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição Geral da Ficha</Label>
                <Controller name="descricao" control={control} render={({ field }) => <Textarea id="descricao" {...field} placeholder="Ex: Ficha técnica do Apartamento 101, Bloco A" />} />
                {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Circuitos</h3>
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-4 bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <Label htmlFor={`circuitos.${index}.nome`}>Nome do Circuito {index + 1}</Label>
                        <Controller name={`circuitos.${index}.nome`} control={control} render={({ field }) => <Input {...field} placeholder="Ex: C1 - Tomadas Sala" />} />
                        {errors.circuitos?.[index]?.nome && <p className="text-sm text-destructive mt-1">{errors.circuitos[index]?.nome?.message}</p>}
                      </div>
                       <div>
                        <Label htmlFor={`circuitos.${index}.descricao`}>Descrição do Circuito {index + 1}</Label>
                        <Controller name={`circuitos.${index}.descricao`} control={control} render={({ field }) => <Input {...field} placeholder="Ex: 5 Tomadas 2P+T 10A" />} />
                        {errors.circuitos?.[index]?.descricao && <p className="text-sm text-destructive mt-1">{errors.circuitos[index]?.descricao?.message}</p>}
                      </div>
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}><Trash2 className="h-4 w-4 mr-1"/> Remover Circuito</Button>
                  </Card>
                ))}
                 {errors.circuitos && typeof errors.circuitos === 'object' && 'message' in errors.circuitos && (
                    <p className="text-sm text-destructive mt-1">{errors.circuitos.message}</p>
                 )}
                <Button type="button" variant="outline" onClick={() => append({ nome: "", descricao: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Circuito
                </Button>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <NotebookText className="mr-2 h-4 w-4" />} Gerar Ficha Técnica
              </Button>
            </form>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Exemplo de Ficha</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-4 bg-muted rounded-md">
                     <Image src="https://placehold.co/600x800.png" alt="Exemplo de Ficha Técnica" width={300} height={400} className="rounded shadow-md" data-ai-hint="document technical" />
                     <p className="text-sm text-muted-foreground mt-2 text-center">A ficha técnica será gerada em PDF (funcionalidade futura).</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
