
"use client";

import type { Etiqueta, Cliente, Projeto } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Tag, Lightbulb, PlugZap, Monitor, ShowerHead, WashingMachine, Oven, Bath, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const labelSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  projetoId: z.string().min(1, "Selecione um projeto."),
  tipo: z.string().min(3, "Tipo da etiqueta é obrigatório."),
  circuito: z.string().min(1, "Circuito é obrigatório."),
  posicao: z.string().min(1, "Posição é obrigatória."),
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

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema),
    defaultValues: { clienteId: "", projetoId: "", tipo: "", circuito: "", posicao: "" },
  });

  const selectedClientId = watch("clienteId");
  const watchedTipo = watch("tipo");
  const watchedCircuito = watch("circuito");

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
        reset(prev => ({...prev, projetoId: ""}));
    }
  }, [selectedClientId, projects, watch, reset]);

  const onSubmit = async (data: LabelFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const labelData: Omit<Etiqueta, 'id' | 'qrCode'> = {
        ...data,
        createdBy: user.uid,
      };
      await addDoc(collection(db, "etiquetas"), labelData);
      toast({ title: "Etiqueta criada!", description: "A nova etiqueta foi salva com sucesso." });
      reset(); 
    } catch (error) {
      toast({ title: "Erro ao criar etiqueta", description: "Não foi possível salvar a etiqueta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPreviewIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes("ilumina")) return <Lightbulb className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("tomada")) return <PlugZap className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("computador") || tipoLower.includes("pc")) return <Monitor className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("chuveiro")) return <ShowerHead className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("lavanderia") || tipoLower.includes("máquina de lavar") || tipoLower.includes("lava roupa")) return <WashingMachine className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("forno") || tipoLower.includes("fogão") || tipoLower.includes("cooktop")) return <Oven className="h-7 w-7 mr-2 shrink-0" />;
    if (tipoLower.includes("banheiro") || tipoLower.includes("banheira")) return <Bath className="h-7 w-7 mr-2 shrink-0" />;
    return <HelpCircle className="h-7 w-7 mr-2 shrink-0 text-muted-foreground" />;
  };

  const getPreviewDisjuntor = (tipo: string): string => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes("chuveiro")) return "40A";
    if (tipoLower.includes("forno") || tipoLower.includes("cooktop")) return "25A";
    if (tipoLower.includes("ilumina")) return "10A";
    if (tipoLower.includes("lavanderia") || tipoLower.includes("torneira")) return "16A";
    if (tipoLower.includes("banheiro") && !tipoLower.includes("chuveiro")) return "20A"; // General bathroom, not shower
    // Default for tomada, computador, etc.
    if (tipoLower.includes("tomada") || tipoLower.includes("computador")) return "20A";
    return "XX A"; // Default placeholder
  };
  
  const previewCircuitId = watchedCircuito ? (watchedCircuito.trim().split(/[\s-/]/)[0] || "CX").toUpperCase() : "CX";
  const previewTipoText = watchedTipo || "TIPO ETIQUETA";
  const previewDisjuntorText = `DISJUNTOR ${getPreviewDisjuntor(watchedTipo || "")}`;


  return (
    <div className="space-y-6">
      <PageHeader
        title="Criação de Etiquetas Técnicas"
        description="Preencha os dados para gerar uma nova etiqueta."
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
                        <SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : "Selecione um projeto"} />
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

              <div>
                <Label htmlFor="tipo">Tipo da Etiqueta</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => <Input id="tipo" {...field} placeholder="Ex: Iluminação Cozinha, Tomada Sala" />}
                />
                {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>}
              </div>

              <div>
                <Label htmlFor="circuito">Circuito (ID)</Label>
                <Controller
                  name="circuito"
                  control={control}
                  render={({ field }) => <Input id="circuito" {...field} placeholder="Ex: C1, C2A, QDC-01.C3" />}
                />
                {errors.circuito && <p className="text-sm text-destructive mt-1">{errors.circuito.message}</p>}
              </div>

              <div>
                <Label htmlFor="posicao">Posição / Localização Detalhada</Label>
                <Controller
                  name="posicao"
                  control={control}
                  render={({ field }) => <Input id="posicao" {...field} placeholder="Ex: TUG Cozinha Bancada, Luminária Central Quarto" />}
                />
                {errors.posicao && <p className="text-sm text-destructive mt-1">{errors.posicao.message}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />} Criar Etiqueta
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
                     <p className="text-sm text-muted-foreground mt-3 text-center">A etiqueta real será gerada com QR Code (funcionalidade futura).</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Dicas</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• **Tipo da Etiqueta:** Seja descritivo (Ex: "Tomada Dupla Bancada", "Luminária LED Corredor").</p>
                    <p>• **Circuito (ID):** Use o identificador único do circuito (Ex: "C1", "A2.1").</p>
                    <p>• **Posição:** Detalhe a localização exata (Ex: "Parede Leste, ao lado da Porta").</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

