import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

/**
 * JwtRefreshStrategy — validates the long-lived REFRESH token.
 *
 * The token must arrive in the Authorization header (Bearer scheme).
 * We extract and forward the raw token string so AuthService can verify
 * it against the Redis-stored hash (revocation check).
 *
 * The `passReqToCallback: true` option lets validate() receive the raw Request,
 * from which we extract the raw token for the revocation check.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  validate(
    request: Request,
    payload: JwtRefreshPayload,
  ): JwtRefreshPayload & { rawToken: string } {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type.');
    }

    const authHeader = request.headers['authorization'];
    const rawToken = authHeader?.split(' ')[1];

    if (!rawToken) {
      throw new UnauthorizedException('Refresh token not found in header.');
    }

    // Return payload + raw token — AuthService will verify against Redis
    return { ...payload, rawToken };
  }
}
