
"use client";

import type { Empresa } from "@/types/firestore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Building, Search, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import NextImage from "next/image";

const companySchema = z.object({
  nome: z.string().min(3, "Nome da empresa é obrigatório.").default(""),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos.").max(18, "CNPJ inválido.").optional().or(z.literal('')).default(""),
  email: z.string().email("Email inválido.").optional().or(z.literal('')).default(""),
  telefone: z.string().min(10, "Telefone inválido.").optional().or(z.literal('')).default(""),
  endereco: z.string().optional().or(z.literal('')).default(""),
  site: z.string().url("URL do site inválida.").optional().or(z.literal('')).default(""),
  instagram: z.string().optional().or(z.literal('')).default(""),
  facebook: z.string().optional().or(z.literal('')).default(""),
  whatsapp: z.string().optional().or(z.literal('')).default(""),
  logotipoFile: z.custom<FileList>().optional(),
  bannerFile: z.custom<FileList>().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const [newBannerPreview, setNewBannerPreview] = useState<string | null>(null);


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
      bannerFile: undefined,
    }
  });

  const logotipoFileWatcher = watch("logotipoFile");
  const bannerFileWatcher = watch("bannerFile");

  useEffect(() => {
    if (logotipoFileWatcher && logotipoFileWatcher.length > 0) {
      const file = logotipoFileWatcher[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Logotipo muito grande", description: "O arquivo do logotipo deve ter no máximo 2MB.", variant: "destructive"});
        setValue("logotipoFile", undefined);
        setNewLogoPreview(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setNewLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setNewLogoPreview(null);
    }
  }, [logotipoFileWatcher, setValue, toast]);

  useEffect(() => {
    if (bannerFileWatcher && bannerFileWatcher.length > 0) {
      const file = bannerFileWatcher[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for banner
        toast({ title: "Banner muito grande", description: "O arquivo do banner deve ter no máximo 5MB.", variant: "destructive"});
        setValue("bannerFile", undefined);
        setNewBannerPreview(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setNewBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setNewBannerPreview(null);
    }
  }, [bannerFileWatcher, setValue, toast]);

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
          bannerFile: undefined,
        });
      } else {
         setCompanyData(null);
         reset({
          nome: "", cnpj: "", email: user.email || "", telefone: "", endereco: "", site: "", instagram: "", facebook: "", whatsapp: "",
          logotipoFile: undefined, bannerFile: undefined,
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
    let bannerUrlToSave = companyData?.bannerUrl || "";

    try {
      // Handle logo upload
      if (data.logotipoFile && data.logotipoFile.length > 0) {
        const file = data.logotipoFile[0];
        if (file.size > 2 * 1024 * 1024) {
          toast({ title: "Logotipo muito grande", description: "O arquivo do logotipo excede 2MB.", variant: "destructive"});
          setLoading(false); return;
        }
        const storageRef = ref(storage, `empresas/${user.uid}/logotipo/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        logoUrlToSave = await getDownloadURL(snapshot.ref);
        if (companyData?.logotipo && companyData.logotipo !== logoUrlToSave) { // Delete old logo if new one is uploaded
            try { await deleteObject(ref(storage, companyData.logotipo)); } catch (e) { console.warn("Could not delete old logo", e); }
        }
      }

      // Handle banner upload
      if (data.bannerFile && data.bannerFile.length > 0) {
        const file = data.bannerFile[0];
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Banner muito grande", description: "O arquivo do banner excede 5MB.", variant: "destructive"});
          setLoading(false); return;
        }
        const storageRef = ref(storage, `empresas/${user.uid}/banner/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        bannerUrlToSave = await getDownloadURL(snapshot.ref);
         if (companyData?.bannerUrl && companyData.bannerUrl !== bannerUrlToSave) { // Delete old banner if new one is uploaded
            try { await deleteObject(ref(storage, companyData.bannerUrl)); } catch (e) { console.warn("Could not delete old banner", e); }
        }
      }

      const { logotipoFile, bannerFile, ...companyDetails } = data;
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
        bannerUrl: bannerUrlToSave,
      };

      const companyRef = doc(db, "empresas", user.uid);
      const docSnap = await getDoc(companyRef);
      if (docSnap.exists()) {
        await updateDoc(companyRef, finalData);
      } else {
        await setDoc(companyRef, finalData);
      }

      setCompanyData(prev => ({...(prev || {}), ...finalData, id: user.uid } as Empresa));
      setNewLogoPreview(null); setValue("logotipoFile", undefined);
      setNewBannerPreview(null); setValue("bannerFile", undefined);
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
          description="Gerencie as informações da sua empresa."
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
        description="Gerencie as informações e a identidade visual da sua empresa."
      />
      <Card>
        <div className="relative h-48 md:h-64 bg-muted/50 w-full group">
          {companyData?.bannerUrl ? (
            <NextImage
              src={companyData.bannerUrl}
              alt="Banner da Empresa"
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
              data-ai-hint="company banner"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <UploadCloud className="h-12 w-12 mb-2" />
              <p>Adicione um banner para sua empresa</p>
              <p className="text-xs">(Recomendado: 1200x300px ou similar)</p>
            </div>
          )}
           <div className="absolute inset-0 bg-black/30 rounded-t-lg"></div>
        </div>

        <div className="relative px-6 pb-6 -mt-16 flex flex-col items-center text-center">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-lg mb-2">
            {companyData?.logotipo ? (
              <NextImage
                src={companyData.logotipo}
                alt="Logotipo da Empresa"
                width={144}
                height={144}
                className="object-contain"
                data-ai-hint="company logo"
              />
            ) : (
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-2xl font-semibold text-foreground">{companyData?.nome || "Nome da Empresa"}</h2>
           <p className="text-sm text-muted-foreground">{companyData?.email || user?.email || "email@nao.definido"}</p>
        </div>

        <CardHeader className="pt-0">
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

            <Card className="p-4 border-dashed">
                <CardTitle className="text-lg mb-3">Identidade Visual</CardTitle>
                <div className="space-y-4">
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
                        <p className="text-xs text-muted-foreground mt-1">Recomendamos um logotipo quadrado (1:1). Máx: 2MB.</p>
                        {newLogoPreview && (
                            <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Pré-visualização do novo logotipo:</p>
                            <div className="w-24 h-24 rounded border bg-muted/50 flex items-center justify-center overflow-hidden">
                                <NextImage src={newLogoPreview} alt="Preview do novo logotipo" width={96} height={96} className="object-contain max-w-full max-h-full" data-ai-hint="company logo preview" />
                            </div>
                            </div>
                        )}
                    </div>
                     <div>
                        <Label htmlFor="bannerFile">Alterar/Adicionar Banner</Label>
                        <Controller
                            name="bannerFile"
                            control={control}
                            render={({ field: { onChange, value, ...restField } }) => (
                            <Input
                                id="bannerFile"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => onChange(e.target.files)}
                                {...restField}
                                className="mt-1"
                            />
                            )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Recomendado: Imagem horizontal (ex: 1200x300px). Máx: 5MB.</p>
                        {newBannerPreview && (
                            <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Pré-visualização do novo banner:</p>
                            <div className="w-full max-w-md h-24 rounded border bg-muted/50 flex items-center justify-center overflow-hidden">
                                <NextImage src={newBannerPreview} alt="Preview do novo banner" layout="fill" objectFit="contain" className="max-w-full max-h-full" data-ai-hint="company banner preview" />
                            </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Button type="submit" disabled={loading || cnpjLoading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
