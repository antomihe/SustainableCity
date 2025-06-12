// backend\src\common\services\pdf.service.ts
import { Injectable } from '@nestjs/common';
import PdfPrinter = require('pdfmake');

const fonts = {
  Roboto: {
    normal: "assets/fonts/Roboto-Regular.ttf",
    bold: "assets/fonts/Roboto-Medium.ttf",
    italics: "assets/fonts/Roboto-Italic.ttf",
    bolditalics: "assets/fonts/Roboto-MediumItalic.ttf",
  },
};


@Injectable()
export class PdfService {
  private printer: PdfPrinter;

  constructor() {
    this.printer = new PdfPrinter(fonts);
  }

  async generatePdf(documentDefinition: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(documentDefinition);
      const chunks: any[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
  }
}