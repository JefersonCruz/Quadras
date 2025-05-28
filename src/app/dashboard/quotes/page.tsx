
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calculator, Search, Loader2, Eye, Edit3, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Orcamento, Cliente } from "@/types/firestore";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function QuotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Orcamento[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedQuoteForViewing, setSelectedQuoteForViewing] = useState<Orcamento | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const clientQuery = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const clientSnapshot = await getDocs(clientQuery);
      const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
      setClients(clientsData);

      const quotesQuery = query(
        collection(db, "orcamentos"),
        where("createdBy", "==", user.uid),
        orderBy("dataCriacao", "desc")
      );
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotesData = quotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orcamento));
      setQuotes(quotesData);

    } catch (error: any) {
      console.error("Error fetching quotes or clients:", error);
       if (error.code === 'failed-precondition' && error.message.includes('index')) {
        toast({
            title: "Índice do Firestore Necessário",
            description: "A consulta de orçamentos requer um índice. Por favor, crie-o no Firebase Console.",
            variant: "destructive",
            duration: 10000,
          });
      } else {
        toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar orçamentos ou clientes.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getClientName = (clientId: string | undefined): string => {
    if (!clientId) return "N/A";
    const client = clients.find(c => c.id === clientId);
    return client?.nome || "Cliente não encontrado";
  };

  const filteredQuotes = quotes.filter(quote => {
    const clientName = getClientName(quote.clienteId).toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return quote.numeroOrcamento.toLowerCase().includes(searchTermLower) ||
           clientName.includes(searchTermLower) ||
           (quote.id && quote.id.toLowerCase().includes(searchTermLower));
  });

  const getStatusClasses = (status: Orcamento['status']) => {
    switch (status) {
      case 'rascunho':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300';
      case 'enviado':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300';
      case 'aprovado':
        return 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300';
      case 'rejeitado':
      case 'convertido_os':
        return 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: Orcamento['status']) => {
    switch (status) {
      case 'rascunho': return 'Rascunho';
      case 'enviado': return 'Enviado';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'convertido_os': return 'Convertido em OS';
      default: return status;
    }
  };

  const openViewDialog = (quote: Orcamento) => {
    setSelectedQuoteForViewing(quote);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Orçamentos"
        description="Crie, visualize e gerencie seus orçamentos de serviços."
        actions={
          <Button asChild>
            <Link href="/dashboard/quotes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos</CardTitle>
          <div className="mt-2">
            <Input
              placeholder="Buscar por Nº, cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando orçamentos...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum orçamento encontrado.</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente um termo de busca diferente." : "Comece criando seu primeiro orçamento."}
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/quotes/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Orçamento
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.numeroOrcamento}</TableCell>
                      <TableCell>{getClientName(quote.clienteId)}</TableCell>
                      <TableCell>{quote.dataCriacao ? format(quote.dataCriacao.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell>{quote.dataValidade ? format(quote.dataValidade.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell>R$ {quote.valorTotalEstimado.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusClasses(quote.status)}`}>
                          {getStatusLabel(quote.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openViewDialog(quote)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver Detalhes</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Ver Detalhes</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                              <Edit3 className="h-4 w-4" />
                              <span className="sr-only">Editar Orçamento</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar Orçamento (em breve)</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Baixar PDF</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Baixar PDF (em breve)</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedQuoteForViewing && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Orçamento</DialogTitle>
              <DialogDescription>
                Orçamento Nº: {selectedQuoteForViewing.numeroOrcamento}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
              <div className="space-y-3 text-sm py-4">
                <p><strong>Cliente:</strong> {getClientName(selectedQuoteForViewing.clienteId)}</p>
                {selectedQuoteForViewing.projetoId && <p><strong>Projeto Vinculado:</strong> {projects.find(p => p.id === selectedQuoteForViewing.projetoId)?.nome || 'N/A'}</p>}
                <p><strong>Data de Criação:</strong> {selectedQuoteForViewing.dataCriacao ? format(selectedQuoteForViewing.dataCriacao.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</p>
                <p><strong>Data de Validade:</strong> {selectedQuoteForViewing.dataValidade ? format(selectedQuoteForViewing.dataValidade.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
                <p><strong>Valor Total Estimado:</strong> R$ {selectedQuoteForViewing.valorTotalEstimado.toFixed(2)}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusClasses(selectedQuoteForViewing.status)}`}>{getStatusLabel(selectedQuoteForViewing.status)}</span></p>
                
                <div className="pt-2">
                  <h4 className="font-semibold mb-1">Descrição dos Serviços/Escopo:</h4>
                  <p className="whitespace-pre-wrap bg-muted/50 p-2 rounded-md">{selectedQuoteForViewing.descricaoServicos || "Nenhuma descrição fornecida."}</p>
                </div>

                {selectedQuoteForViewing.observacoes && (
                  <div className="pt-2">
                    <h4 className="font-semibold mb-1">Observações:</h4>
                    <p className="whitespace-pre-wrap bg-muted/50 p-2 rounded-md">{selectedQuoteForViewing.observacoes}</p>
                  </div>
                )}

                {(selectedQuoteForViewing.empresaNome || selectedQuoteForViewing.empresaCnpj) && (
                    <div className="pt-3 mt-3 border-t">
                        <h4 className="font-semibold mb-1">Emitido por:</h4>
                        <p>{selectedQuoteForViewing.empresaNome || "Empresa não informada"}</p>
                        {selectedQuoteForViewing.empresaCnpj && <p className="text-xs text-muted-foreground">CNPJ: {selectedQuoteForViewing.empresaCnpj}</p>}
                        {selectedQuoteForViewing.empresaTelefone && <p className="text-xs text-muted-foreground">Telefone: {selectedQuoteForViewing.empresaTelefone}</p>}
                        {selectedQuoteForViewing.empresaEmail && <p className="text-xs text-muted-foreground">Email: {selectedQuoteForViewing.empresaEmail}</p>}
                    </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="outline">
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
