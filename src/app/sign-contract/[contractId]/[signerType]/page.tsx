
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Contrato, AssinaturaDetalhes } from "@/types/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertTriangle, UserCheck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SignerType = 'client' | 'witness1' | 'witness2' | 'provider'; // 'provider' might sign via dashboard

interface SignerDetails {
  keyInFirestore: 'cliente' | 'testemunha1' | 'testemunha2' | 'prestador';
  name: string | undefined;
  email: string | undefined;
}


export default function SignContractPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const contractId = params.contractId as string;
  const signerTypeParam = params.signerType as SignerType;

  const [contract, setContract] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signerDetails, setSignerDetails] = useState<SignerDetails | null>(null);


  useEffect(() => {
    if (!contractId) {
      setError("ID do contrato não fornecido.");
      setLoading(false);
      return;
    }
    const validSignerTypes: SignerType[] = ['client', 'witness1', 'witness2', 'provider'];
    if (!validSignerTypes.includes(signerTypeParam)) {
        setError("Tipo de assinante inválido na URL.");
        setLoading(false);
        return;
    }

    const fetchContract = async () => {
      setLoading(true);
      setError(null);
      try {
        const contractRef = doc(db, "contratos", contractId);
        const docSnap = await getDoc(contractRef);

        if (docSnap.exists()) {
          const contractData = { id: docSnap.id, ...docSnap.data() } as Contrato;
          setContract(contractData);

          let currentSignerKey: SignerDetails['keyInFirestore'] = 'cliente'; // default, will be updated
          let name, email;

          switch (signerTypeParam) {
            case 'client':
              currentSignerKey = 'cliente';
              name = contractData.cliente.nome;
              email = contractData.cliente.email;
              break;
            case 'witness1':
              currentSignerKey = 'testemunha1';
              name = contractData.testemunhas?.[0]?.nome;
              email = contractData.testemunhas?.[0]?.email;
              break;
            case 'witness2':
              currentSignerKey = 'testemunha2';
              name = contractData.testemunhas?.[1]?.nome;
              email = contractData.testemunhas?.[1]?.email;
              break;
            case 'provider': // Provider usually signs via dashboard, this is a placeholder for direct link signing
              currentSignerKey = 'prestador';
              name = contractData.empresaPrestador?.responsavelTecnico || contractData.empresaPrestador?.nome;
              email = "N/A (Prestador)"; // Email might not be in contract data directly for provider signer name
              break;
            default:
              setError("Tipo de assinante desconhecido.");
              setLoading(false);
              return;
          }
           if (!name) {
             setError(`Detalhes para ${signerTypeParam} não encontrados no contrato.`);
             setLoading(false);
             return;
           }
          setSignerDetails({ keyInFirestore: currentSignerKey, name, email });

        } else {
          setError("Contrato não encontrado ou você não tem permissão para acessá-lo.");
        }
      } catch (err: any) {
        console.error("Erro ao buscar contrato:", err);
        setError(err.message || "Ocorreu um erro ao buscar o contrato. Verifique as permissões do Firestore.");
        toast({
          title: "Erro ao carregar contrato",
          description: "Não foi possível carregar os dados do contrato.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId, signerTypeParam, toast]);

  const getSignerRoleDescription = () => {
    if (!signerDetails) return "Carregando...";
    return `${signerTypeParam.charAt(0).toUpperCase() + signerTypeParam.slice(1)} (${signerDetails.name})`;
  };
  
  const isAlreadySigned = () => {
    if (!contract || !signerDetails || !contract.assinaturas) return false;
    return !!contract.assinaturas[signerDetails.keyInFirestore]?.dataHora;
  };

  const handleSignContract = async () => {
    if (!contract || !contract.id || !signerDetails) {
        toast({ title: "Erro", description: "Dados do contrato ou assinante ausentes.", variant: "destructive"});
        return;
    }
    if (isAlreadySigned()) {
        toast({ title: "Já Assinado", description: "Este contrato já foi assinado por você.", variant: "default"});
        return;
    }

    setIsSigning(true);
    try {
        const contractRef = doc(db, "contratos", contract.id);
        
        const signatureData: AssinaturaDetalhes = {
            nome: signerDetails.name,
            email: signerDetails.email,
            dataHora: Timestamp.now(),
            // Placeholder for IP and UserAgent - these require server-side logic or specific browser APIs
            // For now, we'll omit them or set to placeholder values if absolutely needed by type.
            // ip: "0.0.0.0", 
            // userAgent: navigator.userAgent, 
        };

        const updatePayload: any = {};
        updatePayload[`assinaturas.${signerDetails.keyInFirestore}`] = signatureData;

        // Determine new status
        const updatedSignatures = { ...contract.assinaturas, [signerDetails.keyInFirestore]: signatureData };
        const requiredSigners: Array<keyof typeof contract.assinaturas> = ['cliente', 'prestador']; // Assuming provider signs too
        if (contract.testemunhas && contract.testemunhas.length > 0) requiredSigners.push('testemunha1');
        if (contract.testemunhas && contract.testemunhas.length > 1) requiredSigners.push('testemunha2');
        
        const allSigned = requiredSigners.every(signer => !!updatedSignatures[signer]?.dataHora);

        if (allSigned) {
            updatePayload.status = 'assinado';
            updatePayload.dataFinalizacaoAssinaturas = Timestamp.now();
        } else {
            updatePayload.status = 'parcialmente_assinado';
        }
        
        await updateDoc(contractRef, updatePayload);

        // Update local contract state to reflect signature
        setContract(prev => prev ? ({
            ...prev,
            assinaturas: updatedSignatures,
            status: updatePayload.status,
            dataFinalizacaoAssinaturas: allSigned ? updatePayload.dataFinalizacaoAssinaturas : prev.dataFinalizacaoAssinaturas,
        }) : null);

        toast({ title: "Contrato Assinado!", description: `Obrigado, ${signerDetails.name}. Sua assinatura foi registrada.`});

    } catch (error: any) {
        console.error("Erro ao assinar contrato:", error);
        toast({ title: "Erro ao Assinar", description: error.message || "Não foi possível registrar sua assinatura.", variant: "destructive" });
    } finally {
        setIsSigning(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-screen">
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

  if (!contract || !signerDetails) {
    return (
         <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center text-destructive">
                    <AlertTriangle className="mr-2 h-6 w-6" /> Dados Incompletos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Não foi possível carregar os detalhes do contrato ou do assinante.</p>
            </CardContent>
         </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <FileText className="mr-3 h-7 w-7 text-primary" />
          Assinatura de Contrato Digital
        </CardTitle>
        <CardDescription>
          Contrato para: <span className="font-semibold">{contract.cliente.nome}</span>
          <br />
          Tipo: <span className="font-semibold">{contract.tipo === 'padrão' ? 'Padrão' : 'Emergencial'}</span>
           {contract.id && <span className="block text-xs text-muted-foreground mt-1">ID: {contract.id}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="font-semibold text-lg mb-1">Sua Função:</h3>
            <p className="text-md flex items-center"><UserCheck size={20} className="mr-2 text-accent"/> {getSignerRoleDescription()}</p>
            {signerDetails.email && <p className="text-sm text-muted-foreground ml-7">{signerDetails.email}</p>}
        </div>

        <div className="p-4 border rounded-md max-h-60 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-2">Objeto do Contrato (Resumo):</h3>
          <p className="text-sm whitespace-pre-wrap">
            {contract.blocosEditaveis.objetoDoContrato}
          </p>
           {contract.tipo === 'emergencial' && contract.termosEmergencial && (
            <div className="mt-3 pt-3 border-t">
                <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-500">Termos Emergenciais Específicos:</h4>
                <p className="text-sm whitespace-pre-wrap">{contract.termosEmergencial}</p>
                {contract.taxaDeslocamento && <p className="text-sm font-medium mt-1">Taxa de Deslocamento: R$ {contract.taxaDeslocamento.toFixed(2)}</p>}
            </div>
           )}
          <p className="mt-4 text-xs text-muted-foreground">
            Este é um resumo. O documento completo será disponibilizado após todas as assinaturas.
          </p>
        </div>
        
        {isAlreadySigned() ? (
           <div className="p-4 border rounded-md bg-green-100 dark:bg-green-900/70 text-green-700 dark:text-green-300 flex items-center gap-3">
            <CheckCircle size={24} />
            <div>
                <p className="font-semibold">Este contrato já foi assinado por você.</p>
                <p className="text-xs">Assinado em: {contract.assinaturas[signerDetails.keyInFirestore]?.dataHora ? format(contract.assinaturas[signerDetails.keyInFirestore]!.dataHora!.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível'}</p>
            </div>
          </div>
        ) : (
        <div className="p-6 border-2 border-dashed border-primary/50 rounded-md text-center space-y-4 bg-background">
            <h3 className="font-semibold text-xl text-primary">Confirmar Assinatura Eletrônica</h3>
            <p className="text-sm text-muted-foreground">
                Ao clicar em "Assinar Contrato Digitalmente", você, <span className="font-bold">{signerDetails.name}</span>, declara que leu, compreendeu e concorda com todos os termos e condições do contrato apresentado. Sua assinatura digital terá validade jurídica.
            </p>
          <Button 
            onClick={handleSignContract} 
            disabled={isSigning || contract.status === 'assinado' || contract.status === 'cancelado'}
            size="lg"
            className="w-full max-w-xs mx-auto text-base py-6"
          >
            {isSigning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Assinar Contrato Digitalmente"}
          </Button>
          {contract.status === 'assinado' && <p className="text-sm text-green-600 font-medium">Este contrato já foi totalmente assinado.</p>}
          {contract.status === 'cancelado' && <p className="text-sm text-red-600 font-medium">Este contrato foi cancelado.</p>}
        </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start text-xs text-muted-foreground space-y-1 pt-4">
        <p>Em caso de dúvidas, entre em contato com {contract.empresaPrestador?.nome || "o prestador de serviço"} através do e-mail {contract.empresaPrestador?.email || (contract.empresaPrestador?.responsavelTecnico ? `com ${contract.empresaPrestador.responsavelTecnico}` : "fornecido")}.</p>
      </CardFooter>
    </Card>
  );
}

    