
"use client";

import type { Control, UseFieldArrayReturn, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { modelosCircuitos, type TemplateCircuito } from "@/config/circuit-templates";
import type { CircuitoFicha } from "@/types/firestore";

interface CircuitosTableFormProps {
  control: Control<any>;
  errors: any;
  fieldArray: UseFieldArrayReturn<any, "circuitos", "id">;
  setValue: UseFormSetValue<any>; // To update the whole array
}

const circuitCounts = ["6", "8", "12", "18", "24", "32", "44"];

export default function CircuitosTableForm({ control, errors, fieldArray, setValue }: CircuitosTableFormProps) {
  const { fields, append, remove, replace } = fieldArray;

  const handleTemplateChange = (countStr: string) => {
    if (!countStr) {
      replace([]); // Clear if no selection
      return;
    }
    const targetCount = parseInt(countStr, 10);
    let combinedTemplates: TemplateCircuito[] = [];

    const sortedTemplateKeys = Object.keys(modelosCircuitos.modelos)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b);
    
    let currentCount = 0;
    for (const keyCount of sortedTemplateKeys) {
        if (currentCount < targetCount && keyCount <= targetCount) {
            const templateKeyStr = keyCount.toString();
            if (modelosCircuitos.modelos[templateKeyStr]) {
                 // Ensure we only add up to the targetCount
                const circuitsToAdd = modelosCircuitos.modelos[templateKeyStr];
                circuitsToAdd.forEach(circuit => {
                    if(combinedTemplates.length < targetCount) {
                        // Check if a circuit with this 'numero' (effectively an ID here) already exists
                        // This logic is to handle the additive nature of the original template request.
                        // If the template numbers are unique globally, this find is not strictly needed for uniqueness.
                        if (!combinedTemplates.find(ct => ct.numero === circuit.numero)) {
                             combinedTemplates.push(circuit);
                        }
                    }
                });
                // This ensures we don't overfill based on how templates are structured.
                // The provided templates are cumulative, so this logic works.
                // If user selects "8", we add "6" and then "8".
            }
             // Update currentCount based on the actual number of unique items from template key
            // This assumes that each key ("6", "8", etc.) contains circuits that are unique
            // and contribute towards reaching the targetCount.
            // For the cumulative logic:
             if(keyCount > currentCount) currentCount = keyCount;

        }
    }
    
    // Ensure the final list doesn't exceed targetCount, and sort by 'numero'
    const finalCircuits = combinedTemplates
        .sort((a,b) => a.numero - b.numero)
        .slice(0, targetCount)
        .map(t => ({
            nome: t.nome,
            disjuntor: t.disjuntor,
            caboMM: t.cabo, // Map 'cabo' to 'caboMM'
            observacoes: t.observacao || "",
        } as CircuitoFicha ));

    replace(finalCircuits);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>2. Distribuição dos Circuitos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <Label htmlFor="circuitTemplateSelect">Selecionar Modelo de Circuitos (NBR 5410 Padrões Residenciais)</Label>
          <div className="flex gap-2 items-center">
            <Select onValueChange={handleTemplateChange}>
              <SelectTrigger id="circuitTemplateSelect" className="w-full md:w-72">
                <SelectValue placeholder="Escolha a quantidade de circuitos..." />
              </SelectTrigger>
              <SelectContent>
                {circuitCounts.map(count => (
                  <SelectItem key={count} value={count}>{count} Circuitos</SelectItem>
                ))}
                <SelectItem value="">Limpar/Manual</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => append({ nome: "", disjuntor: "", caboMM: "", observacoes: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Manual
            </Button>
          </div>
           <p className="text-xs text-muted-foreground">
            Selecionar um modelo preencherá a tabela com circuitos comuns. Você poderá editá-los.
          </p>
        </div>

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
                     {errors.circuitos?.[index]?.observacoes && <p className="text-xs text-destructive mt-1">{errors.circuitos[index]?.observacoes?.message}</p>}
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
        {/* Moved "Adicionar Circuito" button next to the select for better UX */}
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
