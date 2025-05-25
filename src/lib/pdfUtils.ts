
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

    const primaryBlue = [30, 60, 100]; // Darker, more professional blue
    const accentColor = [0, 150, 199]; // A vibrant cyan/blue accent
    const textColorDark = [33, 33, 33]; // Very dark gray for text
    const textColorLight = [250, 250, 250]; // Off-white for dark backgrounds
    const tableHeaderGray = [224, 224, 224]; // Light gray for table headers
    const tableRowGray = [248, 248, 248]; // Very light gray for alternate rows
    const lineColor = [189, 189, 189]; // Medium gray for lines

    const fontSizeTitle = 18;
    const fontSizeSubtitle = 14;
    const fontSizeSectionTitle = 11;
    const fontSizeBody = 10;
    const fontSizeSmall = 8;
    const fontSizeTableHead = 9;
    const fontSizeTableBody = 8;

    // Helper for checking page breaks
    const checkPageBreak = (neededHeight: number) => {
      if (yPos + neededHeight > pageHeight - margin - 15) { // Added buffer for footer
        doc.addPage();
        yPos = margin + 5; // Start a bit lower on new pages
      }
    };

    // --- Section 1: Main Header ---
    const mainHeaderHeight = 22;
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, mainHeaderHeight, 'F');

    doc.setFont("helvetica", 'bold');
    doc.setFontSize(fontSizeTitle - 2);
    doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
    const anodeText = "ANODE";
    const anodeTextDimensions = doc.getTextDimensions(anodeText);
    const anodeTextY = (mainHeaderHeight - anodeTextDimensions.h) / 2 + anodeTextDimensions.h - 2;
    doc.text(anodeText, margin, anodeTextY);

    // Placeholder for a simple bolt icon (more refined)
    const boltX = margin + anodeTextDimensions.w + 2;
    const boltY = anodeTextY - (fontSizeTitle / 2.5) + 1;
    doc.setLineWidth(1);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    const boltPoints = [
        [boltX, boltY + 2],
        [boltX + 3, boltY + 2],
        [boltX + 1, boltY + 5],
        [boltX + 4, boltY + 5],
        [boltX -1, boltY + 10],
        [boltX + 2, boltY + 6.5],
        [boltX -1, boltY + 6.5]
    ];
    doc.lines(boltPoints, 0,0, [1,1], 'S', false);


    // Company Info (Top Right)
    const companyInfoX = pageWidth - margin;
    let companyInfoCurrentY = (mainHeaderHeight - fontSizeSmall) / 2 + fontSizeSmall -1;
    const companyInfoMaxWidth = 70;

    doc.setFont("helvetica", 'normal');
    doc.setFontSize(fontSizeSmall);
    doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);

    if (fichaData.nomeEmpresa) {
      doc.text(fichaData.nomeEmpresa, companyInfoX, companyInfoCurrentY, { align: 'right', maxWidth: companyInfoMaxWidth });
      companyInfoCurrentY += 3.5;
      if (fichaData.logotipoEmpresaUrl) {
        doc.setFontSize(fontSizeSmall - 1.5);
        doc.text("(Logotipo Configurado)", companyInfoX, companyInfoCurrentY, { align: 'right', maxWidth: companyInfoMaxWidth });
      }
    } else if (fichaData.logotipoEmpresaUrl) {
        doc.setFontSize(fontSizeSmall - 1.5);
        doc.text("(Logotipo Configurado)", companyInfoX, companyInfoCurrentY + 1, { align: 'right', maxWidth: companyInfoMaxWidth });
    } else {
        doc.text("Empresa Não Configurada", companyInfoX, companyInfoCurrentY + 1, { align: 'right', maxWidth: companyInfoMaxWidth });
    }

    yPos = mainHeaderHeight + 10;

    // --- Section 2: Document Identification ---
    checkPageBreak(25);
    doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
    doc.setFont("helvetica", 'bold');
    doc.setFontSize(fontSizeSubtitle);
    const tituloFichaText = fichaData.tituloFicha || "FICHA TÉCNICA – QUADRO DE DISTRIBUIÇÃO";
    const tituloWidth = doc.getStringUnitWidth(tituloFichaText) * fontSizeSubtitle / doc.internal.scaleFactor;
    doc.text(tituloFichaText, (pageWidth - tituloWidth) / 2, yPos);
    yPos += 7;

    doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", 'normal');
    doc.setFontSize(fontSizeBody -1);
    const fieldSpacing = 4.5;
    const labelWidth = 40;

    const idDetails = [
      { label: "Local / Identificação:", value: fichaData.identificacaoLocal },
      { label: "Data da Instalação:", value: fichaData.dataInstalacao ? format(fichaData.dataInstalacao.toDate(), "dd/MM/yyyy", { locale: ptBR }) : 'N/A' },
      { label: "Responsável Técnico:", value: fichaData.responsavelTecnico },
      { label: "Versão da Ficha:", value: fichaData.versaoFicha || "v1.0" },
    ];

    idDetails.forEach(detail => {
        if (detail.value) {
            const valueTextHeight = doc.getTextDimensions(detail.value, { fontSize: fontSizeBody -1, maxWidth: contentWidth - labelWidth - 2 }).h;
            checkPageBreak(valueTextHeight + fieldSpacing);
            doc.setFont("helvetica", 'bold');
            doc.text(detail.label, margin, yPos);
            doc.setFont("helvetica", 'normal');
            doc.text(detail.value, margin + labelWidth, yPos, { maxWidth: contentWidth - labelWidth -2 });
            yPos += Math.max(valueTextHeight, 4) + (fieldSpacing / 2) ;
        }
    });
    yPos += 3;


    // --- Section 3: Circuit Distribution Table ---
    checkPageBreak(30); 
    doc.setFont("helvetica", 'bold');
    doc.setFontSize(fontSizeSectionTitle);
    doc.text("Distribuição dos Circuitos", margin, yPos);
    yPos += 5;

    const tableColumnStyles: {[key: number]: object} = {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 48 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 'auto' }, // Observações
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
        minCellHeight: 6,
        cellPadding: 1.5,
      },
      bodyStyles: {
        textColor: textColorDark,
        fontSize: fontSizeTableBody,
        cellPadding: 1.5,
        minCellHeight: 5,
        valign: 'middle',
      },
      alternateRowStyles: { fillColor: tableRowGray },
      columnStyles: tableColumnStyles,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      didDrawPage: (data) => { yPos = data.cursor?.y || yPos; checkPageBreak(0); }
    });
    yPos = (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 6 : yPos + 6;


    // --- Section 4: Technical Observations ---
    checkPageBreak(20);
    doc.setFont("helvetica", 'bold');
    doc.setFontSize(fontSizeSectionTitle);
    doc.text("Observações Técnicas", margin, yPos);
    yPos += 5;

    doc.setFont("helvetica", 'normal');
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
    yPos += drTextHeight + (fieldSpacing / 2);

    doc.text(`Acesso Online: ${fichaData.textoAcessoOnline || "Acesso aos projetos online"}`, margin, yPos);
    yPos += 6;

    // --- Section 5: QR Code & Contact ---
    const qrSectionHeight = 50;
    checkPageBreak(qrSectionHeight);
    const qrSize = 22;
    const qrSectionX = margin;
    const contactSectionX = margin + qrSize + 8;
    const contactSectionWidth = contentWidth - qrSize - 8;
    const initialQrYPos = yPos;


    doc.setFillColor(235, 235, 235);
    doc.rect(qrSectionX, initialQrYPos, qrSize, qrSize, 'F');
    doc.setFontSize(fontSizeSmall - 2);
    doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
    doc.text("QR Code", qrSectionX + qrSize / 2, initialQrYPos + qrSize / 2, { align: 'center', baseline: 'middle' });

    const linkText = fichaData.linkFichaPublica || "Link de acesso online";
    const linkTextLines = doc.splitTextToSize(linkText, qrSize + 5);
    doc.setFontSize(fontSizeSmall - 2);
    doc.text(linkTextLines, qrSectionX + qrSize / 2, initialQrYPos + qrSize + 3, { align: 'center' });

    // Contact & Signature (right of QR)
    let contactY = initialQrYPos;
    doc.setFont("helvetica", 'bold');
    doc.setFontSize(fontSizeBody - 1.5);
    doc.text("Responsável pela Execução:", contactSectionX, contactY);
    contactY += fieldSpacing;

    doc.setFont("helvetica", 'normal');
    doc.setFontSize(fontSizeSmall);
    doc.text(fichaData.nomeEletricista, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 3.5;
    doc.setFontSize(fontSizeSmall -1);
    doc.text("Téc. Eletricista / Responsável", contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 4;

    // Signature
    const signatureMaxWidth = 50;
    const signatureMaxHeight = 15;
    if (fichaData.assinaturaEletricistaUrl && fichaData.assinaturaEletricistaUrl.startsWith('data:image/')) {
        try {
            const imgProps = doc.getImageProperties(fichaData.assinaturaEletricistaUrl);
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            if (imgWidth / imgHeight > signatureMaxWidth / signatureMaxHeight) {
                if (imgWidth > signatureMaxWidth) {
                    imgHeight = (signatureMaxWidth / imgWidth) * imgHeight;
                    imgWidth = signatureMaxWidth;
                }
            } else {
                if (imgHeight > signatureMaxHeight) {
                    imgWidth = (signatureMaxHeight / imgHeight) * imgWidth;
                    imgHeight = signatureMaxHeight;
                }
            }
             // Ensure there's enough space for signature image
            checkPageBreak(imgHeight + 3);
            if (yPos > contactY) contactY = yPos; // If page break happened, update contactY

            doc.addImage(fichaData.assinaturaEletricistaUrl, '', contactSectionX, contactY, imgWidth, imgHeight);
            contactY += imgHeight + 2;
        } catch (e) {
            console.error("Error adding signature image to PDF:", e);
            doc.text("Assinatura: (Erro ao carregar imagem)", contactSectionX, contactY, {maxWidth: contactSectionWidth});
            contactY += fieldSpacing;
        }
    } else if (fichaData.assinaturaEletricistaUrl) { // It's a URL, not data URI
        doc.text(`Assinatura: (Digitalmente Configurada)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        contactY += fieldSpacing;
    } else { // No signature
        doc.text(`Assinatura:`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
        doc.setLineWidth(0.2);
        doc.line(contactSectionX + 18, contactY + 1, contactSectionX + 60, contactY + 1);
        contactY += fieldSpacing;
    }


    doc.setFontSize(fontSizeSmall);
    const wppText = `[WPP] ${fichaData.contatoEletricista}`;
    doc.text(wppText, contactSectionX, contactY, {maxWidth: contactSectionWidth});
    contactY += 3.5;

    if (fichaData.nomeEmpresa) { // Assuming social media links would be associated with the company
        doc.text(`[Insta] @anode.lite (exemplo)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        contactY += 3.5;
        doc.text(`[FB] /anode.lite (exemplo)`, contactSectionX, contactY, {maxWidth: contactSectionWidth});
        contactY += 3.5;
    }

    // Adjust yPos to be below the taller of QR block or Contact block before Portaria
    const qrBlockBottom = initialQrYPos + qrSize + 3 + (linkTextLines.length * (fontSizeSmall - 2) * 0.35) + 3;
    const contactBlockBottom = contactY;
    yPos = Math.max(qrBlockBottom, contactBlockBottom);


    // --- Section 6: Portaria (If present) ---
    if (fichaData.ramalPortaria) {
      checkPageBreak(12);
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

      doc.setFont("helvetica", 'bold');
      doc.setFontSize(fontSizeBody - 1.5);
      doc.text("Portaria / Zeladoria:", margin, yPos);
      doc.setFont("helvetica", 'normal');
      doc.text(fichaData.ramalPortaria, margin + 35, yPos);
      yPos += 5;
    }

    // --- Footer ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(fontSizeSmall - 2.5);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

        const footerText = `Ficha técnica gerada por ANODE Lite - ${format(fichaData.dataCriacao?.toDate() || new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
        const footerTextWidth = doc.getStringUnitWidth(footerText) * (fontSizeSmall - 2.5) / doc.internal.scaleFactor;
        doc.text(footerText, (pageWidth - footerTextWidth) / 2, pageHeight - margin / 2);

        const pageNumText = `Página ${i} de ${totalPages}`;
        const pageNumTextWidth = doc.getStringUnitWidth(pageNumText) * (fontSizeSmall - 2.5) / doc.internal.scaleFactor;
        doc.text(pageNumText, pageWidth - margin - pageNumTextWidth , pageHeight - margin / 2);
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
