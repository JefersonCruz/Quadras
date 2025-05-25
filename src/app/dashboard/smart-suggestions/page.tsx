
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { suggestTemplates, type SuggestTemplatesInput, type SuggestTemplatesOutput } from "@/ai/flows/smart-template-suggestions";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

const suggestionsSchema = z.object({
  projectType: z.string().min(3, "Tipo de projeto é obrigatório."),
  clientData: z.string().min(10, "Dados do cliente são obrigatórios (mínimo 10 caracteres)."),
});

type SuggestionsFormData = z.infer<typeof suggestionsSchema>;

export default function SmartSuggestionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestTemplatesOutput | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SuggestionsFormData>({
    resolver: zodResolver(suggestionsSchema),
    defaultValues: { projectType: "", clientData: "" },
  });

  const onSubmit = async (data: SuggestionsFormData) => {
    setLoading(true);
    setSuggestions(null);
    try {
      const result = await suggestTemplates(data);
      setSuggestions(result);
      toast({ title: "Sugestões Geradas!", description: "Templates sugeridos pela IA." });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({ title: "Erro ao Gerar Sugestões", description: "Não foi possível obter sugestões da IA.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sugestões Inteligentes de Templates"
        description="Utilize a IA para obter sugestões de templates para etiquetas e fichas técnicas."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Sparkles className="mr-2 h-6 w-6 text-primary" /> Gerar Sugestões</CardTitle>
          <CardDescription>Forneça detalhes sobre o projeto e o cliente para receber sugestões personalizadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="projectType">Tipo do Projeto</Label>
              <Controller
                name="projectType"
                control={control}
                render={({ field }) => <Input id="projectType" {...field} placeholder="Ex: Residencial, Comercial, Industrial" />}
              />
              {errors.projectType && <p className="text-sm text-destructive mt-1">{errors.projectType.message}</p>}
            </div>
            <div>
              <Label htmlFor="clientData">Dados Relevantes do Cliente</Label>
              <Controller
                name="clientData"
                control={control}
                render={({ field }) => <Textarea id="clientData" {...field} placeholder="Ex: Cliente do setor alimentício, necessita de documentação para painéis de refrigeração." rows={4} />}
              />
              {errors.clientData && <p className="text-sm text-destructive mt-1">{errors.clientData.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Obter Sugestões
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Gerando sugestões, por favor aguarde...</p>
        </div>
      )}

      {suggestions && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões para Templates de Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.labelTemplateSuggestions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {suggestions.labelTemplateSuggestions.map((suggestion, index) => (
                    <li key={`label-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Nenhuma sugestão de template de etiqueta encontrada para os critérios fornecidos.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sugestões para Templates de Fichas Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.technicalSheetTemplateSuggestions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {suggestions.technicalSheetTemplateSuggestions.map((suggestion, index) => (
                    <li key={`sheet-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Nenhuma sugestão de template de ficha técnica encontrada para os critérios fornecidos.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
