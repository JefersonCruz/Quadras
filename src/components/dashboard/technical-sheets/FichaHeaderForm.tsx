
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label>Logotipo da Empresa</Label>
                {empresa?.logotipo ? (
                    <div className="mt-2 w-32 h-32 border rounded-md flex items-center justify-center overflow-hidden bg-muted">
                        <Image src={empresa.logotipo} alt="Logotipo da Empresa" width={128} height={128} className="object-contain" data-ai-hint="logo company" />
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground mt-1">Configure o logotipo no <a href="/dashboard/company" className="underline text-primary">Perfil da Empresa</a>.</p>
                )}
            </div>
            <div>
                <Label>Nome da Empresa</Label>
                <Input
                    value={empresa?.nome || "Configure no Perfil da Empresa"}
                    disabled
                    className="mt-1"
                />
            </div>
        </div>
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
                    className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
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

// Dummy Card components if not globally available or for isolation
const Card: React.FC<{className?: string, children: React.ReactNode}> = ({ className, children }) => <div className={cn("border rounded-lg shadow-sm bg-card text-card-foreground", className)}>{children}</div>;
const CardHeader: React.FC<{children: React.ReactNode}> = ({ children }) => <div className="p-6 flex flex-col space-y-1.5">{children}</div>;
const CardTitle: React.FC<{children: React.ReactNode}> = ({ children }) => <h3 className="text-2xl font-semibold leading-none tracking-tight">{children}</h3>;
const CardContent: React.FC<{className?: string, children: React.ReactNode}> = ({ className, children }) => <div className={cn("p-6 pt-0", className)}>{children}</div>;

// cn utility if not globally available
function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}
