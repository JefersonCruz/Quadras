
"use client";

import type { FichaTecnica, Cliente, Projeto, CircuitoFicha, Empresa, Usuario as AppUsuario } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, NotebookText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Label } from "@/components/ui/label";

// Import new sectional components
import FichaHeaderForm from "@/components/dashboard/technical-sheets/FichaHeaderForm";
import CircuitosTableForm from "@/components/dashboard/technical-sheets/CircuitosTableForm";
import ObsTecnicasForm from "@/components/dashboard/technical-sheets/ObsTecnicasForm";
import QRCodeSectionForm from "@/components/dashboard/technical-sheets/QRCodeSectionForm";
import AssinaturaContatoForm from "@/components/dashboard/technical-sheets/AssinaturaContatoForm";

const circuitoSchema = z.object({
  nome: z.string().min(1, "Nome do circuito é obrigatório."),
  disjuntor: z.string().min(1, "Disjuntor é obrigatório."),
  caboMM: z.string().min(1, "Cabo (mm²) é obrigatório."),
  observacoes: z.string().optional(),
});

const technicalSheetSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  projetoId: z.string().min(1, "Selecione um projeto."),
  
  // Seção 1
  tituloFicha: z.string().min(3, "Título da ficha é obrigatório."),
  identificacaoLocal: z.string().min(1, "Local/Identificação é obrigatório."),
  dataInstalacao: z.date({ required_error: "Data de instalação é obrigatória."}),
  responsavelTecnico: z.string().min(3, "Responsável técnico é obrigatório."),
  versaoFicha: z.string().default("v1.0"), 

  // Seção 2
  circuitos: z.array(circuitoSchema).min(1, "Adicione pelo menos um circuito."),

  // Seção 3
  observacaoDR: z.boolean().default(false),
  descricaoDROpcional: z.string().optional(),

  // Seção 5
  nomeEletricista: z.string().min(3, "Nome do eletricista é obrigatório."),
  assinaturaEletricistaFile: z.custom<FileList>().optional(), 
  contatoEletricista: z.string().min(10, "Contato do eletricista é obrigatório."),
  ramalPortaria: z.string().optional(),
});

type TechnicalSheetFormData = z.infer<typeof technicalSheetSchema>;

export default function TechnicalSheetsPage() {
  const { user, userData } = useAuth(); 
  const { toast } = useToast();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Projeto[]>([]);
  const [empresaData, setEmpresaData] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [assinaturaPreview, setAssinaturaPreview] = useState<string | null>(null);
  const [assinaturaFile, setAssinaturaFile] = useState<File | undefined>(undefined);


  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TechnicalSheetFormData>({
    resolver: zodResolver(technicalSheetSchema),
    defaultValues: {
      clienteId: "",
      projetoId: "",
      tituloFicha: "FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO",
      identificacaoLocal: "",
      dataInstalacao: new Date(),
      responsavelTecnico: userData?.nome || user?.displayName || "",
      versaoFicha: "v1.0",
      circuitos: [], // Start with an empty array, template selector will populate
      observacaoDR: false,
      descricaoDROpcional: "",
      nomeEletricista: userData?.nome || user?.displayName || "",
      contatoEletricista: "",
      ramalPortaria: "",
    },
  });

  const circuitosFieldArray = useFieldArray({
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

      const empresaRef = doc(db, "empresas", user.uid);
      const empresaSnap = await getDoc(empresaRef);
      if (empresaSnap.exists()) {
        setEmpresaData(empresaSnap.data() as Empresa);
      }

    } catch (error) {
      toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar clientes, projetos ou dados da empresa.", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (userData?.nome || user?.displayName) {
        const nome = userData?.nome || user?.displayName || "";
        setValue("responsavelTecnico", nome);
        setValue("nomeEletricista", nome);
    }
  }, [user, userData, setValue]);

  useEffect(() => {
    if (selectedClientId) {
      setFilteredProjects(projects.filter(p => p.clienteId === selectedClientId));
      setValue("projetoId",""); 
    } else {
      setFilteredProjects([]);
    }
  }, [selectedClientId, projects, setValue]);
  
  const handleAssinaturaChange = (file: File | undefined) => {
    setAssinaturaFile(file);
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAssinaturaPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setAssinaturaPreview(null);
    }
  };


  const onSubmit = async (data: TechnicalSheetFormData) => {
    if (!user) return;
    setLoading(true);

    let assinaturaUrlFinal = "";
    if (assinaturaFile) {
      const storageRef = ref(storage, `fichasTecnicas/${user.uid}/${Timestamp.now().toMillis()}_${assinaturaFile.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, assinaturaFile);
        assinaturaUrlFinal = await getDownloadURL(snapshot.ref);
      } catch (uploadError) {
        toast({ title: "Erro no upload da assinatura", variant: "destructive" });
        setLoading(false);
        return;
      }
    }
    
    try {
      const { assinaturaEletricistaFile, ...formData } = data; 

      const sheetData: Omit<FichaTecnica, 'id' | 'pdfUrl'> = {
        ...formData,
        owner: user.uid,
        logotipoEmpresaUrl: empresaData?.logotipo || "",
        nomeEmpresa: empresaData?.nome || "Não configurado",
        dataInstalacao: Timestamp.fromDate(data.dataInstalacao),
        versaoFicha: data.versaoFicha || "v1.0", 
        assinaturaEletricistaUrl: assinaturaUrlFinal,
        observacaoNBR: "Conforme NBR 5410",
        textoAcessoOnline: "Acesso aos projetos online",
        qrCodeUrl: "", 
        linkFichaPublica: "",
        dataCriacao: Timestamp.now(),
      };
      await addDoc(collection(db, "fichasTecnicas"), sheetData);
      toast({ title: "Ficha Técnica criada!", description: "A nova ficha técnica foi salva com sucesso." });
      reset(); 
      setAssinaturaPreview(null);
      setAssinaturaFile(undefined);
      setValue("dataInstalacao", new Date()); 
      setValue("circuitos", []); // Reset circuitos to empty
      setValue("responsavelTecnico", userData?.nome || user?.displayName || "");
      setValue("nomeEletricista", userData?.nome || user?.displayName || "");


    } catch (error) {
      console.error("Error creating technical sheet:", error);
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
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
            {loadingData ? (
                 <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Carregando dados...</p></div>
            ) : (
            <>
            <Card>
                <CardHeader><CardTitle>Dados Gerais do Projeto/Cliente</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </CardContent>
            </Card>

            <FichaHeaderForm control={control} errors={errors} empresa={empresaData} user={userData} />
            <CircuitosTableForm control={control} errors={errors} fieldArray={circuitosFieldArray} setValue={setValue} />
            <ObsTecnicasForm control={control} errors={errors} />
            <QRCodeSectionForm />
            <AssinaturaContatoForm 
                control={control} 
                errors={errors} 
                user={userData} 
                setValue={setValue}
                assinaturaPreview={assinaturaPreview}
                onAssinaturaChange={handleAssinaturaChange}
            />
              
            <Button type="submit" disabled={loading || loadingData} className="w-full text-lg py-6">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <NotebookText className="mr-2 h-5 w-5" />} Gerar Ficha Técnica
            </Button>
            </>
            )}
        </form>
        <div className="space-y-6 lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Exemplo de Ficha (Layout)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-2 bg-muted rounded-md">
                     <Image 
                        src="https://placehold.co/400x560.png?text=Layout+Ficha+T%C3%A9cnica" 
                        alt="Exemplo de Layout da Ficha Técnica" 
                        width={400} 
                        height={560} 
                        className="rounded shadow-md w-full max-w-sm"
                        data-ai-hint="document layout" />
                     <p className="text-sm text-muted-foreground mt-2 text-center">A ficha técnica será gerada em PDF (funcionalidade futura).</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
