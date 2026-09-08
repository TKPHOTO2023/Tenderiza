import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, degrees } from "pdf-lib";

const PAGE_MARGIN = 50;
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4 in points

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawWatermark(page: PDFPage, font: PDFFont) {
  const { width, height } = page.getSize();
  page.drawText("DRAFT — REQUIRES HUMAN REVIEW", {
    x: width / 2 - 200,
    y: height / 2,
    size: 26,
    font,
    color: rgb(0.85, 0.15, 0.15),
    rotate: degrees(35),
    opacity: 0.3,
  });
  page.drawText("DRAFT — Tenderiza generated — not for submission as-is", {
    x: PAGE_MARGIN,
    y: height - 25,
    size: 8,
    font,
    color: rgb(0.6, 0.1, 0.1),
  });
}

export interface DraftPdfSection {
  heading: string;
  body: string; // may contain \n for line breaks
}

/**
 * Builds a simple, clearly-watermarked multi-page PDF from a title and a
 * list of heading/body sections — used for both the generated-equivalent
 * compliance document and the technical proposal draft, so both come out of
 * the same watermarking/pagination path.
 */
export async function buildDraftPdf(title: string, sections: DraftPdfSection[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_SIZE[0] - PAGE_MARGIN * 2;
  let page = pdfDoc.addPage(PAGE_SIZE);
  let y = PAGE_SIZE[1] - PAGE_MARGIN;

  function newPage() {
    drawWatermark(page, boldFont);
    page = pdfDoc.addPage(PAGE_SIZE);
    y = PAGE_SIZE[1] - PAGE_MARGIN;
  }

  function ensureSpace(lineHeight: number) {
    if (y - lineHeight < PAGE_MARGIN) newPage();
  }

  // Title
  ensureSpace(30);
  page.drawText(title, { x: PAGE_MARGIN, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  y -= 30;

  for (const section of sections) {
    ensureSpace(22);
    page.drawText(section.heading, { x: PAGE_MARGIN, y, size: 13, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 20;

    const lines = wrapText(section.body, regularFont, 10.5, contentWidth);
    for (const line of lines) {
      ensureSpace(15);
      page.drawText(line, { x: PAGE_MARGIN, y, size: 10.5, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
      y -= 15;
    }
    y -= 10;
  }

  drawWatermark(page, boldFont); // last page

  return Buffer.from(await pdfDoc.save());
}
