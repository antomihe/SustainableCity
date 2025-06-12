// backend\src\auth\strategies\jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { AppConfig } from 'src/config/app.config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const appCfg = this.configService.get<AppConfig>('app');
    const defaultLanguage = appCfg.defaultLanguage
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        const lang = I18nContext.current()?.lang || defaultLanguage;
        throw new UnauthorizedException(this.i18n.t('auth.USER_NOT_FOUND_OR_INVALID_TOKEN', { lang }));
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      const lang = I18nContext.current()?.lang || defaultLanguage;
      this.configService.get<string>('DEFAULT_LANGUAGE', 'es');
      throw new UnauthorizedException(await this.i18n.t('auth.USER_NOT_FOUND_OR_INVALID_TOKEN', { lang }));
    }
  }
}