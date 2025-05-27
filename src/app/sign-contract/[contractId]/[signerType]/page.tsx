
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Contrato, AssinaturaDetalhes, AssinaturasContrato } from "@/types/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertTriangle, UserCheck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SignerTypeParam = 'client' | 'witness1' | 'witness2' | 'provider';
type SignerKeyInFirestore = keyof AssinaturasContrato;

interface SignerContextDetails {
  keyInFirestore: SignerKeyInFirestore;
  name: string;
  email?: string;
  roleDescription: string;
}


export default function SignContractPage() {
  const params = useParams();
  const { toast } = useToast();

  const contractId = params.contractId as string;
  const signerTypeParam = params.signerType as SignerTypeParam;

  const [contract, setContract] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signerContext, setSignerContext] = useState<SignerContextDetails | null>(null);


  useEffect(() => {
    if (!contractId) {
      setError("ID do contrato não fornecido.");
      setLoading(false);
      return;
    }
    const validSignerTypes: SignerTypeParam[] = ['client', 'witness1', 'witness2', 'provider'];
    if (!validSignerTypes.includes(signerTypeParam)) {
        setError("Tipo de assinante inválido na URL.");
        setLoading(false);
        return;
    }

    const fetchContract = async () => {
      setLoading(true);
      setError(null);
      setSignerContext(null);
      try {
        const contractRef = doc(db, "contratos", contractId);
        const docSnap = await getDoc(contractRef);

        if (docSnap.exists()) {
          const contractData = { id: docSnap.id, ...docSnap.data() } as Contrato;
          setContract(contractData);

          let currentSignerKey: SignerKeyInFirestore;
          let name: string | undefined;
          let email: string | undefined;
          let roleDesc: string = "";

          switch (signerTypeParam) {
            case 'client':
              currentSignerKey = 'cliente';
              name = contractData.cliente?.nome;
              email = contractData.cliente?.email;
              roleDesc = name ? `Cliente (${name})` : "Cliente";
              break;
            case 'witness1':
              currentSignerKey = 'testemunha1';
              name = contractData.testemunhas?.[0]?.nome;
              email = contractData.testemunhas?.[0]?.email;
              roleDesc = name ? `Testemunha 1 (${name})` : "Testemunha 1";
              break;
            case 'witness2':
              currentSignerKey = 'testemunha2';
              name = contractData.testemunhas?.[1]?.nome;
              email = contractData.testemunhas?.[1]?.email;
              roleDesc = name ? `Testemunha 2 (${name})` : "Testemunha 2";
              break;
            case 'provider':
              currentSignerKey = 'prestador';
              // The name displayed for the provider.
              // The actual signing name for the provider (if rules are strict) will be handled in handleSignContract.
              name = contractData.empresaPrestador?.responsavelTecnico || contractData.empresaPrestador?.nome || "Prestador de Serviço";
              email = contractData.empresaPrestador?.email; 
              roleDesc = `Prestador (${name})`;
              break;
            default:
              setError("Tipo de assinante desconhecido.");
              setLoading(false);
              return;
          }

           if (!name && (signerTypeParam !== 'provider' || !(contractData.empresaPrestador?.nome || contractData.empresaPrestador?.responsavelTecnico) )) {
             setError(`Detalhes para ${roleDesc || signerTypeParam} não encontrados ou não aplicáveis neste contrato.`);
             setLoading(false);
             return;
           }
          setSignerContext({ keyInFirestore: currentSignerKey, name: name || "N/A", email, roleDescription: roleDesc });

        } else {
          setError("Contrato não encontrado. Verifique o link ou se você tem permissão para acessá-lo.");
        }
      } catch (err: any) {
        console.error("Erro ao buscar contrato:", err);
        setError(err.message || "Ocorreu um erro ao buscar o contrato.");
        // toast({ // Toast removed from here as it's in dependency array and might cause loops on error
        //   title: "Erro ao carregar contrato",
        //   description: "Não foi possível carregar os dados do contrato.",
        //   variant: "destructive",
        // });
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId, signerTypeParam]);

  const isAlreadySignedByCurrentParty = () => {
    if (!contract || !signerContext || !contract.assinaturas || !signerContext.keyInFirestore) return false;
    return !!contract.assinaturas[signerContext.keyInFirestore]?.dataHora;
  };

  const handleSignContract = async () => {
    if (!contract || !contract.id || !signerContext || !signerContext.keyInFirestore) {
        toast({ title: "Erro", description: "Dados do contrato ou informações do assinante ausentes.", variant: "destructive"});
        return;
    }
    if (isAlreadySignedByCurrentParty()) {
        toast({ title: "Já Assinado", description: "Este contrato já foi assinado por você.", variant: "default"});
        return;
    }
    if (contract.status === 'assinado' || contract.status === 'cancelado') {
      toast({ title: "Contrato Finalizado", description: `Este contrato já está ${contract.status}. Não pode mais ser assinado.`, variant: "default"});
      return;
    }

    setIsSigning(true);
    try {
        const contractRef = doc(db, "contratos", contract.id);
        
        const signatureData: AssinaturaDetalhes = {
            nome: "", // Placeholder, will be overwritten
            dataHora: Timestamp.now(),
          };

        // Determine the correct name and email for the signature record
        // This MUST align with what the security rules expect for validation if they are strict on name.
        if (signerTypeParam === 'client' && contract.cliente) {
            signatureData.nome = contract.cliente.nome;
            if (contract.cliente.email) signatureData.email = contract.cliente.email;
        } else if (signerTypeParam === 'witness1' && contract.testemunhas?.[0]) {
            signatureData.nome = contract.testemunhas[0].nome;
            if (contract.testemunhas[0].email) signatureData.email = contract.testemunhas[0].email;
        } else if (signerTypeParam === 'witness2' && contract.testemunhas?.[1]) {
            signatureData.nome = contract.testemunhas[1].nome;
            if (contract.testemunhas[1].email) signatureData.email = contract.testemunhas[1].email;
        } else if (signerTypeParam === 'provider') {
            // Firestore rule for provider name check: incomingData().assinaturas.prestador.nome == contractResource().empresaPrestador.responsavelTecnico
            // So, 'responsavelTecnico' MUST be set in the contract for the provider to sign successfully with this rule.
            if (contract.empresaPrestador?.responsavelTecnico) {
                signatureData.nome = contract.empresaPrestador.responsavelTecnico;
            } else {
                toast({ title: "Erro de Configuração do Contrato", description: "Não é possível assinar como prestador: O 'Responsável Técnico' da empresa não está definido nos dados do contrato. Contate o administrador.", variant: "destructive", duration: 7000 });
                setIsSigning(false);
                return;
            }
            if (contract.empresaPrestador?.email) signatureData.email = contract.empresaPrestador.email;
        } else {
            // Fallback, but ideally this case shouldn't be reached if signerContext is always valid.
            toast({ title: "Erro Interno", description: "Tipo de assinante inválido para determinar o nome da assinatura.", variant: "destructive" });
            setIsSigning(false);
            return;
        }


        const updatedSignatures: AssinaturasContrato = {
          ...(contract.assinaturas || {}),
          [signerContext.keyInFirestore]: signatureData,
        };

        // Determine new status
        let newStatus: Contrato['status'] = contract.status; 
        const allSignaturesMap = { ...updatedSignatures };
        let allRequiredSigned = true;

        if (!allSignaturesMap.cliente?.dataHora) allRequiredSigned = false;
        if (!allSignaturesMap.prestador?.dataHora) allRequiredSigned = false; 
        
        if (contract.testemunhas && contract.testemunhas.length > 0) {
            if (!allSignaturesMap.testemunha1?.dataHora) allRequiredSigned = false;
            if (contract.testemunhas.length > 1 && !allSignaturesMap.testemunha2?.dataHora) {
                allRequiredSigned = false;
            }
        } else {
          // If no witnesses are defined in the contract, they are not required for it to be 'assinado'
        }
        
        if (allRequiredSigned) {
            newStatus = 'assinado';
        } else if (Object.values(allSignaturesMap).some(sig => sig?.dataHora)) {
            newStatus = 'parcialmente_assinado';
        } else if (contract.status === 'rascunho') { // If it was rascunho and first signature comes in
             newStatus = 'pendente_assinaturas'; // Or 'parcialmente_assinado' if preferred
        }
        
        const updatePayload: Partial<Contrato> = {
          assinaturas: updatedSignatures,
          status: newStatus,
          dataUltimaModificacao: Timestamp.now(),
        };

        if (newStatus === 'assinado' && contract.status !== 'assinado') {
            updatePayload.dataFinalizacaoAssinaturas = Timestamp.now();
        }
        
        await updateDoc(contractRef, updatePayload);

        setContract(prev => prev ? ({
            ...prev,
            assinaturas: updatedSignatures,
            status: newStatus,
            dataUltimaModificacao: updatePayload.dataUltimaModificacao,
            dataFinalizacaoAssinaturas: newStatus === 'assinado' ? updatePayload.dataFinalizacaoAssinaturas : prev.dataFinalizacaoAssinaturas,
        }) : null);

        toast({ title: "Contrato Assinado!", description: `Obrigado, ${signatureData.nome}. Sua assinatura foi registrada.`});

    } catch (error: any) {
        console.error("Erro ao assinar contrato:", error);
        let description = "Não foi possível registrar sua assinatura.";
        if (error.code === 'permission-denied') {
            description = "Você não tem permissão para assinar este contrato ou a operação foi bloqueada pelas regras de segurança. Verifique se está logado com o e-mail correto ou se o contrato permite sua assinatura.";
        } else if (error.message) {
            description = error.message;
        }
        toast({ title: "Erro ao Assinar", description, variant: "destructive" });
    } finally {
        setIsSigning(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Carregando contrato...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
            <CardTitle className="flex items-center justify-center text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" /> Erro ao Carregar Contrato
            </CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-muted-foreground">{error}</p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/">Voltar para a Página Inicial</Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  if (!contract || !signerContext) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center text-destructive">
                        <AlertTriangle className="mr-2 h-6 w-6" /> Dados Incompletos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Não foi possível carregar os detalhes do contrato ou do assinante. Verifique se o link está correto e tente novamente.</p>
                </CardContent>
                 <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/">Voltar para a Página Inicial</Link>
                    </Button>
                </CardFooter>
            </Card>
         </div>
    );
  }
  
  const alreadySigned = isAlreadySignedByCurrentParty();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-2xl">
        <CardHeader>
            <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-3 h-7 w-7 text-primary" />
            Assinatura de Contrato Digital
            </CardTitle>
            <CardDescription>
            Contrato para: <span className="font-semibold">{contract.cliente?.nome || "Cliente não informado"}</span>
            <br />
            Tipo: <span className="font-semibold">{contract.tipo === 'padrão' ? 'Padrão' : 'Emergencial'}</span>
            {contract.id && <span className="block text-xs text-muted-foreground mt-1">ID: {contract.id}</span>}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 border rounded-md bg-muted/50">
                <h3 className="font-semibold text-lg mb-1">Sua Função:</h3>
                <p className="text-md flex items-center"><UserCheck size={20} className="mr-2 text-accent"/> {signerContext.roleDescription}</p>
                {signerContext.email && <p className="text-sm text-muted-foreground ml-7">{signerContext.email}</p>}
            </div>

            <div className="p-4 border rounded-md max-h-60 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-2">Objeto do Contrato (Resumo):</h3>
            <p className="text-sm whitespace-pre-wrap">
                {contract.blocosEditaveis?.objetoDoContrato || "Objeto do contrato não especificado."}
            </p>
            {contract.tipo === 'emergencial' && contract.termosEmergencial && (
                <div className="mt-3 pt-3 border-t">
                    <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-500">Termos Emergenciais Específicos:</h4>
                    <p className="text-sm whitespace-pre-wrap">{contract.termosEmergencial}</p>
                    {contract.taxaDeslocamento !== undefined && <p className="text-sm font-medium mt-1">Taxa de Deslocamento: R$ {contract.taxaDeslocamento.toFixed(2)}</p>}
                </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
                Este é um resumo. O documento completo será disponibilizado após todas as assinaturas.
            </p>
            </div>
            
            {alreadySigned ? (
            <div className="p-4 border rounded-md bg-green-100 dark:bg-green-900/70 text-green-700 dark:text-green-300 flex items-center gap-3">
                <CheckCircle size={24} />
                <div>
                    <p className="font-semibold">Este contrato já foi assinado por você.</p>
                    <p className="text-xs">Assinado em: {contract.assinaturas[signerContext.keyInFirestore]?.dataHora ? format(contract.assinaturas[signerContext.keyInFirestore]!.dataHora!.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}</p>
                </div>
            </div>
            ) : (
            <div className="p-6 border-2 border-dashed border-primary/50 rounded-md text-center space-y-4 bg-background">
                <h3 className="font-semibold text-xl text-primary">Confirmar Assinatura Eletrônica</h3>
                <p className="text-sm text-muted-foreground">
                    Ao clicar em "Assinar Contrato Digitalmente", você, <span className="font-bold">{signerContext.name}</span>, declara que leu, compreendeu e concorda com todos os termos e condições do contrato apresentado. Sua assinatura digital terá validade jurídica.
                </p>
            <Button 
                onClick={handleSignContract} 
                disabled={isSigning || contract.status === 'assinado' || contract.status === 'cancelado'}
                size="lg"
                className="w-full max-w-xs mx-auto text-base py-6"
            >
                {isSigning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Assinar Contrato Digitalmente"}
            </Button>
            {contract.status === 'assinado' && <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">Este contrato já foi totalmente assinado.</p>}
            {contract.status === 'cancelado' && <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-2">Este contrato foi cancelado e não pode mais ser assinado.</p>}
            </div>
            )}
        </CardContent>
        <CardFooter className="flex-col items-start text-xs text-muted-foreground space-y-1 pt-4">
            <p>Em caso de dúvidas, entre em contato com {contract.empresaPrestador?.nome || "o prestador de serviço"} (Email: {contract.empresaPrestador?.email || contract.cliente?.email || "não informado"}).</p>
            <p>Powered by ANODE Lite</p>
             <Button variant="link" size="sm" asChild className="mt-2 p-0 h-auto">
                <Link href="/">Voltar à Página Inicial</Link>
            </Button>
        </CardFooter>
        </Card>
    </div>
  );
}
