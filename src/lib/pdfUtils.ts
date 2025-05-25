
// src/lib/pdfUtils.ts
'use client';

import type { FichaTecnica } from "@/types/firestore";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Extend jsPDF with autoTable - this is how the plugin is typically used
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export async function generateTechnicalSheetPdf(fichaData: FichaTecnica): Promise<void> {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 0;

    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Colors (approximations)
    const headerBlue = [25, 75, 125]; // RGB for dark blue
    const textDark = [51, 51, 51]; // Dark grey for text
    const textLight = [255, 255, 255]; // White
    const accentOrange = [255, 152, 0]; // Orange for lightning bolt

    // --- SEÇÃO 1: Cabeçalho Principal (Azul) ---
    const headerHeight = 40;
    doc.setFillColor(headerBlue[0], headerBlue[1], headerBlue[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    yPos = 15; // Start text within the blue header

    // Placeholder for Lightning Bolt Icon (using a simple shape or text)
    doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.circle(pageWidth / 2, yPos, 5, 'F'); // Simple circle
    doc.setFontSize(18);
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.setFont(undefined, 'bold');
    // Simulating the text "ENERGY"
    const energyText = "ENERGY";
    const energyTextWidth = doc.getStringUnitWidth(energyText) * 18 / doc.internal.scaleFactor;
    doc.text(energyText, (pageWidth - energyTextWidth) / 2, yPos + 15);

    yPos = headerHeight + 10; // Position after blue header

    // --- SEÇÃO 2: Identificação da Ficha ---
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    const tituloFichaText = fichaData.tituloFicha || "FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO";
    const tituloWidth = doc.getStringUnitWidth(tituloFichaText) * 16 / doc.internal.scaleFactor;
    doc.text(tituloFichaText, (pageWidth - tituloWidth) / 2, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    yPos = doc.getTextDimensions(fichaData.identificacaoLocal, { fontSize: 10, maxWidth: contentWidth }).h > 5 ? yPos + 5 : yPos;
    doc.text(`Local: ${fichaData.identificacaoLocal}`, margin, yPos);
    yPos += 5;
    doc.text(`Data: ${fichaData.dataInstalacao ? format(fichaData.dataInstalacao.toDate(), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}`, margin, yPos);
    yPos += 5;
    doc.text(`Responsável: ${fichaData.responsavelTecnico}`, margin, yPos);
    yPos += 5;

    // Placeholder for small "ENERGY" logo (text based)
    if (fichaData.logotipoEmpresaUrl) {
        // In a real scenario, you'd fetch and draw the image. For now, text placeholder.
        doc.setFontSize(8);
        doc.text(`Logo: ${fichaData.nomeEmpresa || "Empresa"}`, pageWidth - margin - 40, yPos - 10, { align: 'right' });
    } else if(fichaData.nomeEmpresa) {
        doc.setFontSize(8);
        doc.text(fichaData.nomeEmpresa, pageWidth - margin - 40, yPos - 10, { align: 'right' });
    }


    yPos += 5; // Space before table
    doc.setFontSize(10);


    // --- SEÇÃO 3: Tabela de Distribuição dos Circuitos ---
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Distribuição dos Circuitos", margin, yPos);
    yPos += 6;

    const tableColumnStyles = {
      0: { cellWidth: 15 }, // Nº
      1: { cellWidth: 50 }, // Circuito
      2: { cellWidth: 35 }, // Disjuntor
      3: { cellWidth: 30 }, // Cabo
      4: { cellWidth: 'auto' },// Observações
    };

    const tableData = fichaData.circuitos.map((circ, index) => [
      (index + 1).toString(),
      circ.nome,
      circ.disjuntor,
      circ.caboMM,
      circ.observacoes || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nº', 'Circuito', 'Disjuntor', 'Cabo (mm²)', 'Observações']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: textDark, fontStyle: 'bold', fontSize:9 },
      bodyStyles: { textColor: textDark, fontSize: 8, cellPadding: 1.5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: tableColumnStyles,
      margin: { left: margin, right: margin },
      didDrawPage: (data) => { // Capture yPos after table
        yPos = data.cursor?.y || yPos;
      }
    });
    // yPos is updated by autoTable's didDrawPage hook or its finalY property
    yPos = (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 5 : yPos + 10;


    // --- SEÇÃO 4: Observações Técnicas ---
    if (yPos > pageHeight - 60) { doc.addPage(); yPos = margin; } // Check for page break
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Conforme NBR 5410`, margin, yPos);
    yPos += 5;
    let obsDRText = `Observações: Disjuntor DR ${fichaData.observacaoDR ? 'instalado' : 'não instalado'}.`;
    if (fichaData.observacaoDR && fichaData.descricaoDROpcional) {
      obsDRText += ` ${fichaData.descricaoDROpcional}`;
    } else if (!fichaData.observacaoDR && fichaData.descricaoDROpcional) {
       obsDRText += ` ${fichaData.descricaoDROpcional}`;
    }
    doc.text(obsDRText, margin, yPos, {maxWidth: contentWidth});
    yPos += doc.getTextDimensions(obsDRText, { fontSize: 10, maxWidth: contentWidth }).h + 2;


    doc.text(`Acesso aos projetos online`, margin, yPos);
    yPos += 8;

    // --- SEÇÃO 5: QR Code e Contato ---
    if (yPos > pageHeight - 50) { doc.addPage(); yPos = margin; }
    const qrSectionX = margin;
    const contactSectionX = pageWidth / 2 + 5;
    const qrSize = 25;

    // Placeholder for QR Code
    doc.setFillColor(230, 230, 230);
    doc.rect(qrSectionX, yPos, qrSize, qrSize, 'F');
    doc.setFontSize(8);
    doc.text("QR", qrSectionX + qrSize/2, yPos + qrSize/2, {align: 'center', baseline: 'middle'});

    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const qrTextX = qrSectionX + qrSize + 5;
    let qrTextY = yPos + 5;
    doc.text("→ Informação completa", qrTextX, qrTextY);
    qrTextY += 5;
    doc.text(fichaData.linkFichaPublica || "www.exemplo.com", qrTextX, qrTextY, {
        // Uncomment to make it a clickable link if a valid URL is present
        // ...(fichaData.linkFichaPublica && {link: {url: fichaData.linkFichaPublica, options: {pageNumber: 1}}})
    });

    // Contato e Assinatura
    const signatureYStart = yPos;
    doc.setFontSize(10);
    doc.text(fichaData.nomeEletricista, contactSectionX, signatureYStart + 5, {maxWidth: contentWidth/2 -10});
    doc.setFontSize(8);
    doc.text("Eng. Eletricista", contactSectionX, signatureYStart + 9); // Role underneath
    if (fichaData.assinaturaEletricistaUrl) {
        doc.text(`Assinatura: (ver URL)`, contactSectionX, signatureYStart + 15, {maxWidth: contentWidth/2 -10});
    } else {
        // Placeholder for signature line
        doc.line(contactSectionX, signatureYStart + 13, contactSectionX + 40, signatureYStart + 13);
    }

    // Placeholder for WhatsApp icon
    doc.setFillColor(37, 211, 102); // WhatsApp Green
    doc.circle(contactSectionX -1, signatureYStart + 20, 1.5, 'F'); // Small circle for icon placeholder
    doc.text(fichaData.contatoEletricista, contactSectionX + 3, signatureYStart + 21);


    // --- SEÇÃO 6: Portaria ---
    yPos = Math.max(yPos + qrSize, signatureYStart + 25) + 10; // Position below QR and Signature
    if (yPos > pageHeight - 20) { doc.addPage(); yPos = margin; }
    doc.setDrawColor(150,150,150); // Light grey for lines
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos +=5;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Portaria", margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(fichaData.ramalPortaria || "-", margin + 25, yPos);
    doc.line(margin, yPos+2, pageWidth - margin, yPos+2); // Horizontal line
    yPos += 7;


    // --- SEÇÃO 7: Rodapé ---
    if (yPos > pageHeight - 15) { doc.addPage(); yPos = margin; }
    doc.setFontSize(8);
    const footerText = `Ficha técnica atualizada em ${format(fichaData.dataCriacao?.toDate() || new Date(), "dd/MM/yyyy", { locale: ptBR })}`;
    const footerTextWidth = doc.getStringUnitWidth(footerText) * 8 / doc.internal.scaleFactor;
    doc.text(footerText, (pageWidth - footerTextWidth) / 2, pageHeight - margin + 5); // Centered at bottom

    doc.save(`ficha-tecnica-${fichaData.identificacaoLocal.replace(/\s+/g, '_').toLowerCase() || 'geral'}.pdf`);

  } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw new Error("Não foi possível gerar o arquivo PDF.");
  }
}
