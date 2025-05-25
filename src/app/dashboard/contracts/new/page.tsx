
"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Contrato, Empresa } from "@/types/firestore";
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSignature, User, Users, Building } from "lucide-react";

const contractSchema = z.object({
  tipo: z.enum(["padrão", "emergencial"], { required_error: "Tipo de contrato é obrigatório." }),
  
  clienteNome: z.string().min(3, "Nome do cliente é obrigatório."),
  clienteEmail: z.string().email("Email do cliente inválido."),
  clienteCpfCnpj: z.string().optional(),

  testemunha1Nome: z.string().min(3, "Nome da Testemunha 1 é obrigatório.").optional().or(z.literal('')),
  testemunha1Email: z.string().email("Email da Testemunha 1 inválido.").optional().or(z.literal('')),
  testemunha2Nome: z.string().min(3, "Nome da Testemunha 2 é obrigatório.").optional().or(z.literal('')),
  testemunha2Email: z.string().email("Email da Testemunha 2 inválido.").optional().or(z.literal('')),
  
  // Blocos Editáveis
  objetoDoContrato: z.string().min(10, "Objeto do contrato é obrigatório."),
  prazoDeExecucao: z.string().min(3, "Prazo de execução é obrigatório."),
  condicoesDePagamento: z.string().min(10, "Condições de pagamento são obrigatórias."),
  fornecimentoDeMateriais: z.string().min(5, "Informação sobre fornecimento de materiais é obrigatória."),
  multasPenalidades: z.string().min(5, "Informação sobre multas/penalidades é obrigatória."),
  cancelamento: z.string().min(5, "Informação sobre cancelamento é obrigatória."),
  foro: z.string().optional(),

  // Campos da empresa (serão preenchidos automaticamente no futuro)
  empresaNome: z.string().optional(),
  empresaCnpj: z.string().optional(),
  empresaEndereco: z.string().optional(),
  empresaResponsavel: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export default function NewContractPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [empresaUsuario, setEmpresaUsuario] = useState<Empresa | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      tipo: "padrão",
      clienteNome: "",
      clienteEmail: "",
      clienteCpfCnpj: "",
      testemunha1Nome: "",
      testemunha1Email: "",
      testemunha2Nome: "",
      testemunha2Email: "",
      objetoDoContrato: "Prestação de serviços de ",
      prazoDeExecucao: "A ser definido",
      condicoesDePagamento: "Pagamento de 50% na aprovação e 50% na conclusão.",
      fornecimentoDeMateriais: "Materiais serão fornecidos pelo CONTRATADO, com custos repassados ao CONTRATANTE mediante nota fiscal.",
      multasPenalidades: "Multa de 10% sobre o valor do contrato em caso de descumprimento de qualquer cláusula.",
      cancelamento: "Cancelamento com aviso prévio de 30 dias, sujeito a multa rescisória.",
      foro: "Fica eleito o foro da comarca de [Cidade]/[UF] para dirimir quaisquer controvérsias oriundas do presente contrato.",
      empresaNome: "",
      empresaCnpj: "",
      empresaEndereco: "",
      empresaResponsavel: userData?.nome || "",
    },
  });

  useEffect(() => {
    const fetchEmpresaData = async () => {
      if (user) {
        const empresaRef = doc(db, "empresas", user.uid);
        const docSnap = await getDoc(empresaRef);
        if (docSnap.exists()) {
          const empresa = docSnap.data() as Empresa;
          setEmpresaUsuario(empresa);
          setValue("empresaNome", empresa.nome);
          setValue("empresaCnpj", empresa.cnpj);
          setValue("empresaEndereco", empresa.endereco);
          if (userData?.nome) {
            setValue("empresaResponsavel", userData.nome);
          }
        } else {
           toast({ title: "Dados da Empresa Não Encontrados", description: "Configure o perfil da sua empresa para preenchimento automático.", variant: "default"});
        }
      }
    };
    fetchEmpresaData();
  }, [user, userData, setValue, toast]);


  const onSubmit = async (data: ContractFormData) => {
    if (!user) {
      toast({ title: "Usuário não autenticado", variant: "destructive" });
      return;
    }
    setLoading(true);

    const testemunhasArray: TestemunhaContrato[] = [];
    if (data.testemunha1Nome && data.testemunha1Email) {
      testemunhasArray.push({ nome: data.testemunha1Nome, email: data.testemunha1Email });
    }
    if (data.testemunha2Nome && data.testemunha2Email) {
      testemunhasArray.push({ nome: data.testemunha2Nome, email: data.testemunha2Email });
    }

    const newContract: Contrato = {
      createdBy: user.uid,
      tipo: data.tipo,
      cliente: {
        nome: data.clienteNome,
        email: data.clienteEmail,
        cpfCnpj: data.clienteCpfCnpj,
      },
      testemunhas: testemunhasArray.length > 0 ? testemunhasArray : undefined,
      blocosEditaveis: {
        objetoDoContrato: data.objetoDoContrato,
        prazoDeExecucao: data.prazoDeExecucao,
        condicoesDePagamento: data.condicoesDePagamento,
        fornecimentoDeMateriais: data.fornecimentoDeMateriais,
        multasPenalidades: data.multasPenalidades,
        cancelamento: data.cancelamento,
        foro: data.foro || undefined,
      },
      status: 'rascunho', // Initial status
      assinaturas: { // Initialize signature placeholders
        prestador: undefined,
        cliente: undefined,
        testemunha1: undefined,
        testemunha2: undefined,
      },
      dataCriacao: Timestamp.now(),
      dataUltimaModificacao: Timestamp.now(),
      empresaPrestador: empresaUsuario ? {
        nome: empresaUsuario.nome,
        cnpj: empresaUsuario.cnpj,
        endereco: empresaUsuario.endereco,
        responsavelTecnico: userData?.nome || empresaUsuario.owner, // or some other field
      } : undefined,
    };

    if (data.tipo === 'emergencial') {
        newContract.taxaDeslocamento = 100.00; // Example, make configurable later
        newContract.termosEmergencial = "Atendimento emergencial sujeito a taxa de deslocamento e pagamento obrigatório se técnico a caminho.";
    }

    try {
      await addDoc(collection(db, "contratos"), newContract);
      toast({ title: "Contrato criado!", description: "O novo contrato foi salvo como rascunho." });
      router.push("/dashboard/contracts");
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
      toast({ title: "Erro ao criar contrato", description: "Não foi possível salvar o contrato.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Contrato Digital"
        description="Preencha os dados para criar um novo contrato de prestação de serviço."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Detalhes da Empresa do Prestador - Auto-preenchido (somente display por enquanto) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/> Dados da Sua Empresa (Prestador)</CardTitle>
                <CardDescription>Estes dados são do seu perfil de empresa. Serão incluídos no contrato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nome da Empresa</Label>
                  <Input value={empresaUsuario?.nome || "Carregando..."} disabled />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input value={empresaUsuario?.cnpj || "Carregando..."} disabled />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input value={empresaUsuario?.endereco || "Carregando..."} disabled />
                </div>
                 <div>
                  <Label>Responsável Técnico (Sua Empresa)</Label>
                   <Controller
                    name="empresaResponsavel"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Seu nome como responsável" />}
                  />
                  {errors.empresaResponsavel && <p className="text-sm text-destructive mt-1">{errors.empresaResponsavel.message}</p>}
                </div>
              </CardContent>
            </Card>
            
            {/* Dados do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary"/> Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clienteNome">Nome Completo do Cliente</Label>
                  <Controller name="clienteNome" control={control} render={({ field }) => <Input id="clienteNome" {...field} />} />
                  {errors.clienteNome && <p className="text-sm text-destructive mt-1">{errors.clienteNome.message}</p>}
                </div>
                <div>
                  <Label htmlFor="clienteEmail">Email do Cliente</Label>
                  <Controller name="clienteEmail" control={control} render={({ field }) => <Input id="clienteEmail" type="email" {...field} />} />
                  {errors.clienteEmail && <p className="text-sm text-destructive mt-1">{errors.clienteEmail.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="clienteCpfCnpj">CPF/CNPJ do Cliente (opcional)</Label>
                  <Controller name="clienteCpfCnpj" control={control} render={({ field }) => <Input id="clienteCpfCnpj" {...field} />} />
                  {errors.clienteCpfCnpj && <p className="text-sm text-destructive mt-1">{errors.clienteCpfCnpj.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Dados das Testemunhas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Dados das Testemunhas (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <Label htmlFor="testemunha1Nome">Nome da Testemunha 1</Label>
                    <Controller name="testemunha1Nome" control={control} render={({ field }) => <Input id="testemunha1Nome" {...field} />} />
                    {errors.testemunha1Nome && <p className="text-sm text-destructive mt-1">{errors.testemunha1Nome.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="testemunha1Email">Email da Testemunha 1</Label>
                    <Controller name="testemunha1Email" control={control} render={({ field }) => <Input id="testemunha1Email" type="email" {...field} />} />
                    {errors.testemunha1Email && <p className="text-sm text-destructive mt-1">{errors.testemunha1Email.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testemunha2Nome">Nome da Testemunha 2</Label>
                    <Controller name="testemunha2Nome" control={control} render={({ field }) => <Input id="testemunha2Nome" {...field} />} />
                    {errors.testemunha2Nome && <p className="text-sm text-destructive mt-1">{errors.testemunha2Nome.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="testemunha2Email">Email da Testemunha 2</Label>
                    <Controller name="testemunha2Email" control={control} render={({ field }) => <Input id="testemunha2Email" type="email" {...field} />} />
                    {errors.testemunha2Email && <p className="text-sm text-destructive mt-1">{errors.testemunha2Email.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blocos Editáveis do Contrato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><FileSignature className="mr-2 h-5 w-5 text-primary"/> Cláusulas do Contrato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="objetoDoContrato">Objeto do Contrato</Label>
                  <Controller name="objetoDoContrato" control={control} render={({ field }) => <Textarea id="objetoDoContrato" {...field} rows={3} />} />
                  {errors.objetoDoContrato && <p className="text-sm text-destructive mt-1">{errors.objetoDoContrato.message}</p>}
                </div>
                <div>
                  <Label htmlFor="prazoDeExecucao">Prazo de Execução</Label>
                  <Controller name="prazoDeExecucao" control={control} render={({ field }) => <Input id="prazoDeExecucao" {...field} />} />
                  {errors.prazoDeExecucao && <p className="text-sm text-destructive mt-1">{errors.prazoDeExecucao.message}</p>}
                </div>
                <div>
                  <Label htmlFor="condicoesDePagamento">Condições de Pagamento</Label>
                  <Controller name="condicoesDePagamento" control={control} render={({ field }) => <Textarea id="condicoesDePagamento" {...field} rows={3} />} />
                  {errors.condicoesDePagamento && <p className="text-sm text-destructive mt-1">{errors.condicoesDePagamento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="fornecimentoDeMateriais">Fornecimento de Materiais</Label>
                  <Controller name="fornecimentoDeMateriais" control={control} render={({ field }) => <Textarea id="fornecimentoDeMateriais" {...field} rows={3} />} />
                  {errors.fornecimentoDeMateriais && <p className="text-sm text-destructive mt-1">{errors.fornecimentoDeMateriais.message}</p>}
                </div>
                <div>
                  <Label htmlFor="multasPenalidades">Multas e Penalidades</Label>
                  <Controller name="multasPenalidades" control={control} render={({ field }) => <Textarea id="multasPenalidades" {...field} rows={3} />} />
                  {errors.multasPenalidades && <p className="text-sm text-destructive mt-1">{errors.multasPenalidades.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cancelamento">Cancelamento</Label>
                  <Controller name="cancelamento" control={control} render={({ field }) => <Textarea id="cancelamento" {...field} rows={3} />} />
                  {errors.cancelamento && <p className="text-sm text-destructive mt-1">{errors.cancelamento.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="foro">Foro (opcional)</Label>
                  <Controller name="foro" control={control} render={({ field }) => <Input id="foro" {...field} placeholder="Ex: Comarca de [Sua Cidade]/[UF]" />} />
                  {errors.foro && <p className="text-sm text-destructive mt-1">{errors.foro.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com tipo de contrato e ações */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipo e Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Contrato</Label>
                  <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="tipo">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="padrão">Padrão</SelectItem>
                          <SelectItem value="emergencial">Emergencial</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Rascunho do Contrato"}
                </Button>
              </CardFooter>
            </Card>
             <Card>
                <CardHeader><CardTitle>Próximos Passos</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Salve o rascunho deste contrato.</p>
                    <p>2. Visualize o contrato gerado (em breve).</p>
                    <p>3. Envie para assinatura do cliente e testemunhas (em breve).</p>
                    <p>4. Acompanhe o status das assinaturas (em breve).</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
