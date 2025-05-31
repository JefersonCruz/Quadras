
"use client";

import type { Orcamento, Cliente, Empresa, Projeto, OrcamentoItem } from "@/types/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface QuoteViewProps {
  quote: Orcamento;
  client?: Cliente | null;
  project?: Projeto | null;
  company?: Empresa | null;
}

// Simulação de itens para demonstração do layout
const mockLaborItems: OrcamentoItem[] = [
  { id: "l1", descricao: "Instalação de quadro de distribuição (até 12 disjuntores)", quantidade: 1, unidadeMedida: "vb", precoUnitario: 350, precoTotal: 350 },
  { id: "l2", descricao: "Lançamento de fiação para circuito de iluminação (por ponto)", quantidade: 8, unidadeMedida: "un", precoUnitario: 45, precoTotal: 360 },
  { id: "l3", descricao: "Instalação de tomada padrão ABNT (por ponto)", quantidade: 12, unidadeMedida: "un", precoUnitario: 30, precoTotal: 360 },
];

const mockMaterialItems: OrcamentoItem[] = [
  { id: "m1", descricao: "Quadro de distribuição embutir p/ 12 disjuntores", quantidade: 1, unidadeMedida: "un", precoUnitario: 85, precoTotal: 85 },
  { id: "m2", descricao: "Disjuntor unipolar DIN 10A Curva C", quantidade: 5, unidadeMedida: "un", precoUnitario: 12.50, precoTotal: 62.50 },
  { id: "m3", descricao: "Cabo Flexível 2,5mm² (preto)", quantidade: 50, unidadeMedida: "m", precoUnitario: 2.80, precoTotal: 140 },
  { id: "m4", descricao: "Tomada 2P+T 10A Branca completa", quantidade: 12, unidadeMedida: "un", precoUnitario: 8.90, precoTotal: 106.80 },
];

export default function QuoteView({ quote, client, project, company }: QuoteViewProps) {

  const getFormattedDate = (timestamp?: any) => {
    if (!timestamp) return "N/A";
    // Check if it's already a Date object or a Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    try {
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };
  
  const renderItemsTable = (items: OrcamentoItem[] | undefined, title: string) => {
    if (!items || items.length === 0) {
      // Simulação para layout se não houver itens reais
      return (
        <div className="mt-4">
          <h4 className="font-semibold text-md mb-2">{title}</h4>
          <p className="text-sm text-muted-foreground italic">Nenhum item de {title.toLowerCase()} detalhado neste orçamento (simulação).</p>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <h4 className="font-semibold text-md mb-2">{title}</h4>
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Descrição</TableHead>
              <TableHead className="text-center">Qtd.</TableHead>
              <TableHead className="text-center">Un.</TableHead>
              <TableHead className="text-right">P. Unit.</TableHead>
              <TableHead className="text-right">P. Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.descricao}</TableCell>
                <TableCell className="text-center">{item.quantidade}</TableCell>
                <TableCell className="text-center">{item.unidadeMedida}</TableCell>
                <TableCell className="text-right">R$ {item.precoUnitario.toFixed(2)}</TableCell>
                <TableCell className="text-right">R$ {item.precoTotal.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const totalLabor = (quote.itensMaoDeObra || mockLaborItems).reduce((sum, item) => sum + item.precoTotal, 0);
  const totalMaterial = (quote.itensMateriais || mockMaterialItems).reduce((sum, item) => sum + item.precoTotal, 0);
  const subtotalCalculated = totalLabor + totalMaterial;
  // Use valorTotalEstimado from quote if available and greater than 0, otherwise use calculated sum
  const displayTotal = quote.valorTotalEstimado > 0 ? quote.valorTotalEstimado : subtotalCalculated;


  return (
    <div className="bg-background text-foreground font-sans p-2 sm:p-4 md:p-6 max-w-4xl mx-auto print:p-0 print:shadow-none print:border-none">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          {company?.logotipo ? (
            <Image src={company.logotipo} alt={`Logotipo de ${company.nome}`} width={80} height={80} className="object-contain rounded" data-ai-hint="company logo" />
          ) : (
            <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs" data-ai-hint="logo placeholder">Logo</div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-primary">{company?.nome || "Nome da Empresa"}</h1>
            <p className="text-xs text-muted-foreground">{company?.endereco || "Endereço da Empresa"}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground sm:text-right min-w-[180px]">
          <p>{company?.cnpj ? `CNPJ: ${company.cnpj}` : "CNPJ não informado"}</p>
          <p>{company?.telefone ? `Tel: ${company.telefone}` : "Telefone não informado"}</p>
          <p>{company?.email ? `Email: ${company.email}` : "Email não informado"}</p>
          <p>{company?.site ? `Site: ${company.site}` : ""}</p>
        </div>
      </header>

      {/* Quote Title and Client Info */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-center mb-1">ORÇAMENTO DE SERVIÇOS</h2>
        <p className="text-center text-sm text-muted-foreground mb-4">Nº: {quote.numeroOrcamento}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Card className="p-3">
            <CardTitle className="text-sm font-medium text-muted-foreground mb-1">CLIENTE:</CardTitle>
            <p className="font-semibold">{client?.nome || "Cliente não informado"}</p>
            <p>{client?.endereco || "Endereço do cliente não informado"}</p>
            <p>{client?.email || "Email não informado"} {client?.telefone ? ` / Tel: ${client.telefone}` : ""}</p>
          </Card>
          <Card className="p-3">
            <CardTitle className="text-sm font-medium text-muted-foreground mb-1">DETALHES DO ORÇAMENTO:</CardTitle>
            <p><strong>Data de Emissão:</strong> {getFormattedDate(quote.dataCriacao)}</p>
            <p><strong>Validade da Proposta:</strong> {getFormattedDate(quote.dataValidade)}</p>
            {project && <p><strong>Projeto Vinculado:</strong> {project.nome}</p>}
          </Card>
        </div>
      </section>

      {/* Scope Description */}
      <section className="mb-6 p-3 border rounded-md">
        <h3 className="font-semibold text-md mb-2">Escopo dos Serviços</h3>
        <p className="text-sm whitespace-pre-wrap">{quote.descricaoServicos || "Descrição detalhada dos serviços a serem prestados."}</p>
      </section>

      {/* Items - Labor and Materials */}
      <section className="mb-6">
        {renderItemsTable(quote.itensMaoDeObra || mockLaborItems, "Mão de Obra")}
        {renderItemsTable(quote.itensMateriais || mockMaterialItems, "Materiais")}
      </section>

      {/* Payment Conditions and Observations */}
      {quote.observacoes && (
        <section className="mb-6 p-3 border rounded-md bg-muted/20">
          <h3 className="font-semibold text-md mb-2">Condições de Pagamento e Observações</h3>
          <p className="text-sm whitespace-pre-wrap">{quote.observacoes}</p>
        </section>
      )}

      {/* Totals */}
      <section className="mb-6 flex justify-end">
        <div className="w-full max-w-xs space-y-1 text-sm">
            { (quote.itensMaoDeObra || mockLaborItems).length > 0 && (
                <div className="flex justify-between">
                    <span>Subtotal Mão de Obra:</span>
                    <span>R$ {totalLabor.toFixed(2)}</span>
                </div>
            )}
            { (quote.itensMateriais || mockMaterialItems).length > 0 && (
                 <div className="flex justify-between">
                    <span>Subtotal Materiais:</span>
                    <span>R$ {totalMaterial.toFixed(2)}</span>
                </div>
            )}
             {(quote.itensMaoDeObra || mockLaborItems).length > 0 && (quote.itensMateriais || mockMaterialItems).length > 0 && (
                 <div className="flex justify-between font-medium border-t pt-1">
                    <span>Subtotal Geral:</span>
                    <span>R$ {subtotalCalculated.toFixed(2)}</span>
                </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-lg text-primary pt-1">
                <span>VALOR TOTAL:</span>
                <span>R$ {displayTotal.toFixed(2)}</span>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p>Agradecemos a oportunidade de apresentar esta proposta.</p>
            <p>Em caso de dúvidas, entre em contato.</p>
            <p className="mt-2 font-semibold">{company?.nome || "Sua Empresa"}</p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="font-semibold mb-1">Pague com PIX:</p>
            <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-muted-foreground" data-ai-hint="QR code placeholder">
                QR Code
            </div>
            {company?.chavePix && <p className="text-xxs mt-1">Chave: {company.chavePix}</p>}
          </div>
        </div>
        <p className="text-center mt-4 text-xxs">Orçamento gerado por ANODE Lite.</p>
      </footer>
    </div>
  );
}
