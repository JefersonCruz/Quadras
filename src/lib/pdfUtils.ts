
// src/lib/pdfUtils.ts
'use client';

import type { FichaTecnica, Empresa } from "@/types/firestore";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function generateTechnicalSheetPdf(fichaData: FichaTecnica): Promise<void> {
  try {
    const doc = new jsPDF();
    let yPos = 20;
    const lineSpacing = 7;
    const sectionSpacing = 10;
    const indent = 10;
    const fieldIndent = indent + 5;

    // --- Helper to add text and increment yPos ---
    const addText = (text: string, x: number, y: number, options?: any) => {
      doc.text(text, x, y, options);
      return y + lineSpacing;
    };

    const addTitle = (text: string, x: number, y: number) => {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      const newY = addText(text, x, y);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      return newY;
    };

    // --- SEÇÃO 1: Cabeçalho e Identificação ---
    yPos = addTitle("1. Cabeçalho e Identificação", indent, yPos);
    if (fichaData.logotipoEmpresaUrl) {
      // Placeholder for actual image rendering, which is more complex with jsPDF
      // For now, we'll just note the URL. In a real scenario, you might fetch and draw it.
      try {
        // This is a very basic attempt, real image embedding is more involved
        // const imgData = await fetch(fichaData.logotipoEmpresaUrl).then(res => res.blob()).then(blob => URL.createObjectURL(blob));
        // doc.addImage(imgData, 'PNG', fieldIndent, yPos, 30, 30);
        // yPos += 35;
         yPos = addText(`Logotipo Empresa: ${fichaData.logotipoEmpresaUrl}`, fieldIndent, yPos);
      } catch (e) {
        yPos = addText(`Logotipo Empresa (URL): ${fichaData.logotipoEmpresaUrl}`, fieldIndent, yPos);
      }
    }
    yPos = addText(`Nome Empresa: ${fichaData.nomeEmpresa || "Não configurado"}`, fieldIndent, yPos);
    yPos = addText(`Título da Ficha: ${fichaData.tituloFicha}`, fieldIndent, yPos);
    yPos = addText(`Local/Identificação: ${fichaData.identificacaoLocal}`, fieldIndent, yPos);
    yPos = addText(`Data da Instalação: ${fichaData.dataInstalacao ? format(fichaData.dataInstalacao.toDate(), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}`, fieldIndent, yPos);
    yPos = addText(`Responsável Técnico: ${fichaData.responsavelTecnico}`, fieldIndent, yPos);
    yPos = addText(`Versão da Ficha: ${fichaData.versaoFicha}`, fieldIndent, yPos);
    yPos += sectionSpacing;

    // --- SEÇÃO 2: Tabela de Distribuição dos Circuitos ---
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    yPos = addTitle("2. Distribuição dos Circuitos", indent, yPos);
    if (fichaData.circuitos && fichaData.circuitos.length > 0) {
      doc.setFont(undefined, 'bold');
      yPos = addText("N° | Circuito | Disjuntor | Cabo (mm²) | Observações", fieldIndent, yPos);
      doc.setFont(undefined, 'normal');
      fichaData.circuitos.forEach((circ, index) => {
        const circuitoText = `${index + 1} | ${circ.nome} | ${circ.disjuntor} | ${circ.caboMM} | ${circ.observacoes || "-"}`;
        yPos = addText(circuitoText, fieldIndent, yPos);
        if (yPos > 270) { // Page break logic
          doc.addPage();
          yPos = 20;
          // Optional: Repeat table headers on new page
          doc.setFont(undefined, 'bold');
          addText("N° | Circuito | Disjuntor | Cabo (mm²) | Observações", fieldIndent, yPos);
          yPos += lineSpacing;
          doc.setFont(undefined, 'normal');
        }
      });
    } else {
      yPos = addText("Nenhum circuito adicionado.", fieldIndent, yPos);
    }
    yPos += sectionSpacing;

    // --- SEÇÃO 3: Observações Técnicas ---
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    yPos = addTitle("3. Observações Técnicas", indent, yPos);
    yPos = addText(`Norma de Referência: ${fichaData.observacaoNBR || "Conforme NBR 5410"}`, fieldIndent, yPos);
    yPos = addText(`Disjuntor DR: ${fichaData.observacaoDR ? "Sim" : "Não"}`, fieldIndent, yPos);
    if (fichaData.descricaoDROpcional) {
      yPos = addText(`Descrição DR: ${fichaData.descricaoDROpcional}`, fieldIndent, yPos);
    }
    yPos += sectionSpacing;
    
    // --- SEÇÃO 4: QR Code e Acesso ---
    if (yPos > 260) { doc.addPage(); yPos = 20; }
    yPos = addTitle("4. QR Code e Acesso", indent, yPos);
    if (fichaData.qrCodeUrl) {
        // Placeholder for actual QR image
         yPos = addText(`QR Code: ${fichaData.qrCodeUrl}`, fieldIndent, yPos);
    } else {
         yPos = addText("QR Code da Ficha: (Não gerado/configurado)", fieldIndent, yPos);
    }
    yPos = addText(`Texto de Acesso Online: ${fichaData.textoAcessoOnline || "Acesso aos projetos online"}`, fieldIndent, yPos);
    if (fichaData.linkFichaPublica) {
         yPos = addText(`Link da Ficha Técnica: ${fichaData.linkFichaPublica}`, fieldIndent, yPos);
    } else {
         yPos = addText("Link da Ficha Técnica: (Não gerado/configurado)", fieldIndent, yPos);
    }
    yPos += sectionSpacing;

    // --- SEÇÃO 5: Assinatura e Contato ---
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    yPos = addTitle("5. Assinatura e Contato", indent, yPos);
    yPos = addText(`Nome Eletricista/Responsável: ${fichaData.nomeEletricista}`, fieldIndent, yPos);
    if (fichaData.assinaturaEletricistaUrl) {
      // Placeholder for actual image
      yPos = addText(`Assinatura Digital (URL): ${fichaData.assinaturaEletricistaUrl}`, fieldIndent, yPos);
    } else {
       yPos = addText(`Assinatura Digital: (Não fornecida)`, fieldIndent, yPos);
    }
    yPos = addText(`Contato: ${fichaData.contatoEletricista}`, fieldIndent, yPos);
    if (fichaData.ramalPortaria) {
      yPos = addText(`Ramal Portaria: ${fichaData.ramalPortaria}`, fieldIndent, yPos);
    }
    
    doc.save(`ficha-tecnica-${fichaData.identificacaoLocal.replace(/\s+/g, '_') || 'geral'}.pdf`);
  } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw new Error("Não foi possível gerar o arquivo PDF.");
  }
}
