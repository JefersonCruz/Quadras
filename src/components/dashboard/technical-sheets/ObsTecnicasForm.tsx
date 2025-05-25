
"use client";

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface ObsTecnicasFormProps {
  control: Control<any>;
  errors: any;
}

export default function ObsTecnicasForm({ control, errors }: ObsTecnicasFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>3. Observações Técnicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Norma de Referência</Label>
          <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">Conforme NBR 5410</p>
          {/* This is a fixed text, so no Controller needed unless it's editable */}
          {/* <Controller name="observacaoNBR" control={control} render={({ field }) => <Input {...field} disabled />} /> */}
        </div>
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <Controller
                    name="observacaoDR"
                    control={control}
                    render={({ field }) => (
                    <Checkbox
                        id="observacaoDR"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    )}
                />
                <Label htmlFor="observacaoDR" className="font-normal">Observação sobre Disjuntor DR</Label>
            </div>
            {errors.observacaoDR && <p className="text-sm text-destructive">{errors.observacaoDR.message}</p>}
        </div>
        <div>
          <Label htmlFor="descricaoDROpcional">Descrição Adicional sobre DR (opcional)</Label>
          <Controller
            name="descricaoDROpcional"
            control={control}
            render={({ field }) => <Textarea id="descricaoDROpcional" {...field} placeholder="Ex: Disjuntor DR não instalado, Disjuntor DR geral de 40A/30mA" />}
          />
          {errors.descricaoDROpcional && <p className="text-sm text-destructive mt-1">{errors.descricaoDROpcional.message}</p>}
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
