
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, FilePlus2, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Orcamento, Cliente, Projeto, Empresa } from "@/types/firestore";
import { collection, addDoc, Timestamp, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const quoteSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  projetoId: z.string().optional(),
  numeroOrcamento: z.string().min(3, "Número do orçamento é obrigatório."),
  dataValidade: z.date({ required_error: "Data de validade é obrigatória." }),
  descricaoServicos: z.string().min(10, "Descrição dos serviços é obrigatória."),
  valorTotalEstimado: z.coerce.number().positive("Valor total estimado deve ser positivo."),
  observacoes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function NewQuotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Projeto[]>([]);
  const [empresaUsuario, setEmpresaUsuario] = useState<Empresa | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clienteId: "",
      projetoId: "",
      numeroOrcamento: "",
      dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)), // Default 15 days validity
      descricaoServicos: "",
      valorTotalEstimado: 0,
      observacoes: "",
    },
  });

  const selectedClientId = watch("clienteId");

  const fetchInitialData = useCallback(async () => {
    if (!user) {
        setLoadingData(false);
        return;
    }
    setLoadingData(true);
    try {
      const clientQuery = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const clientSnapshot = await getDocs(clientQuery);
      setClients(clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente)));

      const projectQuery = query(collection(db, "projetos"), where("owner", "==", user.uid));
      const projectSnapshot = await getDocs(projectQuery);
      setProjects(projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Projeto)));
      
      const empresaRef = doc(db, "empresas", user.uid);
      const docSnap = await getDoc(empresaRef);
      if (docSnap.exists()) {
        setEmpresaUsuario(docSnap.data() as Empresa);
      }

    } catch (error) {
      console.error("Erro ao buscar dados iniciais:", error);
      toast({ title: "Erro ao carregar dados", description: "Não foi possível buscar clientes ou projetos.", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedClientId) {
      setFilteredProjects(projects.filter(p => p.clienteId === selectedClientId));
      setValue("projetoId", "", { shouldValidate: false }); // Reset project if client changes
    } else {
      setFilteredProjects([]);
    }
  }, [selectedClientId, projects, setValue]);


  const onSubmit = async (data: QuoteFormData) => {
    if (!user) {
      toast({ title: "Usuário não autenticado", variant: "destructive" });
      return;
    }
    setFormSubmitting(true);

    const newQuoteData: Omit<Orcamento, 'id'> = {
      createdBy: user.uid,
      clienteId: data.clienteId,
      numeroOrcamento: data.numeroOrcamento,
      dataCriacao: Timestamp.now(),
      dataValidade: Timestamp.fromDate(data.dataValidade),
      descricaoServicos: data.descricaoServicos,
      valorTotalEstimado: data.valorTotalEstimado,
      status: 'rascunho',
      empresaNome: empresaUsuario?.nome || "",
      empresaCnpj: empresaUsuario?.cnpj || "",
      empresaEndereco: empresaUsuario?.endereco || "",
      empresaTelefone: empresaUsuario?.telefone || "",
      empresaEmail: empresaUsuario?.email || "",
      empresaLogotipoUrl: empresaUsuario?.logotipo || "", // Added this line
    };

    if (data.projetoId && data.projetoId.trim() !== "") {
      newQuoteData.projetoId = data.projetoId;
    }
    if (data.observacoes && data.observacoes.trim() !== "") {
      newQuoteData.observacoes = data.observacoes;
    }

    try {
      await addDoc(collection(db, "orcamentos"), newQuoteData);
      toast({ title: "Orçamento Criado!", description: `O orçamento "${data.numeroOrcamento}" foi salvo com sucesso.` });
      router.push("/dashboard/quotes");
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      toast({ title: "Erro ao Criar Orçamento", description: "Não foi possível salvar o orçamento.", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };
  
  if (loadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Orçamento"
        description="Preencha os dados para criar um novo orçamento de serviços."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais do Orçamento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroOrcamento">Número do Orçamento</Label>
                  <Controller name="numeroOrcamento" control={control} render={({ field }) => <Input id="numeroOrcamento" {...field} placeholder="Ex: ORC-2024-001" />} />
                  {errors.numeroOrcamento && <p className="text-sm text-destructive mt-1">{errors.numeroOrcamento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dataValidade">Data de Validade</Label>
                  <Controller
                    name="dataValidade"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.dataValidade && <p className="text-sm text-destructive mt-1">{errors.dataValidade.message}</p>}
                </div>
                <div>
                  <Label htmlFor="clienteId">Cliente</Label>
                  <Controller
                    name="clienteId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={clients.length === 0}>
                        <SelectTrigger id="clienteId">
                          <SelectValue placeholder={clients.length === 0 ? "Nenhum cliente cadastrado" : "Selecione um cliente"} />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => <SelectItem key={client.id} value={client.id!}>{client.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.clienteId && <p className="text-sm text-destructive mt-1">{errors.clienteId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="projetoId">Projeto (Opcional)</Label>
                  <Controller
                    name="projetoId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId || filteredProjects.length === 0}>
                        <SelectTrigger id="projetoId">
                          <SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : (filteredProjects.length === 0 ? "Nenhum projeto para este cliente" : "Selecione um projeto")} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProjects.map(project => <SelectItem key={project.id} value={project.id!}>{project.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes dos Serviços e Valores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="descricaoServicos">Descrição dos Serviços / Escopo</Label>
                  <Controller name="descricaoServicos" control={control} render={({ field }) => <Textarea id="descricaoServicos" {...field} rows={5} placeholder="Descreva detalhadamente os serviços a serem prestados..." />} />
                  {errors.descricaoServicos && <p className="text-sm text-destructive mt-1">{errors.descricaoServicos.message}</p>}
                </div>
                <div>
                  <Label htmlFor="valorTotalEstimado">Valor Total Estimado (R$)</Label>
                   <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Controller name="valorTotalEstimado" control={control} render={({ field }) => <Input id="valorTotalEstimado" type="number" step="0.01" {...field} className="pl-8" />} />
                  </div>
                  {errors.valorTotalEstimado && <p className="text-sm text-destructive mt-1">{errors.valorTotalEstimado.message}</p>}
                </div>
                <div className="p-4 border-2 border-dashed border-border rounded-md bg-muted/30 min-h-[80px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center">
                    Em breve: Adicionar itens detalhados ao orçamento (materiais, mão de obra, quantidade, valor unitário, etc.).
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Observações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="observacoes">Observações (Opcional)</Label>
                  <Controller name="observacoes" control={control} render={({ field }) => <Textarea id="observacoes" {...field} rows={3} placeholder="Condições de pagamento, informações sobre garantia, validade da proposta, etc." />} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={formSubmitting || loadingData}>
                  {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />} Salvar Orçamento
                </Button>
              </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Pré-visualização do PDF (Em breve)</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2 p-6 border-2 border-dashed border-border rounded-md min-h-[200px] flex items-center justify-center bg-muted/30">
                    <p className="text-center">A pré-visualização do orçamento em formato PDF aparecerá aqui assim que a funcionalidade estiver implementada.</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
