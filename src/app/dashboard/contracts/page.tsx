
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileSignature, Search, Loader2, Share2, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Contrato } from "@/types/firestore";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Function to copy text to clipboard
const copyToClipboard = (text: string, toastFn: (options: any) => void) => {
  navigator.clipboard.writeText(text).then(() => {
    toastFn({ title: "Link Copiado!", description: "O link de assinatura foi copiado para a área de transferência." });
  }).catch(err => {
    toastFn({ title: "Erro ao Copiar", description: "Não foi possível copiar o link.", variant: "destructive" });
    console.error('Failed to copy text: ', err);
  });
};


export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractForSharing, setSelectedContractForSharing] = useState<Contrato | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const APP_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9003';


  const fetchContracts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "contratos"),
        where("createdBy", "==", user.uid),
        orderBy("dataCriacao", "desc")
      );
      const querySnapshot = await getDocs(q);
      const contractsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contrato));
      setContracts(contractsData);
    } catch (error: any) {
      console.error("Erro ao buscar contratos:", error);
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
          toast({
            title: "Índice do Firestore Necessário",
            description: (
              <div>
                A consulta de contratos requer um índice que não existe. Por favor, crie-o no Firebase Console.
                <Button variant="link" className="p-0 h-auto ml-1" onClick={() => window.open(extractFirebaseIndexLink(error.message), '_blank')}>
                  Criar Índice <ExternalLink className="h-3 w-3 ml-1"/>
                </Button>
                <p className="text-xs mt-1">Detalhes: {error.message}</p>
              </div>
            ),
            variant: "destructive",
            duration: 20000, 
          });
      } else {
        toast({ title: "Erro ao buscar contratos", description: "Não foi possível carregar a lista de contratos.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const extractFirebaseIndexLink = (errorMessage: string): string => {
    const match = errorMessage.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : "https://console.firebase.google.com/";
  };


  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = contracts.filter(contract =>
    contract.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contract.id && contract.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusLabel = (status: Contrato['status']) => {
    switch (status) {
      case 'rascunho': return 'Rascunho';
      case 'pendente_assinaturas': return 'Pendente Assinaturas';
      case 'parcialmente_assinado': return 'Parcialmente Assinado';
      case 'assinado': return 'Assinado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };
  
  const openShareDialog = async (contract: Contrato) => {
    let contractToShare = contract;
    if (contract.status === 'rascunho' && contract.id) {
      try {
        const contractRef = doc(db, "contratos", contract.id);
        const newStatus = 'pendente_assinaturas';
        const newSentDate = Timestamp.now();
        await updateDoc(contractRef, {
          status: newStatus,
          dataEnvioAssinaturas: newSentDate
        });
        
        contractToShare = { ...contract, status: newStatus, dataEnvioAssinaturas: newSentDate };
        
        setContracts(prevContracts =>
          prevContracts.map(c =>
            c.id === contract.id ? contractToShare : c
          )
        );
        toast({ title: "Status Atualizado!", description: "Contrato agora está pendente de assinaturas." });
      } catch (error) {
        console.error("Erro ao atualizar status do contrato:", error);
        toast({ title: "Erro ao Atualizar Status", description: "Não foi possível mudar o status para 'Pendente Assinaturas'.", variant: "destructive" });
        // Decide if you want to proceed with sharing if status update fails. For now, we will.
      }
    }
    setSelectedContractForSharing(contractToShare);
    setIsShareDialogOpen(true);
  };

  const getSignerLink = (contractId: string, signerType: 'client' | 'witness1' | 'witness2') => {
    // In a real app, the prestador (provider) might sign via the platform itself, not a public link.
    // For now, we generate links for client and witnesses.
    return `${APP_BASE_URL}/sign-contract/${contractId}/${signerType}`;
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Contratos Digitais"
        description="Crie, visualize e gerencie seus contratos de prestação de serviço."
        actions={
          <Button asChild>
            <Link href="/dashboard/contracts/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Contrato
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
          <div className="mt-2">
            <Input
              placeholder="Buscar contrato por cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando contratos...</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum contrato encontrado.</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente um termo de busca diferente." : "Comece criando seu primeiro contrato digital."}
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/contracts/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Contrato
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.cliente.nome}</TableCell>
                      <TableCell>{contract.tipo === 'padrão' ? 'Padrão' : 'Emergencial'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium
                          ${contract.status === 'assinado' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                            contract.status === 'pendente_assinaturas' || contract.status === 'parcialmente_assinado' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            contract.status === 'rascunho' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </TableCell>
                      <TableCell>{contract.dataCriacao ? format(contract.dataCriacao.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {(contract.status === 'rascunho' || contract.status === 'pendente_assinaturas' || contract.status === 'parcialmente_assinado') && (
                          <Button variant="outline" size="sm" onClick={() => openShareDialog(contract)}>
                            <Share2 className="mr-1 h-3 w-3" /> Compartilhar
                          </Button>
                        )}
                        <Button variant="outline" size="sm" disabled>Ver</Button>
                        <Button variant="outline" size="sm" disabled={contract.status !== 'rascunho'}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedContractForSharing && (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Compartilhar Contrato para Assinatura</DialogTitle>
              <DialogDescription>
                Copie e envie os links abaixo para as respectivas partes assinarem o contrato <span className="font-medium">"{selectedContractForSharing.id}"</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="clientLink" className="font-semibold">Link para o Cliente ({selectedContractForSharing.cliente.nome}):</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input id="clientLink" value={getSignerLink(selectedContractForSharing.id!, 'client')} readOnly />
                  <Button type="button" size="sm" onClick={() => copyToClipboard(getSignerLink(selectedContractForSharing.id!, 'client'), toast)}>
                    <Copy className="h-4 w-4" /> <span className="ml-2">Copiar</span>
                  </Button>
                </div>
              </div>

              {selectedContractForSharing.testemunhas && selectedContractForSharing.testemunhas[0] && (
                <div>
                  <Label htmlFor="witness1Link" className="font-semibold">Link para Testemunha 1 ({selectedContractForSharing.testemunhas[0].nome}):</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input id="witness1Link" value={getSignerLink(selectedContractForSharing.id!, 'witness1')} readOnly />
                    <Button type="button" size="sm" onClick={() => copyToClipboard(getSignerLink(selectedContractForSharing.id!, 'witness1'), toast)}>
                      <Copy className="h-4 w-4" /> <span className="ml-2">Copiar</span>
                    </Button>
                  </div>
                </div>
              )}

              {selectedContractForSharing.testemunhas && selectedContractForSharing.testemunhas[1] && (
                <div>
                  <Label htmlFor="witness2Link" className="font-semibold">Link para Testemunha 2 ({selectedContractForSharing.testemunhas[1].nome}):</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input id="witness2Link" value={getSignerLink(selectedContractForSharing.id!, 'witness2')} readOnly />
                    <Button type="button" size="sm" onClick={() => copyToClipboard(getSignerLink(selectedContractForSharing.id!, 'witness2'), toast)}>
                      <Copy className="h-4 w-4" /> <span className="ml-2">Copiar</span>
                    </Button>
                  </div>
                </div>
              )}
               <p className="text-xs text-muted-foreground pt-2">
                Nota: A página pública para assinatura ainda está em desenvolvimento. Estes links são para fins de demonstração da estrutura. O prestador assina pela plataforma.
              </p>
            </div>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
