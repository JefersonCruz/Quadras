
"use client";

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Empresa, Usuario } from "@/types/firestore";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { cn } from "@/lib/utils";

interface FichaHeaderFormProps {
  control: Control<any>;
  errors: any;
  empresa?: Empresa | null;
  user?: Usuario | null;
}

export default function FichaHeaderForm({ control, errors, empresa, user }: FichaHeaderFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>1. Cabeçalho e Identificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo and Company Name Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-6 pb-4 border-b">
          <div className="md:col-span-1">
            <Label className="block mb-1 text-xs text-muted-foreground">Logotipo:</Label>
            {empresa?.logotipo ? (
              <div className="mt-1 w-24 h-24 border rounded-md flex items-center justify-center overflow-hidden bg-muted shadow-sm p-1">
                <Image src={empresa.logotipo} alt="Logotipo da Empresa" width={96} height={96} className="object-contain" data-ai-hint="logo company" />
              </div>
            ) : (
              <div className="mt-1 w-24 h-24 border rounded-md flex items-center justify-center bg-muted/30 text-xs text-muted-foreground p-2 text-center shadow-sm">
                Sem logotipo. Configure no Perfil da Empresa.
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="displayNomeEmpresa" className="block mb-1 text-xs text-muted-foreground">Empresa:</Label>
            <Input
              id="displayNomeEmpresa"
              value={empresa?.nome || "Nome da Empresa não configurado"}
              disabled
              className="mt-1 text-lg font-semibold bg-muted/30"
            />
            {!empresa?.nome && (
                 <p className="text-xs text-muted-foreground mt-1">
                    Visite <a href="/dashboard/company" className="underline text-primary hover:text-primary/80">Perfil da Empresa</a> para adicionar.
                </p>
            )}
          </div>
        </div>
        {/* End Logo and Company Name Section */}

        <div>
          <Label htmlFor="tituloFicha">Título da Ficha</Label>
          <Controller
            name="tituloFicha"
            control={control}
            render={({ field }) => <Input id="tituloFicha" {...field} placeholder="Ex: FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO" />}
          />
          {errors.tituloFicha && <p className="text-sm text-destructive mt-1">{errors.tituloFicha.message}</p>}
        </div>
        <div>
          <Label htmlFor="identificacaoLocal">Bloco / Apartamento / Local</Label>
          <Controller
            name="identificacaoLocal"
            control={control}
            render={({ field }) => <Input id="identificacaoLocal" {...field} placeholder="Ex: Bloco A - Ap 204" />}
          />
          {errors.identificacaoLocal && <p className="text-sm text-destructive mt-1">{errors.identificacaoLocal.message}</p>}
        </div>
        <div>
          <Label htmlFor="dataInstalacao">Data da Instalação</Label>
          <Controller
            name="dataInstalacao"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.dataInstalacao && <p className="text-sm text-destructive mt-1">{errors.dataInstalacao.message}</p>}
        </div>
        <div>
          <Label htmlFor="responsavelTecnico">Responsável Técnico</Label>
          <Controller
            name="responsavelTecnico"
            control={control}
            defaultValue={user?.nome || ""}
            render={({ field }) => <Input id="responsavelTecnico" {...field} />}
          />
          {errors.responsavelTecnico && <p className="text-sm text-destructive mt-1">{errors.responsavelTecnico.message}</p>}
        </div>
         <div>
          <Label htmlFor="versaoFicha">Versão da Ficha</Label>
          <Controller
            name="versaoFicha"
            control={control}
            defaultValue="v1.0"
            render={({ field }) => <Input id="versaoFicha" {...field} disabled />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
