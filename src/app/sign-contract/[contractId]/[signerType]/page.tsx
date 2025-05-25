
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Contrato } from "@/types/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertTriangle, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type SignerType = 'client' | 'witness1' | 'witness2' | 'provider';

export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const contractId = params.contractId as string;
  const signerType = params.signerType as SignerType;

  const [contract, setContract] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (!contractId) {
      setError("ID do contrato não fornecido.");
      setLoading(false);
      return;
    }
    if (!['client', 'witness1', 'witness2', 'provider'].includes(signerType)) {
        setError("Tipo de assinante inválido.");
        setLoading(false);
        return;
    }

    const fetchContract = async () => {
      setLoading(true);
      try {
        const contractRef = doc(db, "contratos", contractId);
        const docSnap = await getDoc(contractRef);

        if (docSnap.exists()) {
          const contractData = docSnap.data() as Contrato;
          // Basic check: For now, allow viewing if contract exists.
          // Future: Implement token-based access or require signer authentication.
          setContract(contractData);
        } else {
          setError("Contrato não encontrado ou você não tem permissão para acessá-lo.");
        }
      } catch (err: any) {
        console.error("Erro ao buscar contrato:", err);
        setError(err.message || "Ocorreu um erro ao buscar o contrato. Verifique as permissões do Firestore.");
        toast({
          title: "Erro ao carregar contrato",
          description: "Não foi possível carregar os dados do contrato. Verifique as permissões ou tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId, signerType, toast]);

  const getSignerRoleDescription = () => {
    switch (signerType) {
      case 'client':
        return `Cliente (${contract?.cliente.nome || 'Cliente'})`;
      case 'witness1':
        return `Testemunha 1 (${contract?.testemunhas?.[0]?.nome || 'Testemunha 1'})`;
      case 'witness2':
        return `Testemunha 2 (${contract?.testemunhas?.[1]?.nome || 'Testemunha 2'})`;
      case 'provider':
        return `Prestador de Serviço (${contract?.empresaPrestador?.responsavelTecnico || contract?.empresaPrestador?.nome || 'Prestador'})`;
      default:
        return "Desconhecido";
    }
  };
  
  const handleSignContract = async () => {
    setIsSigning(true);
    // TODO: Implement actual signing logic
    // 1. Authenticate the user (if not already)
    // 2. Collect signature data (IP, timestamp, userAgent)
    // 3. Update Firestore:
    //    - contract.assinaturas[signerType] = { ...signatureData }
    //    - Update contract.status (e.g., 'parcialmente_assinado', 'assinado')
    // 4. Handle success/error with toasts
    toast({ title: "Assinatura (Simulação)", description: `Contrato assinado como ${getSignerRoleDescription()}. Funcionalidade em desenvolvimento.`});
    // Example: router.push('/signature-success');
    setIsSigning(false);
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Carregando contrato...</p>
      </div>
    );
  }

  if (error) {
    return (
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
                <Link href="/dashboard">Voltar ao Painel</Link>
            </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!contract) {
    // Should be caught by error state, but as a fallback
    return <p>Contrato não encontrado.</p>;
  }
  
  const isAlreadySigned = () => {
    if (!contract.assinaturas) return false;
    switch (signerType) {
      case 'client': return !!contract.assinaturas.cliente?.dataHora;
      case 'witness1': return !!contract.assinaturas.testemunha1?.dataHora;
      case 'witness2': return !!contract.assinaturas.testemunha2?.dataHora;
      case 'provider': return !!contract.assinaturas.prestador?.dataHora;
      default: return false;
    }
  };


  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-3 h-7 w-7 text-primary" />
          Assinatura de Contrato Digital
        </CardTitle>
        <CardDescription>
          Você está prestes a assinar o contrato para: <span className="font-semibold">{contract.cliente.nome}</span>
          <br />
          Tipo de contrato: <span className="font-semibold">{contract.tipo === 'padrão' ? 'Padrão' : 'Emergencial'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="font-semibold text-lg mb-2">Sua Função no Contrato:</h3>
            <p className="text-md flex items-center"><UserCheck size={20} className="mr-2 text-accent"/> {getSignerRoleDescription()}</p>
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="font-semibold text-lg mb-2">Detalhes do Contrato (Visualização Simplificada):</h3>
          <p className="text-sm whitespace-pre-wrap">
            <span className="font-medium">Objeto:</span> {contract.blocosEditaveis.objetoDoContrato}
          </p>
          {/* TODO: Display more contract details here in a user-friendly way. 
                       Perhaps a summarized version or eventually an embedded PDF viewer if feasible. */}
          <p className="mt-4 text-xs text-muted-foreground">
            Este é um resumo. O documento completo será disponibilizado após todas as assinaturas.
          </p>
        </div>
        
        {isAlreadySigned() ? (
           <div className="p-4 border rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
            <p className="font-semibold">Este contrato já foi assinado por você como {getSignerRoleDescription()} em {contract.assinaturas[signerType]?.dataHora ? new Date(contract.assinaturas[signerType]!.dataHora!.toDate()).toLocaleString('pt-BR') : ''}.</p>
          </div>
        ) : (
        <div className="p-4 border-2 border-dashed border-primary/50 rounded-md text-center space-y-3">
            <h3 className="font-semibold text-xl text-primary">Confirmar Assinatura</h3>
            <p className="text-sm text-muted-foreground">
                Ao clicar em "Assinar Contrato", você concorda com todos os termos e condições apresentados.
                Esta ação tem validade jurídica.
            </p>
          {/* Placeholder for authentication step if needed before signing */}
          <Button 
            onClick={handleSignContract} 
            disabled={isSigning} 
            size="lg"
            className="w-full max-w-xs mx-auto"
          >
            {isSigning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Assinar Contrato"}
          </Button>
        </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start text-xs text-muted-foreground space-y-1">
        <p>ID do Contrato: {contractId}</p>
        <p>Em caso de dúvidas, entre em contato com {contract.empresaPrestador?.nome || "o prestador de serviço"} através do e-mail {contract.empresaPrestador?.responsavelTecnico || contract.empresaPrestador?.email || "fornecido"}.</p>
      </CardFooter>
    </Card>
  );
}

