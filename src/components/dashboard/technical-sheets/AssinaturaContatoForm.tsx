
"use client";

import type { Control, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Usuario } from "@/types/firestore";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AssinaturaContatoFormProps {
  control: Control<any>;
  errors: any;
  user?: Usuario | null;
  setValue: UseFormSetValue<any>;
  assinaturaPreview?: string | null;
  assinaturaFile?: File | null; // Added to display file name
  onAssinaturaChange: (file: File | undefined) => void;
}

export default function AssinaturaContatoForm({
  control,
  errors,
  user,
  setValue,
  assinaturaPreview: initialPreview,
  assinaturaFile,
  onAssinaturaChange,
}: AssinaturaContatoFormProps) {
  const { toast } = useToast();
  const [localAssinaturaPreview, setLocalAssinaturaPreview] = useState<string | null>(initialPreview || null);

   useEffect(() => {
    setLocalAssinaturaPreview(initialPreview || null);
  }, [initialPreview]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB size limit for signature
        toast({ title: "Arquivo muito grande", description: "A assinatura deve ter no máximo 1MB.", variant: "destructive"});
        event.target.value = ""; 
        onAssinaturaChange(undefined);
        setLocalAssinaturaPreview(null); 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalAssinaturaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onAssinaturaChange(file);
    } else {
      onAssinaturaChange(undefined);
      setLocalAssinaturaPreview(null);
    }
  };


  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>5. Assinatura e Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nomeEletricista">Nome do Eletricista / Responsável</Label>
          <Controller
            name="nomeEletricista"
            control={control}
            defaultValue={user?.nome || ""}
            render={({ field }) => <Input id="nomeEletricista" {...field} />}
          />
          {errors.nomeEletricista && <p className="text-sm text-destructive mt-1">{errors.nomeEletricista.message}</p>}
        </div>
        <div>
          <Label htmlFor="assinaturaEletricistaFile">Assinatura Digital (Imagem)</Label>
          <Controller
            name="assinaturaEletricistaFile"
            control={control}
            render={({ field: { onChange: _onChange, value, ...restField} }) => ( 
                 <Input 
                    id="assinaturaEletricistaFile" 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="mt-1"
                    {...restField}
                  />
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">Recomendado: Fundo transparente (PNG). Máx: 1MB.</p>
          {assinaturaFile && (
            <p className="text-xs text-muted-foreground mt-1">Arquivo selecionado: {assinaturaFile.name}</p>
          )}
          {localAssinaturaPreview && (
            <div className="mt-2 p-2 border rounded-md bg-muted/50 inline-block">
              <Image src={localAssinaturaPreview} alt="Preview da Assinatura" width={150} height={75} className="object-contain" data-ai-hint="signature" />
            </div>
          )}
           {errors.assinaturaEletricistaFile && <p className="text-sm text-destructive mt-1">{errors.assinaturaEletricistaFile.message}</p>}
        </div>
        <div>
          <Label htmlFor="contatoEletricista">WhatsApp / Telefone</Label>
          <Controller
            name="contatoEletricista"
            control={control}
            render={({ field }) => <Input id="contatoEletricista" {...field} placeholder="(00) 00000-0000" />}
          />
          {errors.contatoEletricista && <p className="text-sm text-destructive mt-1">{errors.contatoEletricista.message}</p>}
        </div>
        <div>
          <Label htmlFor="ramalPortaria">Ramal da Portaria (opcional)</Label>
          <Controller
            name="ramalPortaria"
            control={control}
            render={({ field }) => <Input id="ramalPortaria" {...field} placeholder="Ex: 90" />}
          />
          {errors.ramalPortaria && <p className="text-sm text-destructive mt-1">{errors.ramalPortaria.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// Dummy Card components are not needed here as they are imported from ui/card
// cn utility
// function cn(...inputs: any[]): string {
//   return inputs.filter(Boolean).join(' ');
// }
