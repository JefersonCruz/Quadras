
"use client";

import type { Etiqueta, Cliente, Projeto } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Tag } from "lucide-react";
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
import Image from "next/image";

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
    // Reset projetoId if client changes and selected project is not for this client
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
      reset(); // Reset form after submission
    } catch (error) {
      toast({ title: "Erro ao criar etiqueta", description: "Não foi possível salvar a etiqueta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
                  render={({ field }) => <Input id="tipo" {...field} placeholder="Ex: Quadro de Distribuição, Tomada, Luminária" />}
                />
                {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>}
              </div>

              <div>
                <Label htmlFor="circuito">Circuito</Label>
                <Controller
                  name="circuito"
                  control={control}
                  render={({ field }) => <Input id="circuito" {...field} placeholder="Ex: C1, C2-Iluminação" />}
                />
                {errors.circuito && <p className="text-sm text-destructive mt-1">{errors.circuito.message}</p>}
              </div>

              <div>
                <Label htmlFor="posicao">Posição / Localização</Label>
                <Controller
                  name="posicao"
                  control={control}
                  render={({ field }) => <Input id="posicao" {...field} placeholder="Ex: QDC-01, Sala-T01, Cozinha-L02" />}
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
                    <CardTitle>Visualização da Etiqueta (Exemplo)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-4 bg-muted rounded-md aspect-[3/2]">
                     <Image src="https://placehold.co/300x200.png" alt="Exemplo de Etiqueta" width={300} height={200} className="rounded shadow-md" data-ai-hint="label technical" />
                     <p className="text-sm text-muted-foreground mt-2">A etiqueta gerada incluirá um QR Code.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Dicas</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Use nomenclaturas padronizadas para Circuitos e Posições.</p>
                    <p>• O QR Code será gerado automaticamente (funcionalidade futura).</p>
                    <p>• Verifique os dados antes de confirmar a criação.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
