
"use client";

import type { Empresa } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Building, Search, Image as ImageIcon } from "lucide-react";
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
import NextImage from "next/image"; // Renamed to avoid conflict

const companySchema = z.object({
  nome: z.string().min(3, "Nome da empresa é obrigatório."),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos.").max(18, "CNPJ inválido.").optional().or(z.literal('')),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  telefone: z.string().min(10, "Telefone inválido.").optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
  site: z.string().url("URL do site inválida.").optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  logotipoFile: z.custom<FileList>().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false); // For form submission
  const [loadingData, setLoadingData] = useState(true); // For initial data fetch
  const [cnpjLoading, setCnpjLoading] = useState(false); // For CNPJ lookup
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null); // For previewing newly selected logo

  const { control, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      email: user?.email || "",
      telefone: "",
      endereco: "",
      site: "",
      instagram: "",
      facebook: "",
      whatsapp: "",
      logotipoFile: undefined,
    }
  });

  const logotipoFileWatcher = watch("logotipoFile");

  useEffect(() => {
    if (logotipoFileWatcher && logotipoFileWatcher.length > 0) {
      const file = logotipoFileWatcher[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB size limit
        toast({ title: "Arquivo muito grande", description: "O logotipo deve ter no máximo 2MB.", variant: "destructive"});
        setValue("logotipoFile", undefined); 
        setNewLogoPreview(null); 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setNewLogoPreview(null); // Clear preview if file is removed
    }
  }, [logotipoFileWatcher, setValue, toast]);

  const fetchCompanyData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const companyRef = doc(db, "empresas", user.uid);
      const docSnap = await getDoc(companyRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Empresa;
        setCompanyData(data);
        reset({
          nome: data.nome || "",
          cnpj: data.cnpj || "",
          email: data.email || user.email || "",
          telefone: data.telefone || "",
          endereco: data.endereco || "",
          site: data.site || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          whatsapp: data.whatsapp || "",
          logotipoFile: undefined, 
        });
        // No need to set newLogoPreview here, it's for new uploads
      } else {
         setCompanyData(null); // Ensure companyData is null if not found
         reset({ 
          nome: "",
          cnpj: "",
          email: user.email || "",
          telefone: "",
          endereco: "",
          site: "",
          instagram: "",
          facebook: "",
          whatsapp: "",
          logotipoFile: undefined,
        });
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast({ title: "Erro ao buscar dados da empresa", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [user, reset, toast]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleCnpjLookup = async () => {
    const cnpjValue = getValues("cnpj");
    if (!cnpjValue) {
      toast({ title: "CNPJ não informado", description: "Por favor, insira um CNPJ para buscar.", variant: "destructive" });
      return;
    }

    const cleanedCnpj = cnpjValue.replace(/\D/g, '');
    if (cleanedCnpj.length !== 14) {
        toast({ title: "CNPJ inválido", description: "O CNPJ deve conter 14 números.", variant: "destructive" });
        return;
    }

    setCnpjLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "CNPJ não encontrado ou erro na API.");
      }
      const data = await response.json();

      setValue("nome", data.nome_fantasia || data.razao_social || getValues("nome") || "");
      setValue("email", data.email || getValues("email") || "");
      setValue("telefone", data.ddd_telefone_1 || getValues("telefone") || "");
      
      let address = "";
      if (data.logradouro) address += `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro}`;
      if (data.numero) address += `, ${data.numero}`;
      if (data.complemento) address += ` - ${data.complemento}`;
      if (data.bairro) address += `. ${data.bairro}`;
      if (data.municipio) address += `, ${data.municipio}`;
      if (data.uf) address += ` - ${data.uf}`;
      if (data.cep) address += `. CEP: ${data.cep}`;
      setValue("endereco", address.trim() || "");
      
      toast({ title: "Dados do CNPJ carregados!", description: "Verifique e complete as informações." });
    } catch (error: any) {
      toast({ title: "Erro ao buscar CNPJ", description: error.message, variant: "destructive" });
    } finally {
      setCnpjLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    if (!user) return;
    setLoading(true);
    
    let logoUrlToSave = companyData?.logotipo || "";

    if (data.logotipoFile && data.logotipoFile.length > 0) {
      const file = data.logotipoFile[0];
       if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "Logotipo muito grande", description: "O arquivo do logotipo excede 2MB.", variant: "destructive"});
        setLoading(false);
        return;
      }
      const storageRef = ref(storage, `empresas/${user.uid}/logotipo/${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        logoUrlToSave = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Firebase Storage Error:", error); 
        toast({ title: "Erro no upload do logotipo", description: "Não foi possível salvar o logotipo. Verifique o console para detalhes.", variant: "destructive" });
        setLoading(false);
        return;
      }
    }
    
    const { logotipoFile, ...companyDetails } = data; 

    const finalData: Partial<Empresa> = {
      owner: user.uid,
      nome: companyDetails.nome || "",
      cnpj: companyDetails.cnpj || "",
      email: companyDetails.email || "",
      telefone: companyDetails.telefone || "",
      endereco: companyDetails.endereco || "",
      site: companyDetails.site || "",
      instagram: companyDetails.instagram || "",
      facebook: companyDetails.facebook || "",
      whatsapp: companyDetails.whatsapp || "",
      logotipo: logoUrlToSave,
    };
    
    try {
      const companyRef = doc(db, "empresas", user.uid);
      // Check if document exists to decide between setDoc and updateDoc
      const docSnap = await getDoc(companyRef);
      if (docSnap.exists()) {
        await updateDoc(companyRef, finalData);
      } else {
        await setDoc(companyRef, finalData); // Use setDoc for new documents
      }

      setCompanyData(prev => ({...(prev || {}), ...finalData, id: user.uid } as Empresa)); // Update local state
      setNewLogoPreview(null); // Clear new logo preview after successful save
      setValue("logotipoFile", undefined); // Clear the file input in the form
      toast({ title: "Perfil da empresa salvo!", description: "Suas informações foram atualizadas." });
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast({ title: "Erro ao salvar perfil", description: "Não foi possível salvar os dados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Perfil da Empresa"
          description="Gerencie as informações da sua empresa que aparecerão em documentos e relatórios."
        />
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
            <p className="ml-2">Carregando perfil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil da Empresa"
        description="Gerencie as informações da sua empresa que aparecerão em documentos e relatórios."
      />
      <Card>
        <div className="p-6 border-b flex flex-col items-center gap-4">
          {companyData?.logotipo ? (
            <NextImage 
              src={companyData.logotipo} 
              alt="Logotipo da Empresa" 
              width={128} 
              height={128} 
              className="rounded-full object-contain border-2 border-primary p-1"
              data-ai-hint="logo company"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <h2 className="text-2xl font-semibold text-foreground">{companyData?.nome || "Nome da Empresa"}</h2>
        </div>

        <CardHeader>
          <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5 text-primary" /> Detalhes da Empresa</CardTitle>
          <CardDescription>Mantenha seus dados atualizados. Use o CNPJ para preencher automaticamente alguns campos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nome">Nome da Empresa / Nome Fantasia</Label>
                <Controller name="nome" control={control} render={({ field }) => <Input id="nome" {...field} />} />
                {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="flex gap-2 items-start">
                    <Controller name="cnpj" control={control} render={({ field }) => <Input id="cnpj" {...field} placeholder="00.000.000/0000-00" className="flex-grow"/>} />
                    <Button type="button" onClick={handleCnpjLookup} disabled={cnpjLoading} variant="outline" className="shrink-0">
                        {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Buscar</span>
                    </Button>
                </div>
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
                <Controller name="endereco" control={control} render={({ field }) => <Input id="endereco" {...field} placeholder="Rua, Número, Bairro, Cidade - UF, CEP" />} />
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
                <Controller name="instagram" control={control} render={({ field }) => <Input id="instagram" {...field} placeholder="@seuinstagram ou https://instagram.com/..." />} />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Controller name="facebook" control={control} render={({ field }) => <Input id="facebook" {...field} placeholder="/suaempresa ou https://facebook.com/..." />} />
              </div>
            </div>
            
            <div>
              <Label htmlFor="logotipoFile">Alterar/Adicionar Logotipo</Label>
              <Controller 
                name="logotipoFile" 
                control={control} 
                render={({ field: { onChange, value, ...restField } }) => (
                  <Input 
                    id="logotipoFile" 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp, image/gif" 
                    onChange={(e) => onChange(e.target.files)} 
                    {...restField} 
                    className="mt-1"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">Recomendamos um logotipo quadrado (1:1). Tamanho máximo: 2MB.</p>
              {newLogoPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Pré-visualização do novo logotipo:</p>
                  <div className="w-36 h-36 rounded border bg-muted/50 flex items-center justify-center overflow-hidden">
                    <NextImage src={newLogoPreview} alt="Preview do novo logotipo" width={144} height={144} className="object-contain max-w-full max-h-full" data-ai-hint="logo company" />
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading || cnpjLoading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
    
