
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Contrato, AssinaturaDetalhes, AssinaturasContrato } from "@/types/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertTriangle, UserCheck, CheckCircle, Info } from "lucide-react";
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

  const fetchContract = useCallback(async () => {
    if (!contractId) {
      setError("ID do contrato não fornecido na URL.");
      setLoading(false);
      return;
    }
    const validSignerTypes: SignerTypeParam[] = ['client', 'witness1', 'witness2', 'provider'];
    if (!validSignerTypes.includes(signerTypeParam)) {
      setError("Tipo de assinante inválido na URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSignerContext(null); // Reset signer context on new fetch
    try {
      const contractRef = doc(db, "contratos", contractId);
      const docSnap = await getDoc(contractRef);

      if (docSnap.exists()) {
        const contractData = { id: docSnap.id, ...docSnap.data() } as Contrato;
        setContract(contractData);

        let currentSignerKey: SignerKeyInFirestore | undefined;
        let name: string | undefined;
        let email: string | undefined;
        let roleDesc: string = "";

        switch (signerTypeParam) {
          case 'client':
            currentSignerKey = 'cliente';
            name = contractData.cliente?.nome;
            email = contractData.cliente?.email;
            roleDesc = `Cliente (${name || 'Não especificado'})`;
            break;
          case 'witness1':
            currentSignerKey = 'testemunha1';
            if (contractData.testemunhas && contractData.testemunhas[0]) {
              name = contractData.testemunhas[0].nome;
              email = contractData.testemunhas[0].email;
              roleDesc = `Testemunha 1 (${name || 'Não especificado'})`;
            } else {
              setError("Detalhes da Testemunha 1 não encontrados ou não aplicáveis neste contrato.");
              setLoading(false);
              return;
            }
            break;
          case 'witness2':
            currentSignerKey = 'testemunha2';
             if (contractData.testemunhas && contractData.testemunhas[1]) {
              name = contractData.testemunhas[1].nome;
              email = contractData.testemunhas[1].email;
              roleDesc = `Testemunha 2 (${name || 'Não especificado'})`;
            } else {
              setError("Detalhes da Testemunha 2 não encontrados ou não aplicáveis neste contrato.");
              setLoading(false);
              return;
            }
            break;
          case 'provider':
            currentSignerKey = 'prestador';
            name = contractData.empresaPrestador?.responsavelTecnico || contractData.empresaPrestador?.nome || "Prestador de Serviço";
            email = contractData.empresaPrestador?.email; // Assuming provider might have an email
            roleDesc = `Prestador (${name})`;
            break;
          default:
            setError("Tipo de assinante desconhecido.");
            setLoading(false);
            return;
        }

        if (!name || !currentSignerKey) {
          setError(`Detalhes para o papel '${signerTypeParam}' não puderam ser determinados para este contrato.`);
          setLoading(false);
          return;
        }
        setSignerContext({ keyInFirestore: currentSignerKey, name: name, email, roleDescription: roleDesc });

      } else {
        setError("Contrato não encontrado. Verifique o link ou se você tem permissão para acessá-lo.");
      }
    } catch (err: any) {
      console.error("Erro ao buscar contrato:", err);
      setError(err.message || "Ocorreu um erro ao buscar os detalhes do contrato.");
    } finally {
      setLoading(false);
    }
  }, [contractId, signerTypeParam]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const isAlreadySignedByCurrentParty = () => {
    if (!contract || !signerContext || !contract.assinaturas || !signerContext.keyInFirestore) return false;
    return !!contract.assinaturas[signerContext.keyInFirestore]?.dataHora;
  };
  
  const currentPartySignatureTime = () => {
    if (!contract || !signerContext || !contract.assinaturas || !signerContext.keyInFirestore) return null;
    const signature = contract.assinaturas[signerContext.keyInFirestore];
    return signature?.dataHora ? format(signature.dataHora.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null;
  };

  const isContractFullySigned = () => {
    if (!contract) return false;
    return contract.status === 'assinado';
  };

  const handleSignContract = async () => {
    if (!contract || !contract.id || !signerContext || !signerContext.keyInFirestore) {
      toast({ title: "Erro", description: "Dados do contrato ou informações do assinante ausentes.", variant: "destructive" });
      return;
    }
    if (isAlreadySignedByCurrentParty()) {
      toast({ title: "Já Assinado", description: "Este contrato já foi assinado por você.", variant: "default" });
      return;
    }
    if (contract.status === 'assinado' || contract.status === 'cancelado') {
      toast({ title: "Contrato Finalizado", description: `Este contrato já está ${contract.status}. Não pode mais ser assinado.`, variant: "default" });
      return;
    }

    setIsSigning(true);
    try {
      const contractRef = doc(db, "contratos", contract.id);
      const currentSignerKey = signerContext.keyInFirestore;

      const signatureData: AssinaturaDetalhes = {
        nome: signerContext.name,
        email: signerContext.email,
        dataHora: Timestamp.now(),
        // IP, canalAcesso, userAgent poderiam ser adicionados aqui se coletados
      };

      if (signerTypeParam === 'provider') {
        if (!contract.empresaPrestador?.responsavelTecnico) {
            toast({ title: "Erro de Configuração", description: "Não é possível assinar como prestador: 'Responsável Técnico' não definido no contrato.", variant: "destructive", duration: 7000 });
            setIsSigning(false);
            return;
        }
        signatureData.nome = contract.empresaPrestador.responsavelTecnico;
      }


      const updatedSignatures: AssinaturasContrato = {
        ...(contract.assinaturas || {}),
        [currentSignerKey]: signatureData,
      };

      // Determinar novo status do contrato
      let newStatus: Contrato['status'] = contract.status;
      const requiredSigners: SignerKeyInFirestore[] = ['cliente', 'prestador'];
      if (contract.testemunhas && contract.testemunhas.length > 0) {
        requiredSigners.push('testemunha1');
        if (contract.testemunhas.length > 1) {
          requiredSigners.push('testemunha2');
        }
      }

      const allRequiredSigned = requiredSigners.every(key => !!updatedSignatures[key]?.dataHora);

      if (allRequiredSigned) {
        newStatus = 'assinado';
      } else if (Object.values(updatedSignatures).some(sig => sig?.dataHora)) {
        newStatus = 'parcialmente_assinado';
      }
      // Se o status era 'rascunho', e agora tem pelo menos uma assinatura, muda para 'pendente_assinaturas'
      // ou 'parcialmente_assinado' se for mais apropriado.
      // A lógica do status já lida com 'pendente_assinaturas' -> 'parcialmente_assinado'
      if (contract.status === 'rascunho' && newStatus !== 'assinado') {
        newStatus = Object.values(updatedSignatures).some(sig => sig?.dataHora) ? 'parcialmente_assinado' : 'pendente_assinaturas';
      }


      const updatePayload: any = { // Usando any para flexibilidade, garanta que as chaves correspondam à estrutura do Firestore
        [`assinaturas.${currentSignerKey}`]: signatureData,
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

      toast({ title: "Contrato Assinado!", description: `Obrigado, ${signatureData.nome}. Sua assinatura foi registrada.` });

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
  const contractFullySigned = isContractFullySigned();
  const signatureTime = currentPartySignatureTime();

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
            Prestador: <span className="font-semibold">{contract.empresaPrestador?.nome || "Prestador não informado"}</span>
            <br />
            Tipo: <span className="font-semibold">{contract.tipo === 'padrão' ? 'Padrão' : 'Emergencial'}</span>
            {contract.id && <span className="block text-xs text-muted-foreground mt-1">ID do Contrato: {contract.id}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="font-semibold text-lg mb-1">Seus Detalhes para Assinatura:</h3>
            <p className="text-md flex items-center"><UserCheck size={20} className="mr-2 text-accent" /> {signerContext.roleDescription}</p>
            {signerContext.email && <p className="text-sm text-muted-foreground ml-7">Email: {signerContext.email}</p>}
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
          
          {contractFullySigned ? (
             <div className="p-4 border rounded-md bg-green-100 dark:bg-green-900/70 text-green-700 dark:text-green-300 flex items-center gap-3">
              <CheckCircle size={24} />
              <div>
                <p className="font-semibold">Este contrato já foi totalmente assinado por todas as partes.</p>
                {contract.dataFinalizacaoAssinaturas && <p className="text-xs">Finalizado em: {format(contract.dataFinalizacaoAssinaturas.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
              </div>
            </div>
          ) : alreadySigned ? (
            <div className="p-4 border rounded-md bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 flex items-center gap-3">
              <Info size={24} />
              <div>
                <p className="font-semibold">Você já assinou este contrato.</p>
                {signatureTime && <p className="text-xs">Assinado em: {signatureTime}</p>}
                 <p className="text-xs mt-1">Aguardando as demais assinaturas.</p>
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
                disabled={isSigning || contract.status === 'cancelado'}
                size="lg"
                className="w-full max-w-xs mx-auto text-base py-6"
              >
                {isSigning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Assinar Contrato Digitalmente"}
              </Button>
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

