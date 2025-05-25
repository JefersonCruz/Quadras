
"use client";

import type { Control, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Usuario } from "@/types/firestore";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface AssinaturaContatoFormProps {
  control: Control<any>;
  errors: any;
  user?: Usuario | null;
  setValue: UseFormSetValue<any>;
  assinaturaPreview?: string | null;
  onAssinaturaChange: (file: File | undefined) => void;
}

export default function AssinaturaContatoForm({
  control,
  errors,
  user,
  setValue,
  assinaturaPreview: initialPreview,
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
        // Clear the file input visually if possible, or notify user to select another
        event.target.value = ""; // Attempt to clear
        onAssinaturaChange(undefined);
        setLocalAssinaturaPreview(null); // Clear preview
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
            render={({ field: { onChange: _onChange, value, ...restField} }) => ( // _onChange to avoid conflict if not used directly
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

// Dummy Card components
const Card: React.FC<{className?: string, children: React.ReactNode}> = ({ className, children }) => <div className={cn("border rounded-lg shadow-sm bg-card text-card-foreground", className)}>{children}</div>;
const CardHeader: React.FC<{children: React.ReactNode}> = ({ children }) => <div className="p-6 flex flex-col space-y-1.5">{children}</div>;
const CardTitle: React.FC<{children: React.ReactNode}> = ({ children }) => <h3 className="text-2xl font-semibold leading-none tracking-tight">{children}</h3>;
const CardContent: React.FC<{className?: string, children: React.ReactNode}> = ({ className, children }) => <div className={cn("p-6 pt-0", className)}>{children}</div>;

// cn utility
function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}
