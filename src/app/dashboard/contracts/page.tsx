
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileSignature, Search, Loader2, Share2, Copy, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Contrato, AssinaturaDetalhes } from "@/types/firestore";
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
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea import

// Function to copy text to clipboard
const copyToClipboard = (text: string, toastFn: (options: any) => void) => {
  navigator.clipboard.writeText(text).then(() => {
    toastFn({ title: "Link Copiado!", description: "O link de assinatura foi copiado para a área de transferência." });
  }).catch(err => {
    toastFn({ title: "Erro ao Copiar", description: "Não foi possível copiar o link.", variant: "destructive" });
    console.error('Failed to copy text: ', err);
  });
};

const formatSignatureStatus = (signature?: AssinaturaDetalhes) => {
  if (signature?.dataHora) {
    return `Assinado em ${format(signature.dataHora.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por ${signature.nome || 'N/A'}`;
  }
  return "Pendente";
};


export default function ContractsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractForSharing, setSelectedContractForSharing] = useState<Contrato | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedContractForViewing, setSelectedContractForViewing] = useState<Contrato | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);


  const APP_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9003';

  useEffect(() => {
    console.log('[ContractsPage] Loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('[ContractsPage] Contracts state updated:', contracts);
  }, [contracts]);


  const fetchContracts = useCallback(async () => {
    if (!user) {
      console.log('[ContractsPage] fetchContracts: No user, returning.');
      setLoading(false); // Ensure loading is set to false if no user
      return;
    }
    console.log('[ContractsPage] fetchContracts: Starting for user UID:', user.uid);
    setLoading(true);
    try {
      const q = query(
        collection(db, "contratos"),
        where("createdBy", "==", user.uid),
        orderBy("dataCriacao", "desc")
      );
      console.log('[ContractsPage] fetchContracts: Query constructed.');
      const querySnapshot = await getDocs(q);
      console.log('[ContractsPage] fetchContracts: Query snapshot received, size:', querySnapshot.size);
      
      const contractsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contrato));
      console.log('[ContractsPage] fetchContracts: Mapped contractsData:', JSON.stringify(contractsData, null, 2));
      
      setContracts(contractsData);
    } catch (error: any) {
      console.error("[ContractsPage] fetchContracts: Full error object:", error);
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.error("[ContractsPage] fetchContracts: Firestore index missing. Error message:", error.message);
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
        console.error("[ContractsPage] fetchContracts: Generic error fetching contracts:", error.message);
        toast({ title: "Erro ao buscar contratos", description: "Não foi possível carregar a lista de contratos.", variant: "destructive" });
      }
    } finally {
      console.log('[ContractsPage] fetchContracts: Setting loading to false.');
      setLoading(false);
    }
  }, [user, toast]);

  const extractFirebaseIndexLink = (errorMessage: string): string => {
    const match = errorMessage.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : "https://console.firebase.google.com/";
  };


  useEffect(() => {
    console.log('[ContractsPage] useEffect: Calling fetchContracts.');
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = contracts.filter(contract =>
    contract.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contract.id && contract.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusClasses = (status: Contrato['status']) => {
    switch (status) {
      case 'rascunho':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300';
      case 'pendente_assinaturas':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300';
      case 'parcialmente_assinado':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300';
      case 'assinado':
        return 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300';
      case 'cancelado':
        return 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

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
    let contractToShare = { ...contract }; 
    if (contractToShare.status === 'rascunho' && contractToShare.id) {
      console.log('[ContractsPage] openShareDialog: Contract is rascunho, attempting to update status for contract ID:', contractToShare.id);
      try {
        setLoading(true); 
        const contractRef = doc(db, "contratos", contractToShare.id);
        const newStatus: Contrato['status'] = 'pendente_assinaturas';
        const newSentDate = Timestamp.now();

        await updateDoc(contractRef, {
          status: newStatus,
          dataEnvioAssinaturas: newSentDate,
          dataUltimaModificacao: Timestamp.now(),
        });
        console.log('[ContractsPage] openShareDialog: Firestore status updated for contract ID:', contractToShare.id);

        contractToShare.status = newStatus;
        contractToShare.dataEnvioAssinaturas = newSentDate;
        contractToShare.dataUltimaModificacao = Timestamp.now();

        setContracts(prevContracts =>
          prevContracts.map(c =>
            c.id === contractToShare.id ? contractToShare : c
          )
        );
        toast({ title: "Status Atualizado!", description: "Contrato agora está pendente de assinaturas." });
      } catch (error) {
        console.error("[ContractsPage] openShareDialog: Error updating contract status:", error);
        toast({ title: "Erro ao Atualizar Status", description: "Não foi possível mudar o status para 'Pendente Assinaturas'.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    setSelectedContractForSharing(contractToShare);
    setIsShareDialogOpen(true);
    console.log('[ContractsPage] openShareDialog: Dialog opened for contract:', contractToShare);
  };

  const getSignerLink = (contractId: string, signerType: 'client' | 'witness1' | 'witness2' | 'provider') => {
    return `${APP_BASE_URL}/sign-contract/${contractId}/${signerType}`;
  };

  const openViewDialog = (contract: Contrato) => {
    setSelectedContractForViewing(contract);
    setIsViewDialogOpen(true);
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
            />
             {/* Icon can be added using absolute positioning if needed, or by customizing the Input component */}
          </div>
        </CardHeader>
        <CardContent>
          {loading && contracts.length === 0 ? ( 
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
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusClasses(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </TableCell>
                      <TableCell>{contract.dataCriacao ? format(contract.dataCriacao.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {(contract.status === 'rascunho' || contract.status === 'pendente_assinaturas' || contract.status === 'parcialmente_assinado') && (
                          <Button variant="outline" size="sm" onClick={() => openShareDialog(contract)} disabled={loading}>
                            <Share2 className="mr-1 h-3 w-3" /> Compartilhar
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openViewDialog(contract)}>
                          <Eye className="mr-1 h-3 w-3" /> Ver
                        </Button>
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
                O prestador de serviço ({selectedContractForSharing.empresaPrestador?.responsavelTecnico || selectedContractForSharing.empresaPrestador?.nome || "Você"}) assina pela plataforma ou link dedicado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedContractForSharing.empresaPrestador && (
                <div>
                  <Label htmlFor="providerLink" className="font-semibold">Link para o Prestador ({selectedContractForSharing.empresaPrestador.responsavelTecnico || selectedContractForSharing.empresaPrestador.nome}):</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input id="providerLink" value={getSignerLink(selectedContractForSharing.id!, 'provider')} readOnly />
                    <Button type="button" size="sm" onClick={() => copyToClipboard(getSignerLink(selectedContractForSharing.id!, 'provider'), toast)}>
                      <Copy className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Copiar</span>
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="clientLink" className="font-semibold">Link para o Cliente ({selectedContractForSharing.cliente.nome}):</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input id="clientLink" value={getSignerLink(selectedContractForSharing.id!, 'client')} readOnly />
                  <Button type="button" size="sm" onClick={() => copyToClipboard(getSignerLink(selectedContractForSharing.id!, 'client'), toast)}>
                    <Copy className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Copiar</span>
                  </Button>
                </div>
              </div>

              {selectedContractForSharing.testemunhas && selectedContractForSharing.testemunhas[0] && (
                <div>
                  <Label htmlFor="witness1Link" className="font-semibold">Link para Testemunha 1 ({selectedContractForSharing.testemunhas[0].nome}):</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input id="witness1Link" value={getSignerLink(selectedContractForSharing.id!, 'witness1')} readOnly />
                    <Button type="button" size="sm" onClick={() => copyToClipboard(getSignerLink(selectedContractForSharing.id!, 'witness1'), toast)}>
                      <Copy className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Copiar</span>
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
                      <Copy className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Copiar</span>
                    </Button>
                  </div>
                </div>
              )}
               <p className="text-xs text-muted-foreground pt-2">
                Nota: A página pública para assinatura (`/sign-contract/...`) ainda precisa ser totalmente implementada para coletar as assinaturas.
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

      {selectedContractForViewing && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
              <DialogDescription>
                ID do Contrato: {selectedContractForViewing.id}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] p-4"> {/* ScrollArea applied here */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Informações Gerais</h4>
                  <p className="text-xs"><strong>Tipo:</strong> {selectedContractForViewing.tipo === 'padrão' ? 'Padrão' : 'Emergencial'}</p>
                  <p className="text-xs"><strong>Status:</strong> {getStatusLabel(selectedContractForViewing.status)}</p>
                  <p className="text-xs"><strong>Criado em:</strong> {selectedContractForViewing.dataCriacao ? format(selectedContractForViewing.dataCriacao.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}</p>
                   {selectedContractForViewing.dataEnvioAssinaturas && <p className="text-xs"><strong>Enviado para Assinatura:</strong> {format(selectedContractForViewing.dataEnvioAssinaturas.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
                  {selectedContractForViewing.dataFinalizacaoAssinaturas && <p className="text-xs"><strong>Finalizado em:</strong> {format(selectedContractForViewing.dataFinalizacaoAssinaturas.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
                </div>
                <hr/>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Cliente</h4>
                  <p className="text-xs"><strong>Nome:</strong> {selectedContractForViewing.cliente.nome}</p>
                  <p className="text-xs"><strong>Email:</strong> {selectedContractForViewing.cliente.email}</p>
                  <p className="text-xs"><strong>CPF/CNPJ:</strong> {selectedContractForViewing.cliente.cpfCnpj || "N/A"}</p>
                </div>
                <hr/>
                {selectedContractForViewing.empresaPrestador && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Prestador de Serviço</h4>
                    <p className="text-xs"><strong>Empresa:</strong> {selectedContractForViewing.empresaPrestador.nome || "N/A"}</p>
                    <p className="text-xs"><strong>Responsável:</strong> {selectedContractForViewing.empresaPrestador.responsavelTecnico || "N/A"}</p>
                    <p className="text-xs"><strong>CNPJ:</strong> {selectedContractForViewing.empresaPrestador.cnpj || "N/A"}</p>
                    <p className="text-xs"><strong>Endereço:</strong> {selectedContractForViewing.empresaPrestador.endereco || "N/A"}</p>
                  </div>
                )}
                 <hr/>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Cláusulas Principais</h4>
                  <p className="text-xs whitespace-pre-wrap"><strong>Objeto:</strong> {selectedContractForViewing.blocosEditaveis.objetoDoContrato}</p>
                  <p className="text-xs whitespace-pre-wrap mt-1"><strong>Prazo de Execução:</strong> {selectedContractForViewing.blocosEditaveis.prazoDeExecucao}</p>
                  <p className="text-xs whitespace-pre-wrap mt-1"><strong>Condições de Pagamento:</strong> {selectedContractForViewing.blocosEditaveis.condicoesDePagamento}</p>
                </div>
                <hr/>
                {selectedContractForViewing.testemunhas && selectedContractForViewing.testemunhas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Testemunhas</h4>
                    {selectedContractForViewing.testemunhas.map((testemunha, index) => (
                      <div key={index} className="mb-1">
                        <p className="text-xs"><strong>Testemunha {index + 1}:</strong> {testemunha.nome} (Email: {testemunha.email})</p>
                      </div>
                    ))}
                  </div>
                )}
                <hr/>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Status das Assinaturas</h4>
                  <p className="text-xs"><strong>Prestador:</strong> {formatSignatureStatus(selectedContractForViewing.assinaturas?.prestador)}</p>
                  <p className="text-xs"><strong>Cliente:</strong> {formatSignatureStatus(selectedContractForViewing.assinaturas?.cliente)}</p>
                  <p className="text-xs"><strong>Testemunha 1:</strong> {selectedContractForViewing.testemunhas?.[0] ? formatSignatureStatus(selectedContractForViewing.assinaturas?.testemunha1) : 'N/A'}</p>
                  <p className="text-xs"><strong>Testemunha 2:</strong> {selectedContractForViewing.testemunhas?.[1] ? formatSignatureStatus(selectedContractForViewing.assinaturas?.testemunha2) : 'N/A'}</p>
                </div>

                {selectedContractForViewing.tipo === 'emergencial' && (
                  <>
                  <hr/>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Detalhes Emergenciais</h4>
                    {selectedContractForViewing.taxaDeslocamento !== undefined && <p className="text-xs"><strong>Taxa de Deslocamento:</strong> R$ {selectedContractForViewing.taxaDeslocamento.toFixed(2)}</p>}
                    {selectedContractForViewing.termosEmergencial && <p className="text-xs mt-1 whitespace-pre-wrap"><strong>Termos:</strong> {selectedContractForViewing.termosEmergencial}</p>}
                  </div>
                  </>
                )}

              </div>
            </ScrollArea> {/* ScrollArea applied here */}
            <DialogFooter className="sm:justify-start pt-4">
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

