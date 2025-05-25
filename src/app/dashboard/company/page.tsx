
"use client";

import type { Empresa } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const companySchema = z.object({
  nome: z.string().min(3, "Nome da empresa é obrigatório."),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos.").max(18, "CNPJ inválido.").optional().or(z.literal('')), // Allow optional or empty
  email: z.string().email("Email inválido."),
  telefone: z.string().min(10, "Telefone inválido.").optional().or(z.literal('')),
  endereco: z.string().optional(),
  site: z.string().url("URL do site inválida.").optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  logotipoFile: z.custom<FileList>().optional(), // For file upload
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const logotipoFile = watch("logotipoFile");

  useEffect(() => {
    if (logotipoFile && logotipoFile.length > 0) {
      const file = logotipoFile[0];
      setLogoPreview(URL.createObjectURL(file));
    }
  }, [logotipoFile]);

  const fetchCompanyData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const companyRef = doc(db, "empresas", user.uid);
      const docSnap = await getDoc(companyRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Empresa;
        setCompanyData(data);
        reset(data); // Populate form with existing data
        if (data.logotipo) setLogoPreview(data.logotipo);
      } else {
        // Set default email from user auth if no company data exists
        setValue("email", user.email || "");
      }
    } catch (error) {
      toast({ title: "Erro ao buscar dados da empresa", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [user, reset, toast, setValue]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const onSubmit = async (data: CompanyFormData) => {
    if (!user) return;
    setLoading(true);
    
    let logoUrl = companyData?.logotipo || "";

    if (data.logotipoFile && data.logotipoFile.length > 0) {
      const file = data.logotipoFile[0];
      const storageRef = ref(storage, `empresas/${user.uid}/logotipo/${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        logoUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        toast({ title: "Erro no upload do logotipo", description: "Não foi possível salvar o logotipo.", variant: "destructive" });
        setLoading(false);
        return;
      }
    }
    
    const { logotipoFile, ...companyDetails } = data; // Exclude file from Firestore data

    const finalData: Partial<Empresa> = {
      ...companyDetails,
      logotipo: logoUrl,
      owner: user.uid,
    };
    
    try {
      const companyRef = doc(db, "empresas", user.uid);
      if (companyData) { // If data exists, update it
        await updateDoc(companyRef, finalData);
      } else { // Otherwise, create new document
        await setDoc(companyRef, finalData);
      }
      setCompanyData(finalData as Empresa); // Update local state
      toast({ title: "Perfil da empresa salvo!", description: "Suas informações foram atualizadas." });
    } catch (error) {
      toast({ title: "Erro ao salvar perfil", description: "Não foi possível salvar os dados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Carregando perfil...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil da Empresa"
        description="Gerencie as informações da sua empresa que aparecerão em documentos e relatórios."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6 text-primary" /> Informações da Empresa</CardTitle>
          <CardDescription>Mantenha seus dados atualizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nome">Nome da Empresa / Nome Fantasia</Label>
                <Controller name="nome" control={control} render={({ field }) => <Input id="nome" {...field} />} />
                {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Controller name="cnpj" control={control} render={({ field }) => <Input id="cnpj" {...field} placeholder="00.000.000/0000-00" />} />
                 {errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email de Contato</Label>
                <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" {...field} />} />
                 {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Controller name="telefone" control={control} render={({ field }) => <Input id="telefone" {...field} placeholder="(00) 00000-0000" />} />
                 {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>}
              </div>
            </div>
            <div>
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Controller name="endereco" control={control} render={({ field }) => <Input id="endereco" {...field} placeholder="Rua, Número, Bairro, Cidade - UF" />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="site">Site</Label>
                <Controller name="site" control={control} render={({ field }) => <Input id="site" {...field} placeholder="https://suaempresa.com" />} />
                {errors.site && <p className="text-sm text-destructive mt-1">{errors.site.message}</p>}
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Controller name="whatsapp" control={control} render={({ field }) => <Input id="whatsapp" {...field} placeholder="(00) 00000-0000" />} />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Controller name="instagram" control={control} render={({ field }) => <Input id="instagram" {...field} placeholder="@seuinstagram" />} />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Controller name="facebook" control={control} render={({ field }) => <Input id="facebook" {...field} placeholder="/suaempresa" />} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="logotipoFile">Logotipo</Label>
              <Controller 
                name="logotipoFile" 
                control={control} 
                render={({ field: { onChange, value, ...restField } }) => (
                  <Input 
                    id="logotipoFile" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => onChange(e.target.files)} 
                    {...restField} 
                  />
                )}
              />
              {logoPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Pré-visualização:</p>
                  <Image src={logoPreview} alt="Preview do logotipo" width={150} height={150} className="rounded border" data-ai-hint="logo company" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
