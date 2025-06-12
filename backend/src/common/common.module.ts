// backend\src\common\common.module.ts
import { Global, Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { PdfService } from './services/pdf.service';

@Global() 
@Module({
  providers: [EmailService, PdfService],
  exports: [EmailService, PdfService],
})
export class CommonModule {}