
"use client";

import type { Cliente } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Search, Loader2, UserPlus, Eye } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const clientSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { nome: "", email: "", telefone: "", endereco: "" },
  });

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "clientes"), where("owner", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente));
      setClients(clientsData);
    } catch (error) {
      toast({ title: "Erro ao buscar clientes", description: "Não foi possível carregar a lista de clientes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  useEffect(() => {
    if (editingClient) {
      reset(editingClient);
    } else {
      reset({ nome: "", email: "", telefone: "", endereco: "" });
    }
  }, [editingClient, reset, isFormOpen]);


  const onSubmit = async (data: ClientFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      if (editingClient) {
        const clientRef = doc(db, "clientes", editingClient.id!);
        await updateDoc(clientRef, data);
        toast({ title: "Cliente atualizado!", description: "Os dados do cliente foram atualizados." });
      } else {
        await addDoc(collection(db, "clientes"), { ...data, owner: user.uid });
        toast({ title: "Cliente adicionado!", description: "Novo cliente cadastrado com sucesso." });
      }
      fetchClients();
      setIsFormOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast({ title: "Erro ao salvar cliente", description: "Não foi possível salvar os dados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "clientes", clientId));
      toast({ title: "Cliente excluído", description: "O cliente foi removido com sucesso." });
      fetchClients();
    } catch (error) {
      toast({ title: "Erro ao excluir", description: "Não foi possível remover o cliente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const openEditForm = (client: Cliente) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const openNewForm = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  }

  const filteredClients = clients.filter(client =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Clientes"
        description="Adicione, edite e visualize seus clientes."
        actions={
          <Button onClick={openNewForm}>
            <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        }
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingClient(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Atualize os dados do cliente." : "Preencha os dados para cadastrar um novo cliente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => <Input id="nome" {...field} />}
              />
              {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" {...field} />}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => <Input id="telefone" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Controller
                name="endereco"
                control={control}
                render={({ field }) => <Input id="endereco" {...field} />}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="mt-2">
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && clients.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
             <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Nenhum cliente encontrado.</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente um termo de busca diferente." : "Comece adicionando seu primeiro cliente."}
                </p>
                {!searchTerm && (
                    <Button onClick={openNewForm} className="mt-4">
                        <UserPlus className="mr-2 h-4 w-4" /> Adicionar Cliente
                    </Button>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nome}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>{client.telefone || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditForm(client)}>
                          <Edit className="h-4 w-4" /> <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={loading}>
                              <Trash2 className="h-4 w-4" /> <span className="sr-only">Excluir</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente "{client.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClient(client.id!)} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
