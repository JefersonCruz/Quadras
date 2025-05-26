
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
import type { Contrato, Empresa, TestemunhaContrato, ClienteContrato, EmpresaPrestadorContrato, BlocosEditaveisContrato } from "@/types/firestore";
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

  // Campos da empresa (preenchidos automaticamente e um editável)
  empresaNomeDisplay: z.string().optional(), // Display only, fetched data
  empresaCnpjDisplay: z.string().optional(), // Display only, fetched data
  empresaEnderecoDisplay: z.string().optional(), // Display only, fetched data
  empresaResponsavel: z.string().min(3, "Responsável da empresa é obrigatório.").optional(),
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
      objetoDoContrato: "Prestação de serviços de instalação e manutenção elétrica, incluindo, mas não se limitando a: [Descrever os serviços].",
      prazoDeExecucao: "O serviço será executado em [Número] dias úteis a contar da data de assinatura deste contrato, ou conforme cronograma a ser acordado entre as partes.",
      condicoesDePagamento: "O pagamento será realizado da seguinte forma: 50% (cinquenta por cento) do valor total no ato da assinatura deste contrato, a título de sinal, e os 50% (cinquenta por cento) restantes após a conclusão e aprovação dos serviços. Formas de pagamento aceitas: [Pix, Transferência Bancária, etc.].",
      fornecimentoDeMateriais: "Os materiais necessários para a execução dos serviços serão fornecidos pelo CONTRATADO, e seus custos serão discriminados e repassados ao CONTRATANTE, mediante apresentação de notas fiscais, ou [outra condição].",
      multasPenalidades: "Em caso de descumprimento de quaisquer cláusulas deste contrato por qualquer das partes, incidirá multa de 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de eventuais perdas e danos.",
      cancelamento: "Qualquer das partes poderá rescindir o presente contrato mediante aviso prévio de 30 (trinta) dias. Em caso de rescisão imotivada pelo CONTRATANTE, este arcará com os custos dos serviços já executados e materiais adquiridos até a data da rescisão, acrescido de multa rescisória de [Percentual]% sobre o valor remanescente do contrato.",
      foro: "Fica eleito o foro da comarca de [Cidade da Empresa Prestadora]/[UF] para dirimir quaisquer controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.",
      empresaNomeDisplay: "",
      empresaCnpjDisplay: "",
      empresaEnderecoDisplay: "",
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
          setValue("empresaNomeDisplay", empresa.nome || "Não configurado");
          setValue("empresaCnpjDisplay", empresa.cnpj || "Não configurado");
          setValue("empresaEnderecoDisplay", empresa.endereco || "Não configurado");
        } else {
           toast({ title: "Dados da Empresa Não Configurados", description: "Configure o perfil da sua empresa para preenchimento automático dos dados do prestador.", variant: "default", duration: 5000});
        }
        if (userData?.nome) {
            setValue("empresaResponsavel", userData.nome, { shouldValidate: true });
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
    if (data.testemunha1Nome && data.testemunha1Email && data.testemunha1Nome.trim() !== "" && data.testemunha1Email.trim() !== "") {
      testemunhasArray.push({ nome: data.testemunha1Nome, email: data.testemunha1Email });
    }
    if (data.testemunha2Nome && data.testemunha2Email && data.testemunha2Nome.trim() !== "" && data.testemunha2Email.trim() !== "") {
      testemunhasArray.push({ nome: data.testemunha2Nome, email: data.testemunha2Email });
    }

    const clientePayload: ClienteContrato = {
      nome: data.clienteNome,
      email: data.clienteEmail,
    };
    if (data.clienteCpfCnpj && data.clienteCpfCnpj.trim() !== "") {
      clientePayload.cpfCnpj = data.clienteCpfCnpj.trim();
    }

    const blocosEditaveisPayload: BlocosEditaveisContrato = {
      objetoDoContrato: data.objetoDoContrato,
      prazoDeExecucao: data.prazoDeExecucao,
      condicoesDePagamento: data.condicoesDePagamento,
      fornecimentoDeMateriais: data.fornecimentoDeMateriais,
      multasPenalidades: data.multasPenalidades,
      cancelamento: data.cancelamento,
    };
    if (data.foro && data.foro.trim() !== "") {
      blocosEditaveisPayload.foro = data.foro.trim();
    }
    
    const empresaPrestadorPayload: EmpresaPrestadorContrato = {
        nome: empresaUsuario?.nome || data.empresaNomeDisplay || "Empresa não informada",
    };
    const formEmpresaCnpj = empresaUsuario?.cnpj || data.empresaCnpjDisplay;
    if (formEmpresaCnpj && formEmpresaCnpj.trim() !== "") {
        empresaPrestadorPayload.cnpj = formEmpresaCnpj.trim();
    }
    const formEmpresaEndereco = empresaUsuario?.endereco || data.empresaEnderecoDisplay;
    if (formEmpresaEndereco && formEmpresaEndereco.trim() !== "") {
        empresaPrestadorPayload.endereco = formEmpresaEndereco.trim();
    }
    const formEmpresaResponsavel = data.empresaResponsavel || userData?.nome;
    if (formEmpresaResponsavel && formEmpresaResponsavel.trim() !== "") {
        empresaPrestadorPayload.responsavelTecnico = formEmpresaResponsavel.trim();
    }


    const newContractData: Omit<Contrato, 'id'> = {
      createdBy: user.uid,
      tipo: data.tipo,
      cliente: clientePayload,
      blocosEditaveis: blocosEditaveisPayload,
      status: 'rascunho', 
      assinaturas: {}, // Initialize as an empty object
      dataCriacao: Timestamp.now(),
      dataUltimaModificacao: Timestamp.now(),
      empresaPrestador: empresaPrestadorPayload,
    };

    if (testemunhasArray.length > 0) {
      newContractData.testemunhas = testemunhasArray;
    }

    if (data.tipo === 'emergencial') {
        newContractData.taxaDeslocamento = 100.00; 
        newContractData.termosEmergencial = "Para atendimentos emergenciais, aplica-se uma taxa de deslocamento de R$100,00. O aceite destes termos implica na concordância do pagamento da referida taxa, mesmo que o serviço não seja executado por decisão do cliente após a chegada do técnico, ou caso o técnico já esteja a caminho e o chamado seja cancelado. O valor do serviço será orçado no local antes da execução.";
    }

    try {
      await addDoc(collection(db, "contratos"), newContractData); 
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
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/> Dados da Sua Empresa (Prestador)</CardTitle>
                <CardDescription>Estes dados são do seu perfil de empresa ou preenchidos com base no seu usuário. Serão incluídos no contrato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nome da Empresa</Label>
                  <Controller name="empresaNomeDisplay" control={control} render={({ field }) => <Input {...field} disabled />} />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Controller name="empresaCnpjDisplay" control={control} render={({ field }) => <Input {...field} disabled />} />
                </div>
                <div>
                  <Label>Endereço da Empresa</Label>
                  <Controller name="empresaEnderecoDisplay" control={control} render={({ field }) => <Input {...field} disabled />} />
                </div>
                 <div>
                  <Label htmlFor="empresaResponsavel">Responsável Técnico (Sua Empresa)</Label>
                   <Controller
                    name="empresaResponsavel"
                    control={control}
                    render={({ field }) => <Input id="empresaResponsavel" {...field} placeholder="Seu nome como responsável" />}
                  />
                  {errors.empresaResponsavel && <p className="text-sm text-destructive mt-1">{errors.empresaResponsavel.message}</p>}
                </div>
              </CardContent>
            </Card>
            
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Dados das Testemunhas (Opcional)</CardTitle>
                <CardDescription>Informe os dados de até duas testemunhas para o contrato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><FileSignature className="mr-2 h-5 w-5 text-primary"/> Cláusulas Editáveis do Contrato</CardTitle>
                <CardDescription>Ajuste as cláusulas conforme necessário. Os textos padrão servem como base.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="objetoDoContrato">Objeto do Contrato</Label>
                  <Controller name="objetoDoContrato" control={control} render={({ field }) => <Textarea id="objetoDoContrato" {...field} rows={3} />} />
                  {errors.objetoDoContrato && <p className="text-sm text-destructive mt-1">{errors.objetoDoContrato.message}</p>}
                </div>
                <div>
                  <Label htmlFor="prazoDeExecucao">Prazo de Execução</Label>
                  <Controller name="prazoDeExecucao" control={control} render={({ field }) => <Textarea id="prazoDeExecucao" {...field} rows={2} />} />
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
                  <Label htmlFor="cancelamento">Cancelamento e Rescisão</Label>
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

