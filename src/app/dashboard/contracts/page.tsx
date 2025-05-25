
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileSignature, Search, Loader2 } from "lucide-react";
import Link from "next/link";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/lib/firebase/config";
// import type { Contrato } from "@/types/firestore";
// import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
// import { useEffect, useState, useCallback } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { Input } from "@/components/ui/input";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

export default function ContractsPage() {
  // const { user } = useAuth();
  // const { toast } = useToast();
  // const [contracts, setContracts] = useState<Contrato[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [searchTerm, setSearchTerm] = useState("");

  // const fetchContracts = useCallback(async () => {
  //   if (!user) return;
  //   setLoading(true);
  //   try {
  //     const q = query(
  //       collection(db, "contratos"),
  //       where("createdBy", "==", user.uid),
  //       orderBy("dataCriacao", "desc")
  //     );
  //     const querySnapshot = await getDocs(q);
  //     const contractsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contrato));
  //     setContracts(contractsData);
  //   } catch (error) {
  //     console.error("Erro ao buscar contratos:", error);
  //     toast({ title: "Erro ao buscar contratos", description: "Não foi possível carregar a lista de contratos.", variant: "destructive" });
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [user, toast]);

  // useEffect(() => {
  //   fetchContracts();
  // }, [fetchContracts]);

  // const filteredContracts = contracts.filter(contract =>
  //   contract.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   (contract.id && contract.id.toLowerCase().includes(searchTerm.toLowerCase()))
  // );

  // const getStatusLabel = (status: Contrato['status']) => {
  //   // Add styling later
  //   return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  // };

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
          {/* 
          <div className="mt-2">
            <Input
              placeholder="Buscar contrato por cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          */}
        </CardHeader>
        <CardContent>
          {/* {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando contratos...</p>
            </div>
          ) : filteredContracts.length === 0 ? ( */}
            <div className="text-center py-8">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Nenhum contrato encontrado.</h3>
              <p className="text-muted-foreground">
                {/* {searchTerm ? "Tente um termo de busca diferente." : "Comece criando seu primeiro contrato digital."} */}
                Comece criando seu primeiro contrato digital. (Funcionalidade de listagem em breve)
              </p>
              {/* {!searchTerm && ( */}
                <Button asChild className="mt-4">
                  <Link href="/dashboard/contracts/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Contrato
                  </Link>
                </Button>
              {/* )} */}
            </div>
          {/* ) : (
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
                      <TableCell>{getStatusLabel(contract.status)}</TableCell>
                      <TableCell>{contract.dataCriacao ? format(contract.dataCriacao.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" disabled>Ver</Button>
                        <Button variant="outline" size="sm" disabled>Editar</Button>
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
