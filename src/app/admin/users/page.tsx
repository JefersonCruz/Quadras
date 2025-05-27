
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCog, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Usuario } from "@/types/firestore";
import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    try {
      const usersCollection = collection(db, "usuarios");
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Erro ao buscar usuários", description: "Não foi possível carregar a lista de usuários.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    (u.nome && u.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Visualize e gerencie os usuários da plataforma."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><UserCog className="mr-2 text-primary"/> Lista de Usuários</CardTitle>
           <div className="mt-2 relative">
            <Input
              placeholder="Buscar usuário por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm pl-10" // Add padding for the icon
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
             <div className="text-center py-8">
                <UserCog className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Nenhum usuário encontrado.</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente um termo de busca diferente." : "Não há usuários cadastrados no momento."}
                </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>ID do Usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome || "N/A"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                         <span className={`px-2 py-1 text-xs rounded-full font-medium
                          ${u.role === 'admin' ? 'bg-destructive/80 text-destructive-foreground' :
                            'bg-accent text-accent-foreground'}`}>
                          {u.role || "user"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.id}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" disabled>Editar</Button> {/* Placeholder */}
                        <Button variant="destructive" size="sm" disabled>Excluir</Button> {/* Placeholder */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
