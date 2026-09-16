import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb } from "pdf-lib";
import type { Company } from "@prisma/client";
import { storage } from "@/lib/storage";

const DEFAULT_PRIMARY = "#053B2C";
const DEFAULT_ACCENT = "#FFB612";

export interface Letterhead {
  logo: PDFImage | null;
  primary: ReturnType<typeof rgb>;
  accent: ReturnType<typeof rgb>;
  lines: string[];
  companyName: string;
}

function hexToRgb(hex: string | null, fallback: string) {
  const value = /^#[0-9a-f]{6}$/i.test(hex ?? "") ? (hex as string) : fallback;
  const n = parseInt(value.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/**
 * Loads the company's brand kit into something pdf-lib can draw. Only ever
 * applied to documents Tenderiza generates itself — a procuring entity's own
 * supplied form is filled, never restyled.
 */
export async function loadLetterhead(pdfDoc: PDFDocument, company: Company): Promise<Letterhead> {
  let logo: PDFImage | null = null;

  if (company.logoUrl) {
    const bytes = await storage.read(company.logoUrl);
    if (bytes) {
      try {
        // PNG magic number: 89 50 4E 47
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        logo = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      } catch {
        logo = null; // an unreadable logo must never fail the whole document
      }
    }
  }

  const lines = [
    company.companyName ?? "",
    company.registrationNumber ? `Reg. ${company.registrationNumber}` : "",
    company.vatNumber ? `VAT ${company.vatNumber}` : "",
    [company.addressLine1, company.addressLine2, company.city, company.postalCode].filter(Boolean).join(", "),
    [company.contactPhone, company.contactEmail].filter(Boolean).join(" · "),
    company.website ?? "",
  ].filter((line) => line.trim().length > 0);

  return {
    logo,
    primary: hexToRgb(company.brandPrimaryColor, DEFAULT_PRIMARY),
    accent: hexToRgb(company.brandAccentColor, DEFAULT_ACCENT),
    lines,
    companyName: company.companyName ?? "",
  };
}

/**
 * Draws the letterhead at the top of a page and returns the y position
 * content should start from.
 */
export function drawLetterhead(
  page: PDFPage,
  letterhead: Letterhead,
  fonts: { regular: PDFFont; bold: PDFFont },
  margin: number
): number {
  const { width, height } = page.getSize();
  let y = height - margin;

  // Right-hand details block
  const detailSize = 7.5;
  let detailY = y - 2;
  for (const [i, line] of letterhead.lines.entries()) {
    const font = i === 0 ? fonts.bold : fonts.regular;
    const textWidth = font.widthOfTextAtSize(line, detailSize);
    page.drawText(line, {
      x: width - margin - textWidth,
      y: detailY,
      size: detailSize,
      font,
      color: i === 0 ? letterhead.primary : rgb(0.35, 0.38, 0.37),
    });
    detailY -= detailSize + 3;
  }

  // Left-hand logo, or the company name set in the brand colour
  if (letterhead.logo) {
    const maxWidth = 150;
    const maxHeight = 46;
    const scale = Math.min(maxWidth / letterhead.logo.width, maxHeight / letterhead.logo.height, 1);
    const w = letterhead.logo.width * scale;
    const h = letterhead.logo.height * scale;
    page.drawImage(letterhead.logo, { x: margin, y: y - h, width: w, height: h });
    y -= h;
  } else if (letterhead.companyName) {
    page.drawText(letterhead.companyName, {
      x: margin,
      y: y - 14,
      size: 15,
      font: fonts.bold,
      color: letterhead.primary,
    });
    y -= 18;
  }

  y = Math.min(y, detailY) - 10;

  // Brand rule: full-width primary bar, short accent tab beneath it
  page.drawRectangle({ x: margin, y, width: width - margin * 2, height: 3, color: letterhead.primary });
  page.drawRectangle({ x: margin, y: y - 3, width: 70, height: 3, color: letterhead.accent });

  return y - 26;
}
