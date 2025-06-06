
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calculator, Search, Loader2, Eye, Edit3, FileText, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Orcamento, Cliente, Projeto, Empresa } from "@/types/firestore";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore"; // Added getDoc
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
import QuoteView from "@/components/dashboard/quotes/QuoteView"; // Import the new QuoteView component

export default function QuotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Orcamento[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [companyData, setCompanyData] = useState<Empresa | null>(null); // State for company data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedQuoteForViewing, setSelectedQuoteForViewing] = useState<Orcamento | null>(null);
  const [selectedClientForViewing, setSelectedClientForViewing] = useState<Cliente | null>(null);
  const [selectedProjectForViewing, setSelectedProjectForViewing] = useState<Projeto | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const extractFirebaseIndexLink = (errorMessage: string): string => {
    const match = errorMessage.match(/(https?:\/\/[^\s]+)/);
    return match ? match[0] : "https://console.firebase.google.com/";
  };

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const clientQuery = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const clientSnapshot = await getDocs(clientQuery);
      const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
      setClients(clientsData);

      const projectQuery = query(collection(db, "projetos"), where("owner", "==", user.uid));
      const projectSnapshot = await getDocs(projectQuery);
      const projectsData = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Projeto));
      setProjects(projectsData);

      const quotesQuery = query(
        collection(db, "orcamentos"),
        where("createdBy", "==", user.uid),
        orderBy("dataCriacao", "desc")
      );
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotesData = quotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orcamento));
      setQuotes(quotesData);

      // Fetch company data
      const companyRef = doc(db, "empresas", user.uid);
      const companySnap = await getDoc(companyRef);
      if (companySnap.exists()) {
        setCompanyData(companySnap.data() as Empresa);
      } else {
        setCompanyData(null);
      }

    } catch (error: any) {
      console.error("Error fetching quotes or related data:", error);
       if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
        const link = extractFirebaseIndexLink(error.message);
        toast({
            title: "Índice do Firestore Necessário",
            description: (
              <div>
                A consulta de orçamentos (ou dados relacionados) requer um índice que não existe.
                <Button variant="link" className="p-0 h-auto ml-1 text-destructive-foreground dark:text-destructive-foreground" onClick={() => window.open(link, '_blank')}>
                  Clique aqui para criar o índice <ExternalLink className="h-3 w-3 ml-1"/>
                </Button>
                <p className="text-xs mt-1">Detalhes do erro: {error.message}</p>
              </div>
            ),
            variant: "destructive",
            duration: 20000, 
          });
        setFetchError("Um índice do Firestore é necessário para listar os orçamentos. Verifique o console para mais detalhes e o link de criação.");
      } else {
        toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar orçamentos, clientes ou projetos.", variant: "destructive" });
        setFetchError(error.message || "Ocorreu um erro desconhecido ao buscar os dados.");
      }
      setQuotes([]); 
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

  const getProjectName = (projectId: string | undefined): string => {
    if (!projectId) return "-"; 
    const project = projects.find(p => p.id === projectId);
    return project?.nome || "Projeto não vinculado";
  };

  const filteredQuotes = quotes.filter(quote => {
    const clientName = getClientName(quote.clienteId).toLowerCase();
    const projectName = getProjectName(quote.projetoId).toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return quote.numeroOrcamento.toLowerCase().includes(searchTermLower) ||
           clientName.includes(searchTermLower) ||
           (quote.projetoId && projectName.includes(searchTermLower)) ||
           (quote.id && quote.id.toLowerCase().includes(searchTermLower));
  });

  const getStatusClasses = (status: Orcamento['status']) => {
    switch (status) {
      case 'rascunho':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300';
      case 'enviado':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300';
      case 'visualizado':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300';
      case 'aprovado':
        return 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300';
      case 'rejeitado':
        return 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300';
      case 'expirado':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300';
      case 'convertido_os':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: Orcamento['status']) => {
    switch (status) {
      case 'rascunho': return 'Rascunho';
      case 'enviado': return 'Enviado';
      case 'visualizado': return 'Visualizado';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'expirado': return 'Expirado';
      case 'convertido_os': return 'Convertido em OS';
      default: return status;
    }
  };

  const openViewDialog = (quote: Orcamento) => {
    setSelectedQuoteForViewing(quote);
    setSelectedClientForViewing(clients.find(c => c.id === quote.clienteId) || null);
    setSelectedProjectForViewing(projects.find(p => p.id === quote.projetoId) || null);
    setIsViewDialogOpen(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando orçamentos...</p>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="flex flex-col justify-center items-center py-20 text-center text-destructive bg-destructive/10 p-6 rounded-md">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold">Erro ao Carregar Orçamentos</h3>
          <p className="text-sm mt-2 mb-4">{fetchError}</p>
          <Button onClick={fetchData} variant="destructive">Tentar Novamente</Button>
        </div>
      );
    }

    if (filteredQuotes.length === 0) {
      return (
        <div className="text-center py-20">
          <Calculator className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            {searchTerm ? "Nenhum orçamento encontrado para sua busca." : "Nenhum orçamento cadastrado."}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? "Tente um termo de busca diferente ou limpe a busca." : "Comece criando seu primeiro orçamento."}
          </p>
          {!searchTerm && (
            <Button asChild size="lg">
              <Link href="/dashboard/quotes/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Orçamento
              </Link>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Projeto</TableHead>
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
                <TableCell>{getProjectName(quote.projetoId)}</TableCell>
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
    );
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
              placeholder="Buscar por Nº, cliente, projeto ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      {selectedQuoteForViewing && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl data-[state=open]:has-[[data-print-content]]:overflow-hidden">
            <DialogHeader className="hidden print:block"> {/* Hidden on screen, shown on print */}
                <DialogTitle>Orçamento Nº: {selectedQuoteForViewing.numeroOrcamento}</DialogTitle>
                <DialogDescription>
                  Cliente: {getClientName(selectedQuoteForViewing.clienteId)}
                  {selectedQuoteForViewing.id && <span className="block text-xs text-muted-foreground">ID: {selectedQuoteForViewing.id}</span>}
                </DialogDescription>
            </DialogHeader>
            {/* The data-print-content attribute is a custom marker for potential print-specific styling */}
            <ScrollArea className="max-h-[80vh] data-[print-content]:max-h-none data-[print-content]:overflow-visible">
              <QuoteView 
                quote={selectedQuoteForViewing} 
                client={selectedClientForViewing}
                project={selectedProjectForViewing}
                company={companyData}
              />
            </ScrollArea>
            <DialogFooter className="sm:justify-start pt-4 print:hidden">
              <Button type="button" variant="outline" onClick={() => window.print()}>
                Imprimir / Salvar PDF
              </Button>
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
