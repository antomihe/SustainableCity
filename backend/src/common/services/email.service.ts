// backend\src\common\services\email.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import emailConfiguration from '../../config/email.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: Mail;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(emailConfiguration.KEY)
    private readonly mailConfig: ConfigType<typeof emailConfiguration>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.mailConfig.host,
      port: this.mailConfig.port,
      secure: this.mailConfig.port === 465, // true para 465, false para otros puertos (como 587)
      auth: {
        user: this.mailConfig.user,
        pass: this.mailConfig.pass,
      },
    });

    this.logger.log(`EmailService initialized with host: ${this.mailConfig.host}`);
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: this.mailConfig.from,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to} with subject "${subject}". Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`, error.stack);
      // Dependiendo de la criticidad, puedes querer relanzar el error
      // o manejarlo (ej. log y continuar)
      throw error;
    }
  }
}