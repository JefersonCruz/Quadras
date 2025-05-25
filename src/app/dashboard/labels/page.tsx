
"use client";

import type { Etiqueta, Cliente, Projeto } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag, Lightbulb, PlugZap, Monitor, ShowerHead, WashingMachine, Bath, HelpCircle, ShieldAlert, ShieldCheck, PlusCircle, ListPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, where, runTransaction, writeBatch } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const labelSchemaBase = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  projetoId: z.string().min(1, "Selecione um projeto."),
  tipo: z.string().min(3, "Tipo da etiqueta é obrigatório."),
  circuito: z.string().min(1, "Circuito é obrigatório."),
  posicao: z.string().min(1, "Posição é obrigatória."),
  isBatchCreation: z.boolean().optional(),
  aptPrefix: z.string().optional(),
  aptStartNumber: z.coerce.number().int().positive().optional(),
  aptEndNumber: z.coerce.number().int().positive().optional(),
});

const labelSchema = labelSchemaBase.superRefine((data, ctx) => {
  if (data.isBatchCreation) {
    if (!data.aptPrefix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Prefixo é obrigatório para criação em lote.",
        path: ["aptPrefix"],
      });
    }
    if (data.aptStartNumber === undefined || data.aptStartNumber === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número inicial é obrigatório para criação em lote.",
        path: ["aptStartNumber"],
      });
    }
    if (data.aptEndNumber === undefined || data.aptEndNumber === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número final é obrigatório para criação em lote.",
        path: ["aptEndNumber"],
      });
    }
    if (data.aptStartNumber !== undefined && data.aptEndNumber !== undefined && data.aptEndNumber < data.aptStartNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Número final deve ser maior ou igual ao inicial.",
        path: ["aptEndNumber"],
      });
    }
    if (data.aptStartNumber !== undefined && data.aptEndNumber !== undefined && (data.aptEndNumber - data.aptStartNumber + 1 > 50)) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Máximo de 50 etiquetas por lote.",
        path: ["aptEndNumber"],
      });
    }
  }
});


type LabelFormData = z.infer<typeof labelSchema>;

export default function LabelsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [suggestedCircuitId, setSuggestedCircuitId] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema),
    defaultValues: { 
      clienteId: "", 
      projetoId: "", 
      tipo: "", 
      circuito: "", 
      posicao: "",
      isBatchCreation: false,
      aptPrefix: "Apto ",
      aptStartNumber: undefined,
      aptEndNumber: undefined,
    },
  });

  const selectedClientId = watch("clienteId");
  const selectedProjectId = watch("projetoId");
  const watchedTipo = watch("tipo");
  const watchedCircuito = watch("circuito");
  const isBatchCreation = watch("isBatchCreation");

  const fetchAndSuggestCircuitId = useCallback(async (projectId: string | null = selectedProjectId) => {
    if (!projectId || !user) {
      setSuggestedCircuitId(null);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const q = query(
        collection(db, "etiquetas"),
        where("createdBy", "==", user.uid), // Ensure we're checking labels created by the current user
        where("projetoId", "==", projectId)
      );
      const querySnapshot = await getDocs(q);
      const existingLabels = querySnapshot.docs.map(doc => doc.data() as Etiqueta);
      
      let maxCNumber = 0;
      existingLabels.forEach(label => {
        const match = label.circuito?.match(/^C(\d+)$/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxCNumber) {
            maxCNumber = num;
          }
        }
      });
      setSuggestedCircuitId(`C${maxCNumber + 1}`);
    } catch (error) {
      console.error("Error fetching labels for suggestion:", error);
      setSuggestedCircuitId(null);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [user, selectedProjectId]); // Ensure selectedProjectId is a dependency


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const clientQuery = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const clientSnapshot = await getDocs(clientQuery);
      const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
      setClients(clientsData);

      const projectQuery = query(collection(db, "projetos"), where("owner", "==", user.uid));
      const projectSnapshot = await getDocs(projectQuery);
      const projectsData = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Projeto));
      setProjects(projectsData);

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
        setValue("projetoId", "", { shouldValidate: true });
    }
  }, [selectedClientId, projects, watch, setValue]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAndSuggestCircuitId(selectedProjectId);
    } else {
      setSuggestedCircuitId(null);
    }
  }, [selectedProjectId, fetchAndSuggestCircuitId]);


  const onSubmit = async (data: LabelFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      if (data.isBatchCreation && data.aptStartNumber && data.aptEndNumber && data.aptPrefix) {
        const batch = writeBatch(db);
        let count = 0;
        for (let i = data.aptStartNumber; i <= data.aptEndNumber; i++) {
          const labelData: Omit<Etiqueta, 'id' | 'qrCode'> = {
            createdBy: user.uid,
            clienteId: data.clienteId,
            projetoId: data.projetoId,
            tipo: data.tipo,
            circuito: data.circuito, // Using the same circuit ID for all in batch for now
            posicao: `${data.posicao} - ${data.aptPrefix}${i}`,
          };
          const newLabelRef = doc(collection(db, "etiquetas"));
          batch.set(newLabelRef, labelData);
          count++;
        }
        await batch.commit();
        toast({ title: "Etiquetas criadas em lote!", description: `${count} etiquetas foram salvas com sucesso.` });
      } else {
        const labelData: Omit<Etiqueta, 'id' | 'qrCode'> = {
          createdBy: user.uid,
          clienteId: data.clienteId,
          projetoId: data.projetoId,
          tipo: data.tipo,
          circuito: data.circuito,
          posicao: data.posicao,
        };
        await addDoc(collection(db, "etiquetas"), labelData);
        toast({ title: "Etiqueta criada!", description: "A nova etiqueta foi salva com sucesso." });
      }
      
      reset({ 
        clienteId: data.clienteId, 
        projetoId: data.projetoId, 
        tipo: "", 
        circuito: "", 
        posicao: "",
        isBatchCreation: false,
        aptPrefix: "Apto ",
        aptStartNumber: undefined,
        aptEndNumber: undefined,
      });
      fetchAndSuggestCircuitId(data.projetoId); // Re-fetch suggestion after creation

    } catch (error) {
      console.error("Error creating label(s):", error);
      toast({ title: "Erro ao criar etiqueta(s)", description: "Não foi possível salvar a(s) etiqueta(s).", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPreviewIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes("idr")) return <ShieldAlert className="h-7 w-7 mr-2 shrink-0 text-yellow-500" />;
    if (tipoLower.includes("dps")) return <ShieldCheck className="h-7 w-7 mr-2 shrink-0 text-green-500" />;
    if (tipoLower.includes("ilumina")) return <Lightbulb className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("tomada")) return <PlugZap className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("computador") || tipoLower.includes("pc")) return <Monitor className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("chuveiro")) return <ShowerHead className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("lavanderia") || tipoLower.includes("máquina de lavar") || tipoLower.includes("lava roupa")) return <WashingMachine className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("forno") || tipoLower.includes("fogão") || tipoLower.includes("cooktop")) return <HelpCircle className="h-7 w-7 mr-2 shrink-0 text-muted-foreground" />; // Fallback for Oven
    if (tipoLower.includes("banheiro") || tipoLower.includes("banheira")) return <Bath className="h-7 w-7 mr-2 shrink-0" />;
    return <HelpCircle className="h-7 w-7 mr-2 shrink-0 text-muted-foreground" />;
  };

  const getPreviewDisjuntor = (tipo: string): string => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes("idr") || tipoLower.includes("dps")) return "PROTEÇÃO";
    if (tipoLower.includes("chuveiro")) return "40A";
    if (tipoLower.includes("forno") || tipoLower.includes("fogão") || tipoLower.includes("cooktop")) return "25A";
    if (tipoLower.includes("ilumina")) return "10A";
    if (tipoLower.includes("lavanderia")) return "16A";
    if (tipoLower.includes("banheiro") && !tipoLower.includes("chuveiro")) return "20A";
    if (tipoLower.includes("tomada") || tipoLower.includes("computador")) return "20A";
    return "XX A";
  };
  
  const previewCircuitId = watchedCircuito ? (watchedCircuito.trim().split(/[\s-/]/)[0] || "CX").toUpperCase() : "CX";
  const previewTipoText = watchedTipo || "TIPO ETIQUETA";
  const previewDisjuntorText = `DISJUNTOR ${getPreviewDisjuntor(watchedTipo || "")}`;

  const suggestIDR = () => {
    setValue("tipo", "IDR Geral", { shouldValidate: true });
    setValue("circuito", "IDR", { shouldValidate: true });
    setValue("posicao", "Quadro de Distribuição Principal", { shouldValidate: true });
  };

  const suggestDPS = () => {
    setValue("tipo", "DPS Geral", { shouldValidate: true });
    setValue("circuito", "DPS", { shouldValidate: true });
    setValue("posicao", "Entrada Geral / QDG", { shouldValidate: true });
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Criação de Etiquetas Técnicas"
        description="Preencha os dados para gerar uma nova etiqueta ou um lote para múltiplos locais."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Dados da Etiqueta</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Carregando dados...</p></div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="clienteId">Cliente</Label>
                <Controller
                  name="clienteId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="clienteId">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
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
                <Label htmlFor="projetoId">Projeto</Label>
                <Controller
                  name="projetoId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId || filteredProjects.length === 0}>
                      <SelectTrigger id="projetoId">
                        <SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : (filteredProjects.length === 0 ? "Nenhum projeto para este cliente" : "Selecione um projeto")} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map(project => (
                          <SelectItem key={project.id} value={project.id!}>{project.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.projetoId && <p className="text-sm text-destructive mt-1">{errors.projetoId.message}</p>}
              </div>

              <div className="pt-2 pb-1 border-b border-dashed">
                <Label className="text-base font-semibold text-foreground">Dados Base da Etiqueta (Modelo)</Label>
                <p className="text-xs text-muted-foreground">Estes dados serão usados para todas as etiquetas no lote (se aplicável).</p>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo da Etiqueta</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => <Input id="tipo" {...field} placeholder="Ex: Iluminação Cozinha, Tomada Sala, IDR Geral" />}
                />
                {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>}
              </div>

              <div>
                <Label htmlFor="circuito">Circuito (ID)</Label>
                <Controller
                  name="circuito"
                  control={control}
                  render={({ field }) => <Input id="circuito" {...field} placeholder="Ex: C1, C2A, IDR, DPS" />}
                />
                {errors.circuito && <p className="text-sm text-destructive mt-1">{errors.circuito.message}</p>}
                {loadingSuggestions && selectedProjectId && <p className="text-xs text-muted-foreground mt-1">Buscando sugestão de ID...</p>}
                {!loadingSuggestions && suggestedCircuitId && selectedProjectId && (
                  <div className="mt-1 text-xs">
                    <Button type="button" variant="outline" size="sm" onClick={() => setValue('circuito', suggestedCircuitId, {shouldValidate: true})}>
                      Usar Sugestão: {suggestedCircuitId}
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="posicao">Posição / Localização Detalhada (Base)</Label>
                <Controller
                  name="posicao"
                  control={control}
                  render={({ field }) => <Input id="posicao" {...field} placeholder="Ex: QDC Principal, Corredor Quartos" />}
                />
                 <p className="text-xs text-muted-foreground mt-1">Para lotes, o prefixo e número do local serão adicionados aqui.</p>
                {errors.posicao && <p className="text-sm text-destructive mt-1">{errors.posicao.message}</p>}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={suggestIDR} disabled={!selectedProjectId}>Sugerir Etiqueta IDR</Button>
                <Button type="button" variant="outline" size="sm" onClick={suggestDPS} disabled={!selectedProjectId}>Sugerir Etiqueta DPS</Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-dashed">
                 <div className="flex items-center space-x-2">
                    <Controller
                        name="isBatchCreation"
                        control={control}
                        render={({ field }) => (
                        <Checkbox
                            id="isBatchCreation"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!selectedProjectId}
                        />
                        )}
                    />
                    <Label htmlFor="isBatchCreation" className="font-medium text-foreground">Criar para Múltiplos Apartamentos/Locais?</Label>
                 </div>
                 {errors.isBatchCreation && <p className="text-sm text-destructive mt-1">{errors.isBatchCreation.message}</p>}
              </div>

              {isBatchCreation && selectedProjectId && (
                <Card className="p-4 bg-muted/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="aptPrefix">Prefixo do Local</Label>
                      <Controller name="aptPrefix" control={control} render={({ field }) => <Input id="aptPrefix" {...field} />} />
                      {errors.aptPrefix && <p className="text-sm text-destructive mt-1">{errors.aptPrefix.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="aptStartNumber">Número Inicial</Label>
                      <Controller name="aptStartNumber" control={control} render={({ field }) => <Input id="aptStartNumber" type="number" {...field} />} />
                      {errors.aptStartNumber && <p className="text-sm text-destructive mt-1">{errors.aptStartNumber.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="aptEndNumber">Número Final</Label>
                      <Controller name="aptEndNumber" control={control} render={({ field }) => <Input id="aptEndNumber" type="number" {...field} />} />
                      {errors.aptEndNumber && <p className="text-sm text-destructive mt-1">{errors.aptEndNumber.message}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Ex: Prefixo "Apto ", Inicial 101, Final 110 criará etiquetas para Apto 101, Apto 102, ..., Apto 110.</p>
                </Card>
              )}

              <Button type="submit" disabled={loading || !selectedProjectId} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isBatchCreation ? <ListPlus className="mr-2 h-4 w-4"/> : <Tag className="mr-2 h-4 w-4" />)} 
                {isBatchCreation ? "Criar Etiquetas em Lote" : "Criar Etiqueta Única"}
              </Button>
            </form>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Visualização da Etiqueta</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-4 bg-muted rounded-md min-h-[200px]">
                    <div className="w-[260px] h-[100px] bg-white border-2 border-black rounded-lg flex font-sans shadow-md">
                        <div className="w-1/3 flex items-center justify-center border-r-2 border-black p-1">
                            <span className="text-3xl font-bold text-black truncate" title={previewCircuitId}>{previewCircuitId}</span>
                        </div>
                        <div className="w-2/3 flex flex-col">
                            <div className="flex-1 flex items-center p-2 border-b-2 border-black">
                                {getPreviewIcon(watchedTipo || "")}
                                <span className="font-bold text-base text-black uppercase truncate" title={previewTipoText}>
                                  {previewTipoText}
                                </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-1">
                                <span className="text-xs text-black uppercase">{previewDisjuntorText}</span>
                            </div>
                        </div>
                    </div>
                     <p className="text-sm text-muted-foreground mt-3 text-center">
                        {isBatchCreation ? "A visualização mostra o modelo base para o lote." : "A etiqueta real será gerada com QR Code (funcionalidade futura)."}
                     </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Dicas</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• **Selecione Cliente e Projeto** primeiro para habilitar a criação.</p>
                    <p>• **Criação em Lote:** Marque a opção para criar etiquetas para uma série de locais (ex: apartamentos 101 a 110). Os dados base (tipo, circuito) serão replicados.</p>
                    <p>• **Circuito (ID):** Use a sugestão automática (C1, C2...) ou digite um ID específico (ex: IDR, DPS).</p>
                    <p>• **Botões de Sugestão (IDR/DPS):** Preenchem os campos com dados padrão para esses tipos de proteção.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
    

    