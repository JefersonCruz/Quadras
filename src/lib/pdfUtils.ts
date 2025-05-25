
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

    // Margins, Colors, Font Sizes
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    const primaryBlue = [25, 75, 125];
    const accentColor = [255, 152, 0];
    const textColorDark = [50, 50, 50];
    const textColorLight = [255, 255, 255];
    const tableHeaderGray = [220, 220, 220];
    const tableRowGray = [245, 245, 245];
    const lineColor = [200, 200, 200];

    const fontSizeTitle = 18;
    const fontSizeSubtitle = 14;
    const fontSizeBody = 10;
    const fontSizeSmall = 8;
    const fontSizeTableHead = 9;
    const fontSizeTableBody = 8;

    // --- Section 1: Main Header ---
    const mainHeaderHeight = 25; // Reduced height slightly
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, mainHeaderHeight, 'F');

    // "ANODE" Text
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeTitle);
    doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
    const anodeText = "ANODE";
    const anodeTextY = mainHeaderHeight / 2 + (fontSizeTitle / 3); // Center vertically
    doc.text(anodeText, margin, anodeTextY);

    // Bolt Icon Placeholder (simplified)
    const boltX = margin + doc.getStringUnitWidth(anodeText) * fontSizeTitle / doc.internal.scaleFactor + 3;
    const boltY = anodeTextY - (fontSizeTitle / 2.5);
    doc.setLineWidth(1.5);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.line(boltX, boltY, boltX + 2, boltY + 5);
    doc.line(boltX + 2, boltY + 5, boltX - 2, boltY + 5);
    doc.line(boltX - 2, boltY + 5, boltX, boltY);


    // Company Info (Top Right)
    const companyInfoX = pageWidth - margin;
    let companyInfoCurrentY = mainHeaderHeight / 2 - 2 ; // Start a bit higher
    const companyInfoMaxWidth = 60;

    doc.setFontSize(fontSizeSmall);
    doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);

    if (fichaData.nomeEmpresa) {
      doc.text(fichaData.nomeEmpresa, companyInfoX, companyInfoCurrentY, { align: 'right', maxWidth: companyInfoMaxWidth });
      companyInfoCurrentY += 4;
      if (fichaData.logotipoEmpresaUrl) {
        doc.setFontSize(fontSizeSmall -1);
        doc.text("(Logotipo Configurado)", companyInfoX, companyInfoCurrentY, { align: 'right', maxWidth: companyInfoMaxWidth });
      }
    } else if (fichaData.logotipoEmpresaUrl) {
        doc.text("(Logotipo Configurado)", companyInfoX, companyInfoCurrentY + 2, { align: 'right', maxWidth: companyInfoMaxWidth });
    } else {
        doc.text("Empresa", companyInfoX, companyInfoCurrentY + 2, { align: 'right', maxWidth: companyInfoMaxWidth }); 
    }


    yPos = mainHeaderHeight + 12; // Adjusted starting Y

    // Helper for checking page breaks
    const checkPageBreak = (neededHeight: number) => {
      if (yPos + neededHeight > pageHeight - margin - 10) { // Added buffer for footer
        doc.addPage();
        yPos = margin;
      }
    };

    // --- Section 2: Document Identification ---
    checkPageBreak(30);
    doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeSubtitle);
    const tituloFichaText = fichaData.tituloFicha || "FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO";
    const tituloWidth = doc.getStringUnitWidth(tituloFichaText) * fontSizeSubtitle / doc.internal.scaleFactor;
    doc.text(tituloFichaText, (pageWidth - tituloWidth) / 2, yPos);
    yPos += 8; // Reduced space

    doc.setFont(undefined, 'normal');
    doc.setFontSize(fontSizeBody);
    const fieldSpacing = 5; // Reduced spacing

    let idDetails = [
      { label: "Local / Identificação:", value: fichaData.identificacaoLocal },
      { label: "Data da Instalação:", value: fichaData.dataInstalacao ? format(fichaData.dataInstalacao.toDate(), "dd/MM/yyyy", { locale: ptBR }) : 'N/A' },
      { label: "Responsável Técnico:", value: fichaData.responsavelTecnico },
      { label: "Versão da Ficha:", value: fichaData.versaoFicha || "v1.0" },
    ];

    idDetails.forEach(detail => {
        if (detail.value) {
            const valueTextHeight = doc.getTextDimensions(detail.value, { fontSize: fontSizeBody, maxWidth: contentWidth - margin - 40 }).h;
            checkPageBreak(valueTextHeight + fieldSpacing);
            doc.setFont(undefined, 'bold');
            doc.text(detail.label, margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(detail.value, margin + 42, yPos, { maxWidth: contentWidth - margin - 40 });
            yPos += valueTextHeight + (fieldSpacing / 2) ;
        }
    });
    yPos += 5; // Extra space before table


    // --- Section 3: Circuit Distribution Table ---
    checkPageBreak(40); // Initial check for table header
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeBody);
    doc.text("Distribuição dos Circuitos", margin, yPos);
    yPos += 6;

    const tableColumnStyles: {[key: number]: object} = {
      0: { cellWidth: 12, halign: 'center' }, 
      1: { cellWidth: 50 }, 
      2: { cellWidth: 35, halign: 'center' }, 
      3: { cellWidth: 25, halign: 'center' }, 
      4: { cellWidth: 'auto' },
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
        halign: 'center',
        minCellHeight: 7,
      },
      bodyStyles: { 
        textColor: textColorDark, 
        fontSize: fontSizeTableBody, 
        cellPadding: 1.5,
        minCellHeight: 6,
      },
      alternateRowStyles: { fillColor: tableRowGray },
      columnStyles: tableColumnStyles,
      margin: { left: margin, right: margin },
      tableWidth: 'auto', // Ensures table uses contentWidth
      didDrawPage: (data) => { yPos = data.cursor?.y || yPos; } // Update yPos after each page draw
    });
    yPos = (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 7 : yPos + 7;


    // --- Section 4: Technical Observations ---
    checkPageBreak(25); 
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeBody);
    doc.text("Observações Técnicas", margin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(fontSizeSmall);
    doc.text(`Referência Normativa: ${fichaData.observacaoNBR || "Conforme NBR 5410"}`, margin, yPos);
    yPos += fieldSpacing;

    let obsDRText = `Dispositivo DR: ${fichaData.observacaoDR ? 'Instalado' : 'Não instalado'}.`;
    if (fichaData.descricaoDROpcional) {
      obsDRText += ` Detalhes: ${fichaData.descricaoDROpcional}`;
    }
    const drTextHeight = doc.getTextDimensions(obsDRText, { fontSize: fontSizeSmall, maxWidth: contentWidth }).h;
    checkPageBreak(drTextHeight + fieldSpacing);
    doc.text(obsDRText, margin, yPos, { maxWidth: contentWidth });
    yPos += drTextHeight + (fieldSpacing /2);
    
    doc.text(`Acesso Online: ${fichaData.textoAcessoOnline || "Acesso aos projetos online"}`, margin, yPos);
    yPos += 7; // Extra space

    // --- Section 5: QR Code & Contact ---
    const qrSectionHeight = 45; // Approximate height for this section
    checkPageBreak(qrSectionHeight);
    const qrSize = 25; // Reduced QR size
    const qrSectionX = margin;
    const contactSectionX = margin + qrSize + 10; 
    const contactSectionWidth = contentWidth - qrSize - 10;

    // QR Code Placeholder
    const qrYPos = yPos;
    doc.setFillColor(230, 230, 230); 
    doc.rect(qrSectionX, qrYPos, qrSize, qrSize, 'F');
    doc.setFontSize(fontSizeSmall - 1);
    doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
    doc.text("QR Code", qrSectionX + qrSize / 2, qrYPos + qrSize / 2, { align: 'center', baseline: 'middle' });
    
    const linkText = fichaData.linkFichaPublica || "Link de acesso online";
    const linkTextLines = doc.splitTextToSize(linkText, qrSize + 5); // Wrap text
    doc.text(linkTextLines, qrSectionX + qrSize / 2, qrYPos + qrSize + 3, { align: 'center' });


    // Contact & Signature (right of QR)
    let contactY = qrYPos;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(fontSizeBody -1); // Slightly smaller
    doc.text("Contato Técnico:", contactSectionX, contactY);
    contactY += fieldSpacing;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(fontSizeSmall);
    doc.text(fichaData.nomeEletricista, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 4;
    doc.setFontSize(fontSizeSmall -1);
    doc.text("Téc. Eletricista / Responsável", contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 4;
    
    if (fichaData.assinaturaEletricistaUrl) {
        doc.text(`Assinatura: (Digitalmente Configurada)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    } else {
        doc.text(`Assinatura:`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
        doc.setLineWidth(0.2);
        doc.line(contactSectionX + 18, contactY - 1, contactSectionX + 60, contactY -1); 
    }
    contactY += fieldSpacing;

    doc.setFontSize(fontSizeSmall);
    doc.text(`[WPP] ${fichaData.contatoEletricista}`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 4;
    
    if (fichaData.nomeEmpresa) {
        doc.text(`[Insta] @anode.lite (exemplo)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        contactY += 4;
        doc.text(`[FB] /anode.lite (exemplo)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    }

    // --- Section 6: Portaria (If present) ---
    // Position below the taller of QR block or Contact block
    const qrBlockBottom = qrYPos + qrSize + 3 + (linkTextLines.length * (fontSizeSmall -1) * 0.35) + 5; // Approximate height of QR block
    const contactBlockBottom = contactY + 5;
    yPos = Math.max(qrBlockBottom, contactBlockBottom);
    
    checkPageBreak(15);

    if (fichaData.ramalPortaria) {
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos); 
      yPos += 4;
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(fontSizeBody-1);
      doc.text("Portaria / Zeladoria:", margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(fichaData.ramalPortaria, margin + 40, yPos);
      yPos += 6;
    }


    // --- Section 7: Footer ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(fontSizeSmall - 2);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        
        const footerText = `Ficha técnica gerada por ANODE Lite - ${format(fichaData.dataCriacao?.toDate() || new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
        const footerTextWidth = doc.getStringUnitWidth(footerText) * (fontSizeSmall -2) / doc.internal.scaleFactor;
        doc.text(footerText, (pageWidth - footerTextWidth) / 2, pageHeight - margin / 1.5);
        
        const pageNumText = `Página ${i} de ${totalPages}`;
        doc.text(pageNumText, pageWidth - margin - (doc.getStringUnitWidth(pageNumText) * (fontSizeSmall -2) / doc.internal.scaleFactor) , pageHeight - margin/1.5);
    }


    // --- Save PDF ---
    const safeFileName = (fichaData.identificacaoLocal || "ficha_tecnica")
      .replace(/[^a-z0-9_.\-\s]/gi, '_') 
      .replace(/\s+/g, '_') 
      .toLowerCase();
    doc.save(`ficha-tecnica_${safeFileName}.pdf`);

  } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw new Error("Não foi possível gerar o arquivo PDF. Verifique o console para detalhes.");
  }
}

    