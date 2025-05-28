
"use client";

import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCog, Search, Edit } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import type { Usuario } from "@/types/firestore";
import { collection, getDocs, query, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const roleUpdateSchema = z.object({
  role: z.enum(["user", "admin"], { required_error: "Selecione um papel." }),
});

type RoleUpdateFormData = z.infer<typeof roleUpdateSchema>;

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRoleDialogFormOpen, setIsRoleDialogFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<RoleUpdateFormData>({
    resolver: zodResolver(roleUpdateSchema),
  });

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

  const openEditRoleDialog = (userToEdit: Usuario) => {
    setEditingUser(userToEdit);
    setValue("role", userToEdit.role || "user"); // Set current role in form
    setIsRoleDialogFormOpen(true);
  };

  const onRoleUpdateSubmit = async (data: RoleUpdateFormData) => {
    if (!editingUser || !editingUser.id || !isAdmin) {
      toast({ title: "Erro", description: "Usuário não selecionado ou permissão negada.", variant: "destructive" });
      return;
    }
    setFormSubmitting(true);
    try {
      const userRef = doc(db, "usuarios", editingUser.id);
      await updateDoc(userRef, {
        role: data.role,
      });
      toast({ title: "Papel Atualizado!", description: `O papel de ${editingUser.nome || editingUser.email} foi alterado para ${data.role}.` });
      setIsRoleDialogFormOpen(false);
      setEditingUser(null);
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({ title: "Erro ao Atualizar Papel", description: "Não foi possível alterar o papel do usuário.", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

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
              className="max-w-sm pl-10"
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
                    <TableHead>Papel</TableHead>
                    <TableHead>Plano</TableHead>
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
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium
                          ${u.tipoPlano === 'premium' ? 'bg-primary/80 text-primary-foreground' :
                            'bg-muted text-muted-foreground'}`}>
                          {u.tipoPlano || "gratuito"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.id}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditRoleDialog(u)} disabled={u.id === user?.uid}>
                          <Edit className="h-3 w-3 mr-1" /> Editar Papel
                        </Button>
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

      {editingUser && (
        <Dialog open={isRoleDialogFormOpen} onOpenChange={(open) => { setIsRoleDialogFormOpen(open); if(!open) setEditingUser(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Papel do Usuário</DialogTitle>
              <DialogDescription>
                Alterar o papel de <span className="font-semibold">{editingUser.nome || editingUser.email}</span>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onRoleUpdateSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="role">Papel</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário (user)</SelectItem>
                        <SelectItem value="admin">Administrador (admin)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => { setIsRoleDialogFormOpen(false); setEditingUser(null); }}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

    