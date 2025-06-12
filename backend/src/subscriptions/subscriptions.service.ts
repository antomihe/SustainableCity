// backend\src\subscriptions\subscriptions.service.ts
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { EmailService } from '../common/services/email.service';
import { I18nService, I18nContext } from 'nestjs-i18n'; 
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/app.config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly appName: string;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    private readonly emailService: EmailService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService, 
  ) {
    this.appName = this.i18n.t('app.name');
  }

  async subscribe(subscribeDto: SubscribeDto): Promise<Subscription> {
    const { email, language: providedLanguage } = subscribeDto;
    const existingSubscription = await this.subscriptionsRepository.findOneBy({ email });

    const appCfg = this.configService.get<AppConfig>('app');
    const defaultLanguage = appCfg.defaultLanguage

    const langForEmail = providedLanguage || I18nContext.current()?.lang || defaultLanguage ;

    if (existingSubscription) {
      const appCfg = this.configService.get<AppConfig>('app');
      const defaultLanguage = appCfg.defaultLanguage

      const currentRequestLang = I18nContext.current()?.lang || defaultLanguage ;
      const message = this.i18n.t('subscription.ALREADY_SUBSCRIBED', {
        lang: currentRequestLang,
        args: { email },
      });
      throw new ConflictException(message);
    }

    const subscription = this.subscriptionsRepository.create({
      email,
      language: langForEmail, 
    });
    const savedSubscription = await this.subscriptionsRepository.save(subscription);

    this.logger.log(`New subscription: ${email} with language ${langForEmail}`);

    const subject = this.i18n.t('subscription.CONFIRMATION_SUBJECT', {
      lang: langForEmail,
      args: { appName: this.appName },
    });
    const bodyP1 = this.i18n.t('subscription.CONFIRMATION_BODY_P1', {
      lang: langForEmail,
      args: { appName: this.appName },
    });
    const bodyP2 = this.i18n.t('subscription.CONFIRMATION_BODY_P2', {
      lang: langForEmail,
    });

    await this.emailService.sendMail(email, subject, `<p>${bodyP1}</p><p>${bodyP2}</p>`)
      .catch(err => this.logger.error(`Failed to send confirmation email to ${email}: ${err.message}`));

    return savedSubscription;
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionsRepository.find();
  }

  async sendSustainabilityTips(): Promise<void> {
    const subscriptions = await this.findAll();
    if (subscriptions.length === 0) {
      this.logger.log('No active subscriptions to send tips to.');
      return;
    }

    this.logger.log(`Sending sustainability tip to ${subscriptions.length} subscribers.`);

    for (const sub of subscriptions) {
      const appCfg = this.configService.get<AppConfig>('app');
      const defaultLanguage = appCfg.defaultLanguage
      const lang = sub.language || defaultLanguage;

      const tips: string[] = (this.i18n.t('subscription.TIPS_LIST', { lang }) as string[]) || [];
      if (tips.length === 0) {
        this.logger.warn(`No tips found for language: ${lang}. Skipping email to ${sub.email}.`);
        continue;
      }
      const randomTip = tips[Math.floor(Math.random() * tips.length)];

      const subject = this.i18n.t('subscription.TIP_SUBJECT', { lang, args: { appName: this.appName } });
      const greeting = this.i18n.t('subscription.TIP_GREETING', { lang });
      const intro = this.i18n.t('subscription.TIP_INTRO', { lang });
      const closing = this.i18n.t('subscription.TIP_CLOSING', { lang });

      const emailBody = `
        <p>${greeting}</p>
        <p>${intro}</p>
        <p><strong>${randomTip}</strong></p>
        <p>${closing}</p>`;

      await this.emailService.sendMail(sub.email, subject, emailBody)
        .catch(err => this.logger.error(`Failed to send tip to ${sub.email} (lang: ${lang}): ${err.message}`));
    }
    this.logger.log('Finished sending sustainability tips.');
  }
}