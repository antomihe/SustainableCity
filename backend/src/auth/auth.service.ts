// backend\src\auth\auth.service.ts
import { Injectable, UnauthorizedException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/app.config'; 
import { Role } from '../users/enums/role.enum';
import { EmailService } from '../common/services/email.service';
import { I18nService, I18nContext } from 'nestjs-i18n'; 

interface LoginTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

interface PasswordActionTokenPayload {
  sub: string;
  email: string;
  purpose: 'SET_INITIAL_PASSWORD' | 'PASSWORD_RESET';
  iat?: number;
  exp?: number;
}

export interface AuthResponseDtoInterface { 
  accessToken: string;
  user: Omit<User, 'password' | 'passwordResetExpires'>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly frontendBaseUrl: string;
  private readonly passwordActionTokenSecret: string;
  private readonly passwordActionTokenExpiresIn: string;
  private readonly appName: string; 

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    const appCfg = this.configService.get<AppConfig>('app');
    this.frontendBaseUrl = appCfg?.frontendUrl || 'http://localhost:3000';

    this.passwordActionTokenSecret = (this.configService.get<string>('jwt.secret') || 'default-secret-for-jwt') + '-pwd-action-suffix';
    this.passwordActionTokenExpiresIn = this.configService.get<string>('jwt.passwordActionTokenExpirationTime') || '1h';

    this.appName = this.i18n.t('app.name');
  }

  private async getLang(): Promise<string> {
    return I18nContext.current()?.lang || this.configService.get<string>('DEFAULT_LANGUAGE', 'es');
  }

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password' | 'passwordResetExpires'>> {
    const lang = await this.getLang();
    const user = await this.usersService.findByEmail(email.toLowerCase(), true);

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.INVALID_CREDENTIALS', { lang }));
    }
    if (!user.password) {
      if (user.requiresPasswordSet) {
        throw new UnauthorizedException(this.i18n.t('auth.ACCOUNT_REQUIRES_ACTIVATION_SET_PASSWORD', { lang }));
      }
      throw new UnauthorizedException(this.i18n.t('auth.ACCOUNT_NO_LOCAL_PASSWORD', { lang }));
    }

    const passwordMatches = await bcrypt.compare(pass, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException(this.i18n.t('auth.INVALID_CREDENTIALS', { lang }));
    }

    if (!user.isActive) {
      if (user.requiresPasswordSet) {
        throw new UnauthorizedException(this.i18n.t('auth.ACCOUNT_REQUIRES_ACTIVATION_SET_PASSWORD', { lang }));
      }
      throw new UnauthorizedException(this.i18n.t('auth.ACCOUNT_INACTIVE', { lang }));
    }

    const { password, passwordResetExpires, ...result } = user;
    return result;
  }

  async login(user: User): Promise<AuthResponseDtoInterface> {
    const payload: LoginTokenPayload = { email: user.email, sub: user.id, role: user.role };
    const { password, passwordResetExpires, ...userWithoutSensitiveData } = user;
    return {
      accessToken: this.jwtService.sign(payload),
      user: userWithoutSensitiveData as User,
    };
  }

  private generatePasswordActionToken(user: User, purpose: PasswordActionTokenPayload['purpose']): string {
    const payload: PasswordActionTokenPayload = {
      sub: user.id,
      email: user.email.toLowerCase(),
      purpose: purpose,
    };
    return this.jwtService.sign(payload, {
      secret: this.passwordActionTokenSecret,
      expiresIn: this.passwordActionTokenExpiresIn,
    });
  }

  private async verifyPasswordActionToken(token: string): Promise<PasswordActionTokenPayload> {
    const lang = await this.getLang();
    try {
      const payload = this.jwtService.verify<PasswordActionTokenPayload>(token, {
        secret: this.passwordActionTokenSecret,
      });

      if (payload.purpose !== 'PASSWORD_RESET' && payload.purpose !== 'SET_INITIAL_PASSWORD') {
        this.logger.warn(`Token con propósito desconocido: ${payload.purpose} para user ${payload.sub}`);
        throw new UnauthorizedException(this.i18n.t('auth.INVALID_TOKEN_PURPOSE', { lang }));
      }
      return payload;
    } catch (error) {
      this.logger.warn(`Error al verificar el token de acción de contraseña: ${error.message} (Token: ${token.substring(0, 20)}...)`);
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(this.i18n.t('auth.TOKEN_EXPIRED_REQUEST_NEW', { lang }));
      }
      throw new BadRequestException(this.i18n.t('auth.TOKEN_INVALID_CORRUPT_OR_USED', { lang }));
    }
  }

  async sendPasswordActionEmail(user: User, purpose: PasswordActionTokenPayload['purpose']): Promise<void> {
    const lang = await this.getLang();
    const preparedUser = await this.usersService.prepareForPasswordAction(user.email);
    if (!preparedUser) {
      this.logger.warn(`No se pudo preparar al usuario ${user.email} para la acción de contraseña (podría no existir o no ser elegible).`);
      return;
    }

    const actionToken = this.generatePasswordActionToken(preparedUser, purpose);
    const actionUrl = `${this.frontendBaseUrl}/set-password/${actionToken}`;

    const emailSubjectKey = purpose === 'SET_INITIAL_PASSWORD'
      ? 'email.AUTH_SET_INITIAL_PASSWORD_SUBJECT'
      : 'email.AUTH_RESET_PASSWORD_SUBJECT';
    const emailSubject = this.i18n.t(emailSubjectKey, { lang, args: { appName: this.appName } });

    const emailIntroKey = purpose === 'SET_INITIAL_PASSWORD'
      ? 'email.AUTH_SET_INITIAL_PASSWORD_INTRO'
      : 'email.AUTH_RESET_PASSWORD_INTRO';

    const greeting = this.i18n.t('email.AUTH_EMAIL_GREETING', { lang, args: { userName: preparedUser.name || preparedUser.email } });
    const intro = this.i18n.t(emailIntroKey, { lang, args: { appName: this.appName } });
    const linkPrompt = this.i18n.t('email.AUTH_EMAIL_ACTION_LINK_PROMPT', { lang });
    const buttonText = this.i18n.t('email.AUTH_EMAIL_ACTION_BUTTON_TEXT', { lang });
    const expiryNotice = this.i18n.t('email.AUTH_EMAIL_LINK_EXPIRY_NOTICE', { lang, args: { duration: this.passwordActionTokenExpiresIn } });
    const ignoreNotice = this.i18n.t('email.AUTH_EMAIL_IGNORE_IF_NOT_REQUESTED', { lang });
    const signOff = this.i18n.t('email.AUTH_EMAIL_SIGN_OFF', { lang, args: { appName: this.appName } });

    const htmlBody = `
      <p>${greeting}</p>
      <p>${intro}</p>
      <p>${linkPrompt}</p>
      <p><a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">${buttonText}</a></p>
      <p style="margin-top: 15px;">Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
      <p><a href="${actionUrl}">${actionUrl}</a></p>
      <p>${expiryNotice}</p>
      <p>${ignoreNotice}</p>
      <p>${signOff}</p>`;

    this.logger.log(`Enviando email de acción de contraseña (${purpose}) a ${preparedUser.email}. URL (sin token): ${this.frontendBaseUrl}/set-password/...`);
    try {
      await this.emailService.sendMail(preparedUser.email, emailSubject, htmlBody);
    } catch (emailError) {
      this.logger.error(`Error enviando email de acción de contraseña a ${preparedUser.email}: ${emailError.message}`, emailError.stack);
      throw new InternalServerErrorException(await this.i18n.t('auth.EMAIL_SEND_ERROR', { lang }));
    }
  }

  async handleRequestPasswordAction(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    if (!user) {
      this.logger.warn(`Solicitud de acción de contraseña para email no existente: ${email}`);
      return;
    }
    const purpose: PasswordActionTokenPayload['purpose'] = user.requiresPasswordSet
      ? 'SET_INITIAL_PASSWORD'
      : 'PASSWORD_RESET';
    await this.sendPasswordActionEmail(user, purpose);
  }

  async setNewPasswordWithToken(tokenFromEmail: string, newPasswordStr: string): Promise<Omit<User, 'password' | 'passwordResetExpires'>> {
    const lang = await this.getLang();
    if (!tokenFromEmail) throw new BadRequestException(await this.i18n.t('auth.PASSWORD_ACTION_TOKEN_NOT_PROVIDED', { lang }));
    if (newPasswordStr.length < 6) throw new BadRequestException(await this.i18n.t('auth.PASSWORD_MIN_LENGTH', { lang }));

    const payload = await this.verifyPasswordActionToken(tokenFromEmail);
    const user = await this.usersService.findOne(payload.sub);

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      this.logger.warn(`Intento de usar token JWT (sub: ${payload.sub}) pero passwordResetExpires en BD ya pasó o es nulo.`);
      throw new BadRequestException(await this.i18n.t('auth.TOKEN_EXPIRED_OR_INVALID_DB', { lang }));
    }

    if (payload.iat && new Date(payload.iat * 1000) > user.passwordResetExpires) {
      this.logger.warn(`Token JWT para ${payload.sub} fue emitido DESPUÉS de la expiración del intento en BD.`);
      throw new BadRequestException(await this.i18n.t('auth.TOKEN_INVALID_ISSUED_AFTER_DB_EXPIRY', { lang }));
    }

    if (payload.purpose === 'SET_INITIAL_PASSWORD' && !user.requiresPasswordSet && user.password) {
      this.logger.warn(`Usuario ${user.email} intentó usar token SET_INITIAL_PASSWORD pero ya tiene contraseña o no lo requiere.`);
      throw new BadRequestException(await this.i18n.t('auth.ACTION_NO_LONGER_VALID_FOR_ACCOUNT', { lang }));
    }
    if (payload.purpose === 'PASSWORD_RESET' && user.requiresPasswordSet) {
      this.logger.warn(`Usuario ${user.email} intentó usar token PASSWORD_RESET pero requiere establecer contraseña inicial.`);
      throw new BadRequestException(await this.i18n.t('auth.ACTION_INVALID_REQUIRES_INITIAL_PASSWORD', { lang }));
    }

    const updatedUserEntity = await this.usersService.setNewPasswordForUser(user, newPasswordStr);

    try {
      const subjectKey = payload.purpose === 'SET_INITIAL_PASSWORD' ? 'email.AUTH_PASSWORD_SET_SUCCESS_SUBJECT' : 'email.AUTH_PASSWORD_RESET_SUCCESS_SUBJECT';
      const bodyKey = payload.purpose === 'SET_INITIAL_PASSWORD' ? 'email.AUTH_PASSWORD_SET_SUCCESS_BODY' : 'email.AUTH_PASSWORD_RESET_SUCCESS_BODY';

      const emailSubject = await this.i18n.t(subjectKey, { lang, args: { appName: this.appName } });
      const emailBody = await this.i18n.t(bodyKey, { lang, args: { appName: this.appName } });
      const securityNotice = await this.i18n.t('email.AUTH_PASSWORD_CHANGE_SECURITY_NOTICE', { lang });

      await this.emailService.sendMail(
        updatedUserEntity.email,
        emailSubject,
        `<p>${emailBody}</p><p>${securityNotice}</p>`
      );
    } catch (emailError) {
      this.logger.error(`Error enviando email de confirmación de cambio de pass a ${updatedUserEntity.email}`, emailError.stack);
    }
    return updatedUserEntity;
  }
}