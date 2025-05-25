
"use client";

import type { Control, UseFieldArrayReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2 } from "lucide-react";

interface CircuitosTableFormProps {
  control: Control<any>;
  errors: any;
  fieldArray: UseFieldArrayReturn<any, "circuitos", "id">;
}

export default function CircuitosTableForm({ control, errors, fieldArray }: CircuitosTableFormProps) {
  const { fields, append, remove } = fieldArray;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>2. Distribuição dos Circuitos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">N°</TableHead>
                <TableHead>Circuito</TableHead>
                <TableHead>Disjuntor</TableHead>
                <TableHead>Cabo (mm²)</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Controller
                      name={`circuitos.${index}.nome`}
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="Ex: Iluminação Sala" />}
                    />
                    {errors.circuitos?.[index]?.nome && <p className="text-xs text-destructive mt-1">{errors.circuitos[index]?.nome?.message}</p>}
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`circuitos.${index}.disjuntor`}
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="Ex: 10A Curva B" />}
                    />
                    {errors.circuitos?.[index]?.disjuntor && <p className="text-xs text-destructive mt-1">{errors.circuitos[index]?.disjuntor?.message}</p>}
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`circuitos.${index}.caboMM`}
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="Ex: 1,5" />}
                    />
                    {errors.circuitos?.[index]?.caboMM && <p className="text-xs text-destructive mt-1">{errors.circuitos[index]?.caboMM?.message}</p>}
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`circuitos.${index}.observacoes`}
                      control={control}
                      render={({ field }) => <Textarea {...field} placeholder="Opcional" rows={1} />}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} aria-label="Remover Circuito">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {errors.circuitos && typeof errors.circuitos === 'object' && 'message' in errors.circuitos && !Array.isArray(errors.circuitos) && (
           <p className="text-sm text-destructive mt-2">{errors.circuitos.message}</p>
        )}
        <Button type="button" variant="outline" onClick={() => append({ nome: "", disjuntor: "", caboMM: "", observacoes: "" })} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Circuito
        </Button>
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
