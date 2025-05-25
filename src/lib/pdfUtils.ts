// src/lib/pdfUtils.ts
'use client';

import type { FichaTecnica } from "@/types/firestore";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export async function generateTechnicalSheetPdf(fichaData: FichaTecnica): Promise<void> {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 0;

    // Margins and Content Width
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Colors (approximations from the model image)
    const primaryBlue = [25, 75, 125]; // Dark blue for header
    const accentColor = [255, 152, 0]; // Orange/Yellow for "bolt" and highlights
    const textColorDark = [50, 50, 50]; // Dark grey for text
    const textColorLight = [255, 255, 255]; // White for text on dark background
    const tableHeaderGray = [220, 220, 220]; // Light gray for table headers
    const tableRowGray = [245, 245, 245]; // Lighter gray for alternate table rows
    const lineColor = [200, 200, 200]; // Light grey for separator lines

    // Font Sizes
    const fontSizeTitle = 18;
    const fontSizeSubtitle = 14;
    const fontSizeBody = 10;
    const fontSizeSmall = 8;
    const fontSizeTableHead = 9;
    const fontSizeTableBody = 8;

    // --- Section 1: Main Header ---
    const mainHeaderHeight = 30;
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, mainHeaderHeight, 'F');

    // "ENERGY" Text & Bolt Icon Placeholder
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeTitle);
    doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
    const energyText = "ANODE"; // Placeholder for the stylized "ENERGY"
    const energyTextWidth = doc.getStringUnitWidth(energyText) * fontSizeTitle / doc.internal.scaleFactor;
    doc.text(energyText, margin + 5, mainHeaderHeight / 2 + 5);

    // Simple Bolt Placeholder (e.g., a star or multiple lines)
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    // Using a simple filled circle as a placeholder for the bolt for now
    // doc.circle(margin + energyTextWidth + 15, mainHeaderHeight / 2 + 3, 3, 'F');
    // A more "bolt-like" placeholder:
    const boltX = margin + energyTextWidth + 15;
    const boltY = mainHeaderHeight / 2 - 2;
    doc.setLineWidth(1);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.line(boltX - 2, boltY + 2, boltX, boltY -2);
    doc.line(boltX, boltY -2, boltX, boltY +3);
    doc.line(boltX, boltY + 3, boltX + 2, boltY - 1);


    // Company Logo / Name (Top Right)
    if (fichaData.logotipoEmpresaUrl) {
      // Placeholder for actual image rendering
      doc.setFontSize(fontSizeSmall);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text("Logo", pageWidth - margin - 20, mainHeaderHeight / 2 - 2, { align: 'right' });
      doc.text(fichaData.nomeEmpresa || "Empresa", pageWidth - margin - 20, mainHeaderHeight / 2 + 4, { align: 'right', maxWidth: 40 });
    } else if (fichaData.nomeEmpresa) {
      doc.setFontSize(fontSizeSmall);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text(fichaData.nomeEmpresa, pageWidth - margin, mainHeaderHeight / 2 + 3, { align: 'right', maxWidth: 60 });
    }

    yPos = mainHeaderHeight + 15;

    // --- Section 2: Document Identification ---
    doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeSubtitle);
    const tituloFichaText = fichaData.tituloFicha || "FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO";
    const tituloWidth = doc.getStringUnitWidth(tituloFichaText) * fontSizeSubtitle / doc.internal.scaleFactor;
    doc.text(tituloFichaText, (pageWidth - tituloWidth) / 2, yPos);
    yPos += 10;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(fontSizeBody);
    const fieldSpacing = 6;
    const col1X = margin;
    const col2X = pageWidth / 2;

    doc.text(`Local / Identificação:`, col1X, yPos);
    doc.text(fichaData.identificacaoLocal, col1X + 45, yPos, {maxWidth: contentWidth - 45 - margin});
    yPos += doc.getTextDimensions(fichaData.identificacaoLocal, { fontSize: fontSizeBody, maxWidth: contentWidth - 45 - margin }).h + (fieldSpacing/2);


    doc.text(`Data da Instalação:`, col1X, yPos);
    doc.text(fichaData.dataInstalacao ? format(fichaData.dataInstalacao.toDate(), "dd/MM/yyyy", { locale: ptBR }) : 'N/A', col1X + 45, yPos);
    yPos += fieldSpacing;

    doc.text(`Responsável Técnico:`, col1X, yPos);
    doc.text(fichaData.responsavelTecnico, col1X + 45, yPos, {maxWidth: contentWidth - 45 - margin});
    yPos += fieldSpacing;
    
    doc.text(`Versão da Ficha:`, col1X, yPos);
    doc.text(fichaData.versaoFicha || "v1.0", col1X + 45, yPos);
    yPos += 10;

    // --- Section 3: Circuit Distribution Table ---
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeBody);
    doc.text("Distribuição dos Circuitos", margin, yPos);
    yPos += 7;

    const tableColumnStyles: {[key: number]: object} = {
      0: { cellWidth: 15, halign: 'center' }, // Nº
      1: { cellWidth: 50 }, // Circuito
      2: { cellWidth: 35 }, // Disjuntor
      3: { cellWidth: 25, halign: 'center' }, // Cabo
      4: { cellWidth: 'auto' },// Observações
    };

    const tableData = fichaData.circuitos.map((circ, index) => [
      (index + 1).toString(),
      circ.nome || "-",
      circ.disjuntor || "-",
      circ.caboMM || "-",
      circ.observacoes || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nº', 'Circuito', 'Disjuntor', 'Cabo (mm²)', 'Observações']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: tableHeaderGray, 
        textColor: textColorDark, 
        fontStyle: 'bold', 
        fontSize: fontSizeTableHead,
        halign: 'center'
      },
      bodyStyles: { 
        textColor: textColorDark, 
        fontSize: fontSizeTableBody, 
        cellPadding: 1.5,
        minCellHeight: 6
      },
      alternateRowStyles: { fillColor: tableRowGray },
      columnStyles: tableColumnStyles,
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      didDrawPage: (data) => { yPos = data.cursor?.y || yPos; }
    });
    yPos = (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 8 : yPos + 10;


    // --- Section 4: Technical Observations ---
    const checkPageBreak = (neededHeight: number) => {
      if (yPos + neededHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };
    checkPageBreak(30); 
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeBody);
    doc.text("Observações Técnicas", margin, yPos);
    yPos += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(fontSizeSmall);
    doc.text(`Referência Normativa: ${fichaData.observacaoNBR || "Conforme NBR 5410"}`, margin, yPos);
    yPos += fieldSpacing;

    let obsDRText = `Dispositivo DR: ${fichaData.observacaoDR ? 'Instalado' : 'Não instalado'}.`;
    if (fichaData.descricaoDROpcional) {
      obsDRText += ` Detalhes: ${fichaData.descricaoDROpcional}`;
    }
    doc.text(obsDRText, margin, yPos, { maxWidth: contentWidth });
    yPos += doc.getTextDimensions(obsDRText, { fontSize: fontSizeSmall, maxWidth: contentWidth }).h + fieldSpacing;
    
    doc.text(`Acesso Online: ${fichaData.textoAcessoOnline || "Acesso aos projetos online"}`, margin, yPos);
    yPos += 8;


    // --- Section 5: QR Code & Contact ---
    checkPageBreak(50);
    const qrSize = 30;
    const qrSectionX = margin;
    const contactSectionX = margin + qrSize + 15; // X for contact info, to the right of QR
    const contactSectionWidth = contentWidth - qrSize - 15;


    // QR Code Placeholder
    doc.setFillColor(230, 230, 230); // Light grey for placeholder
    doc.rect(qrSectionX, yPos, qrSize, qrSize, 'F');
    doc.setFontSize(fontSizeSmall);
    doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
    doc.text("QR Code", qrSectionX + qrSize / 2, yPos + qrSize / 2, { align: 'center', baseline: 'middle' });
    doc.setFontSize(fontSizeSmall -1);
    doc.text(fichaData.linkFichaPublica || "Link para acesso online", qrSectionX + qrSize/2, yPos + qrSize + 4, {align: 'center', maxWidth: qrSize + 10})


    // Contact & Signature (right of QR)
    let contactY = yPos;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeBody);
    doc.text("Contato Técnico:", contactSectionX, contactY);
    contactY += fieldSpacing;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(fontSizeSmall);
    doc.text(fichaData.nomeEletricista, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 5;
    doc.text("Téc. Eletricista / Responsável", contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 5;
    
    // Signature Placeholder
    if (fichaData.assinaturaEletricistaUrl) {
        doc.text(`Assinatura: (Digital)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    } else {
        doc.text(`Assinatura:`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
        doc.line(contactSectionX + 20, contactY - 1, contactSectionX + 70, contactY -1); // Signature line
    }
    contactY += fieldSpacing;

    // Contact Details with Text "Icons"
    doc.text(`[WPP] ${fichaData.contatoEletricista}`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 5;
    
    // Social Media Placeholders (if company name exists)
    if (fichaData.nomeEmpresa) {
        // Assuming these would come from an enriched fichaData or a related company document
        doc.text(`[Insta] @anode.lite (exemplo)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        contactY += 5;
        doc.text(`[FB] /anode.lite (exemplo)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        contactY += 5;
    }


    // --- Section 6: Portaria (If present) ---
    yPos = Math.max(yPos + qrSize + 10, contactY + 5); // Position below the taller of QR or Contact block
    checkPageBreak(20);

    if (fichaData.ramalPortaria) {
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
      yPos += 5;
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(fontSizeBody);
      doc.text("Portaria / Zeladoria:", margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(fichaData.ramalPortaria, margin + 45, yPos);
      yPos += 7;
    }


    // --- Section 7: Footer ---
    // Position footer at the bottom of the last page
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(fontSizeSmall - 1);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        
        const footerText = `Ficha técnica gerada por ANODE Lite - ${format(fichaData.dataCriacao?.toDate() || new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
        const footerTextWidth = doc.getStringUnitWidth(footerText) * (fontSizeSmall -1) / doc.internal.scaleFactor;
        doc.text(footerText, (pageWidth - footerTextWidth) / 2, pageHeight - margin / 2);
        
        const pageNumText = `Página ${i} de ${totalPages}`;
        doc.text(pageNumText, pageWidth - margin - (doc.getStringUnitWidth(pageNumText) * (fontSizeSmall -1) / doc.internal.scaleFactor) , pageHeight - margin/2);
    }


    // --- Save PDF ---
    const safeFileName = (fichaData.identificacaoLocal || "ficha_tecnica")
      .replace(/[^a-z0-9_.\-\s]/gi, '_') // Replace non-alphanumeric (except some safe chars) with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .toLowerCase();
    doc.save(`ficha-tecnica_${safeFileName}.pdf`);

  } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      // Consider using a toast notification for the user here if this util is used directly in a component
      throw new Error("Não foi possível gerar o arquivo PDF. Verifique o console para detalhes.");
  }
}

// Helper function to draw a rounded rectangle (if needed, jsPDF doesn't have it built-in easily)
// function roundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'DF') {
//   doc.roundedRect(x, y, w, h, r, r, style); // jsPDF has roundedRect
// }