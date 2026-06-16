import { jsPDF } from "jspdf";

interface PdfOptions {
  title?: string;
  subtitle?: string;
  text: string;
  author?: string;
  date?: string;
  time?: string;
  profileImage?: string;  // URL of image
  footer?: string;
  watermark?: string;
  color?: string;          // Primary color (hex)
  logo?: string;           // Logo URL
  pageNumbers?: boolean;
  borderColor?: string;
}

export async function generatePdf(options: PdfOptions): Promise<{ success: boolean; base64?: string; error?: string }> {
  try {
    const {
      title = "Document",
      subtitle = "",
      text = "",
      author = "",
      date = new Date().toLocaleDateString(),
      time = new Date().toLocaleTimeString(),
      profileImage = "",
      footer = "",
      watermark = "",
      color = "#7C3AED",
      logo = "",
      pageNumbers = true,
      borderColor = "#E5E7EB",
    } = options;

    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    
    // Convert hex to RGB for jsPDF
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : { r: 124, g: 58, b: 237 };
    };
    const primaryColor = hexToRgb(color);
    const borderRgb = hexToRgb(borderColor);

    // Helper to add watermark on every page
    const addWatermark = () => {
      if (!watermark) return;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.03 }));
      doc.setFontSize(60);
      doc.setTextColor(128, 128, 128);
      doc.text(watermark, pageWidth / 2, pageHeight / 2, { align: "center", angle: -45 });
      doc.restoreGraphicsState();
    };

    // Helper for header on new pages
    const addHeader = (pageNum: number) => {
      if (pageNum > 1) {
        // Thin line at top
        doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
        doc.setLineWidth(0.5);
        doc.line(margin, 15, pageWidth - margin, 15);
      }
    };

    // Helper for footer
    const addFooter = (pageNum: number, total: number) => {
      const footerY = pageHeight - 12;
      doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      if (footer) {
        doc.text(footer, margin, footerY + 2);
      }
      
      if (pageNumbers) {
        doc.text(`Page ${pageNum} of ${total}`, pageWidth - margin, footerY + 2, { align: "right" });
      }
      
      if (author && pageNum === 1) {
        doc.text(`Created by: ${author}`, margin, footerY + 2);
      }
    };

    // ─── LOGO ───────────────────────────────────────
    if (logo) {
      try {
        const response = await fetch(logo);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64 = buffer.toString('base64');
          const mime = response.headers.get('content-type') || 'image/png';
          doc.addImage(`data:${mime};base64,${base64}`, 'PNG', margin, yPos, 20, 20);
        }
      } catch {}
    }

    // ─── PROFILE IMAGE ──────────────────────────────
    if (profileImage) {
      try {
        const response = await fetch(profileImage);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64 = buffer.toString('base64');
          const mime = response.headers.get('content-type') || 'image/png';
          const imgX = pageWidth - margin - 30;
          doc.addImage(`data:${mime};base64,${base64}`, 'PNG', imgX, yPos, 30, 30);
          
          // Circle clip for profile
          doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
          doc.setLineWidth(1);
          doc.circle(imgX + 15, yPos + 15, 16);
        }
      } catch {}
    }

    // ─── TITLE ──────────────────────────────────────
    doc.setFontSize(24);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos + 10);
    yPos += 28;

    // ─── SUBTITLE ───────────────────────────────────
    if (subtitle) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text(subtitle, margin, yPos);
      yPos += 18;
    }

    // ─── DATE & TIME ────────────────────────────────
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    const dateTimeStr = [date, time].filter(Boolean).join(" • ");
    if (dateTimeStr) {
      doc.text(dateTimeStr, margin, yPos);
      yPos += 10;
    }

    // ─── COLOR BAR ──────────────────────────────────
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(margin, yPos, contentWidth, 3, "F");
    yPos += 12;

    // ─── MAIN TEXT ──────────────────────────────────
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    
    const paragraphs = text.split("\n");
    for (const paragraph of paragraphs) {
      // Check if it's a heading
      if (paragraph.startsWith("# ")) {
        doc.setFontSize(16);
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.setFont("helvetica", "bold");
        doc.text(paragraph.replace("# ", ""), margin, yPos);
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        yPos += 14;
      } else if (paragraph.startsWith("## ")) {
        doc.setFontSize(14);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "bold");
        doc.text(paragraph.replace("## ", ""), margin, yPos);
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        yPos += 12;
      } else if (paragraph.trim()) {
        const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);
        
        // Check if we need a new page
        if (yPos + (lines.length * 7) > pageHeight - 30) {
          addFooter(1, 1); // Will be replaced
          doc.addPage();
          addWatermark();
          yPos = 25;
        }
        
        doc.text(lines, margin, yPos);
        yPos += lines.length * 7 + 5;
      } else {
        yPos += 8; // Blank line spacing
      }
    }

    // ─── WATERMARK ──────────────────────────────────
    addWatermark();

    // ─── FOOTERS ON ALL PAGES ───────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    const base64 = Buffer.from(doc.output('arraybuffer')).toString('base64');
    return { success: true, base64, pages: totalPages };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── SIMPLE INVOICE PDF ─────────────────────────────
export async function generateInvoice(options: {
  companyName: string;
  companyLogo?: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  from: { name: string; email?: string; phone?: string; address?: string };
  to: { name: string; email?: string; phone?: string; address?: string };
  items: { description: string; quantity: number; unitPrice: number }[];
  currency?: string;
  notes?: string;
  color?: string;
}) {
  try {
    const {
      companyName, invoiceNumber, date, dueDate, from, to, items,
      currency = "KES", notes = "", color = "#7C3AED",
    } = options;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    const primaryColor = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)!;
    const rgb = { r: parseInt(primaryColor[1], 16), g: parseInt(primaryColor[2], 16), b: parseInt(primaryColor[3], 16) };

    // Header
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(0, 0, pageWidth, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", margin, 35);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`#${invoiceNumber}`, margin, 48);
    doc.text(date, margin, 55);
    if (dueDate) doc.text(`Due: ${dueDate}`, margin, 62);
    doc.setFontSize(20);
    doc.text(companyName, pageWidth - margin, 35, { align: "right" });

    let y = 95;

    // From / To
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FROM:", margin, y);
    doc.text("TO:", pageWidth / 2 + 10, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`${from.name}\n${from.email || ""}\n${from.phone || ""}\n${from.address || ""}`, margin, y);
    doc.text(`${to.name}\n${to.email || ""}\n${to.phone || ""}\n${to.address || ""}`, pageWidth / 2 + 10, y);
    y += 35;

    // Table header
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.rect(margin, y, contentWidth, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", margin + 5, y + 7);
    doc.text("QTY", 110, y + 7, { align: "center" });
    doc.text("PRICE", 140, y + 7, { align: "center" });
    doc.text("TOTAL", pageWidth - margin - 5, y + 7, { align: "right" });
    y += 12;

    // Items
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    let subtotal = 0;
    for (const item of items) {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      doc.text(item.description, margin + 5, y + 5);
      doc.text(item.quantity.toString(), 110, y + 5, { align: "center" });
      doc.text(`${currency} ${item.unitPrice.toLocaleString()}`, 140, y + 5, { align: "center" });
      doc.text(`${currency} ${total.toLocaleString()}`, pageWidth - margin - 5, y + 5, { align: "right" });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);
      y += 14;
    }

    // Total
    y += 5;
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(`TOTAL: ${currency} ${subtotal.toLocaleString()}`, pageWidth - margin, y, { align: "right" });

    if (notes) {
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text("Notes:", margin, y);
      doc.text(notes, margin, y + 6);
    }

    const base64 = Buffer.from(doc.output('arraybuffer')).toString('base64');
    return { success: true, base64 };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
