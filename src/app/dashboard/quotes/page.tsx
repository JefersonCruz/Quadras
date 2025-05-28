
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calculator, Search, Loader2 } from "lucide-react";
import Link from "next/link";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/lib/firebase/config";
// import type { Orcamento } from "@/types/firestore";
// import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
// import { useEffect, useState, useCallback } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

export default function QuotesPage() {
  // const { user } = useAuth();
  // const { toast } = useToast();
  // const [quotes, setQuotes] = useState<Orcamento[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [searchTerm, setSearchTerm] = useState("");

  // const fetchQuotes = useCallback(async () => {
  //   if (!user) {
  //     setLoading(false);
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     const q = query(
  //       collection(db, "orcamentos"),
  //       where("createdBy", "==", user.uid),
  //       orderBy("dataCriacao", "desc")
  //     );
  //     const querySnapshot = await getDocs(q);
  //     const quotesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orcamento));
  //     setQuotes(quotesData);
  //   } catch (error) {
  //     console.error("Error fetching quotes:", error);
  //     toast({ title: "Erro ao buscar orçamentos", description: "Não foi possível carregar a lista de orçamentos.", variant: "destructive" });
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [user, toast]);

  // useEffect(() => {
  //   fetchQuotes();
  // }, [fetchQuotes]);

  // const filteredQuotes = quotes.filter(quote =>
  //   quote.numeroOrcamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   (quote.clienteId && quote.clienteId.toLowerCase().includes(searchTerm.toLowerCase())) // Needs client name lookup
  // );

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
          {/* <div className="mt-2">
            <Input
              placeholder="Buscar orçamento por número ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div> */}
        </CardHeader>
        <CardContent>
          {/* {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando orçamentos...</p>
            </div>
          ) : filteredQuotes.length === 0 ? ( */}
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum orçamento encontrado.</h3>
              <p className="text-muted-foreground">
                {/* {searchTerm ? "Tente um termo de busca diferente." : "Comece criando seu primeiro orçamento."} */}
                Listagem de orçamentos e funcionalidades de busca em breve.
              </p>
              {/* {!searchTerm && ( */}
                <Button asChild className="mt-4">
                  <Link href="/dashboard/quotes/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Orçamento
                  </Link>
                </Button>
              {/* )} */}
            </div>
          {/* ) : (
            <div className="overflow-x-auto">
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
                      <TableCell> {quote.clienteId} Placeholder </TableCell>
                      <TableCell>{quote.dataCriacao ? format(quote.dataCriacao.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell>{quote.dataValidade ? format(quote.dataValidade.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell>R$ {quote.valorTotalEstimado.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium`}>
                          {quote.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm">Ver</Button>
                        <Button variant="outline" size="sm">Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}
