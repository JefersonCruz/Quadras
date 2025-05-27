
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
  multasPenalidades: z.string().min(5, "Informação sobre multas/penalidades/responsabilidades/garantia é obrigatória."),
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
      objetoDoContrato: "CLÁUSULA 1 – OBJETO\nO presente contrato tem como objeto a prestação de serviços técnicos de [DESCREVER SERVIÇO: instalação elétrica, reparos, manutenção, projeto, etc.], a serem realizados no endereço: [LOCAL DE EXECUÇÃO].",
      prazoDeExecucao: "CLÁUSULA 2 – PRAZO\nA execução dos serviços terá início em [DATA INICIAL] e prazo estimado de [X DIAS/SEMANAS], podendo ser prorrogado por acordo entre as partes.",
      condicoesDePagamento: "CLÁUSULA 3 – VALOR E CONDIÇÕES DE PAGAMENTO\nO valor total dos serviços é de R$ [XXXX,XX] (por extenso), a ser pago da seguinte forma:\n[ ] À vista\n[ ] Parcelado em [X] vezes de R$ [XX,XX]\n[ ] Entrada de R$ [XX,XX] e o restante ao término\nO pagamento será efetuado mediante [PIX | dinheiro | transferência bancária].",
      fornecimentoDeMateriais: "CLÁUSULA 4 – RESPONSABILIDADES DO CONTRATADO (Materiais)\n- Utilizar materiais de qualidade (caso o CONTRATADO forneça).\n- Os materiais necessários para a execução dos serviços serão fornecidos pelo [CONTRATADO/CONTRATANTE], e seus custos serão [detalhados em anexo/incluídos no valor total], mediante apresentação de notas fiscais, ou [outra condição].",
      multasPenalidades: "CLÁUSULA 4 – RESPONSABILIDADES DO CONTRATADO\nO CONTRATADO se obriga a:\n- Executar os serviços com zelo, segurança e qualidade técnica.\n- Seguir as normas técnicas (ex: NBR 5410 para instalações elétricas).\n- Assumir responsabilidades por danos causados por imperícia ou negligência.\n- Emitir recibo ou nota fiscal (se for empresa).\n\nCLÁUSULA 5 – RESPONSABILIDADES DO CONTRATANTE\nO CONTRATANTE se compromete a:\n- Disponibilizar acesso ao local dos serviços.\n- Fornecer energia, água e condições adequadas de trabalho (se necessário).\n- Efetuar os pagamentos nas condições acordadas.\n\nCLÁUSULA 6 – GARANTIA (SE APLICÁVEL)\nO CONTRATADO garante os serviços prestados por [90 dias] a contar da entrega/conclusão, conforme art. 26 do Código de Defesa do Consumidor.\nCaso haja falha comprovada de execução, o serviço será refeito sem custos adicionais.",
      cancelamento: "CLÁUSULA 7 – RESCISÃO\nO presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia de [5] dias úteis.\nSe houver serviços já executados, o CONTRATADO terá direito ao valor proporcional.",
      foro: "CLÁUSULA 8 – FORO\nPara dirimir quaisquer dúvidas oriundas deste contrato, as partes elegem o foro da comarca de [CIDADE/UF].",
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
    
    const empresaPrestadorPayload: Partial<EmpresaPrestadorContrato> = { // Use Partial as not all fields are guaranteed initially
        nome: empresaUsuario?.nome || data.empresaNomeDisplay || "Empresa não informada",
    };
    const formEmpresaCnpj = empresaUsuario?.cnpj || data.empresaCnpjDisplay;
    if (formEmpresaCnpj && formEmpresaCnpj.trim() !== "" && formEmpresaCnpj !== "Não configurado") {
        empresaPrestadorPayload.cnpj = formEmpresaCnpj.trim();
    }
    const formEmpresaEndereco = empresaUsuario?.endereco || data.empresaEnderecoDisplay;
    if (formEmpresaEndereco && formEmpresaEndereco.trim() !== "" && formEmpresaEndereco !== "Não configurado") {
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
      assinaturas: {}, 
      dataCriacao: Timestamp.now(),
      dataUltimaModificacao: Timestamp.now(),
      empresaPrestador: empresaPrestadorPayload as EmpresaPrestadorContrato, // Cast as some fields might be omitted if not set
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
        description="Pelo presente instrumento particular, preencha os dados para criar um novo contrato de prestação de serviço."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5 text-primary"/> Dados da Sua Empresa (CONTRATADO)</CardTitle>
                <CardDescription>Estes dados são do seu perfil de empresa ou preenchidos com base no seu usuário. Serão incluídos no contrato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Nome da Empresa / Profissional</Label>
                  <Controller name="empresaNomeDisplay" control={control} render={({ field }) => <Input {...field} disabled />} />
                </div>
                <div>
                  <Label>CNPJ/CPF</Label>
                  <Controller name="empresaCnpjDisplay" control={control} render={({ field }) => <Input {...field} disabled />} />
                </div>
                <div>
                  <Label>Endereço Completo</Label>
                  <Controller name="empresaEnderecoDisplay" control={control} render={({ field }) => <Input {...field} disabled />} />
                </div>
                 <div>
                  <Label htmlFor="empresaResponsavel">Representado por / Responsável Técnico</Label>
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
                <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary"/> Dados do Cliente (CONTRATANTE)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clienteNome">Nome Completo do Cliente</Label>
                  <Controller name="clienteNome" control={control} render={({ field }) => <Input id="clienteNome" {...field} placeholder="[NOME DO CONTRATANTE]" />} />
                  {errors.clienteNome && <p className="text-sm text-destructive mt-1">{errors.clienteNome.message}</p>}
                </div>
                <div>
                  <Label htmlFor="clienteEmail">Email do Cliente</Label>
                  <Controller name="clienteEmail" control={control} render={({ field }) => <Input id="clienteEmail" type="email" {...field} />} />
                  {errors.clienteEmail && <p className="text-sm text-destructive mt-1">{errors.clienteEmail.message}</p>}
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="clienteCpfCnpj">CPF/CNPJ do Cliente</Label>
                  <Controller name="clienteCpfCnpj" control={control} render={({ field }) => <Input id="clienteCpfCnpj" {...field} placeholder="[CPF/CNPJ DO CONTRATANTE]" />} />
                  {errors.clienteCpfCnpj && <p className="text-sm text-destructive mt-1">{errors.clienteCpfCnpj.message}</p>}
                </div>
                <div className="md:col-span-1">
                  <Label>Endereço do Cliente</Label>
                  <Input disabled placeholder="Será obtido do cadastro do cliente" />
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
                  <Label htmlFor="objetoDoContrato">CLÁUSULA 1 – OBJETO</Label>
                  <Controller name="objetoDoContrato" control={control} render={({ field }) => <Textarea id="objetoDoContrato" {...field} rows={4} />} />
                  {errors.objetoDoContrato && <p className="text-sm text-destructive mt-1">{errors.objetoDoContrato.message}</p>}
                </div>
                <div>
                  <Label htmlFor="prazoDeExecucao">CLÁUSULA 2 – PRAZO</Label>
                  <Controller name="prazoDeExecucao" control={control} render={({ field }) => <Textarea id="prazoDeExecucao" {...field} rows={3} />} />
                  {errors.prazoDeExecucao && <p className="text-sm text-destructive mt-1">{errors.prazoDeExecucao.message}</p>}
                </div>
                <div>
                  <Label htmlFor="condicoesDePagamento">CLÁUSULA 3 – VALOR E CONDIÇÕES DE PAGAMENTO</Label>
                  <Controller name="condicoesDePagamento" control={control} render={({ field }) => <Textarea id="condicoesDePagamento" {...field} rows={5} />} />
                  {errors.condicoesDePagamento && <p className="text-sm text-destructive mt-1">{errors.condicoesDePagamento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="fornecimentoDeMateriais">CLÁUSULA 4 (EXTRATO) – FORNECIMENTO DE MATERIAIS</Label>
                  <Controller name="fornecimentoDeMateriais" control={control} render={({ field }) => <Textarea id="fornecimentoDeMateriais" {...field} rows={4} />} />
                  {errors.fornecimentoDeMateriais && <p className="text-sm text-destructive mt-1">{errors.fornecimentoDeMateriais.message}</p>}
                </div>
                <div>
                  <Label htmlFor="multasPenalidades">CLÁUSULAS 4, 5, 6 – RESPONSABILIDADES E GARANTIA</Label>
                  <Controller name="multasPenalidades" control={control} render={({ field }) => <Textarea id="multasPenalidades" {...field} rows={8} />} />
                  {errors.multasPenalidades && <p className="text-sm text-destructive mt-1">{errors.multasPenalidades.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cancelamento">CLÁUSULA 7 – RESCISÃO</Label>
                  <Controller name="cancelamento" control={control} render={({ field }) => <Textarea id="cancelamento" {...field} rows={4} />} />
                  {errors.cancelamento && <p className="text-sm text-destructive mt-1">{errors.cancelamento.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="foro">CLÁUSULA 8 – FORO</Label>
                  <Controller name="foro" control={control} render={({ field }) => <Input id="foro" {...field} placeholder="Ex: Comarca de [CIDADE/UF]" />} />
                  {errors.foro && <p className="text-sm text-destructive mt-1">{errors.foro.message}</p>}
                </div>
                 <p className="text-xs text-muted-foreground mt-2">
                   E por estarem assim justos e contratados, assinam o presente em duas vias de igual teor. [Local de assinatura], [Data da assinatura].
                 </p>
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
                    <p>2. Visualize o contrato gerado na lista de contratos.</p>
                    <p>3. Compartilhe o link para assinatura do cliente e testemunhas.</p>
                    <p>4. Acompanhe o status das assinaturas.</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

    