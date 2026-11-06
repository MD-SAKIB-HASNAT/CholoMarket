import {
  createParamDecorator,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthUser {
  id: number;
  phone: string;
}

export interface JwtPayload {
  sub: number;
  phone: string;
}

export type AuthedRequest = Request & { user?: AuthUser };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    return ctx.switchToHttp().getRequest<AuthedRequest>().user;
  },
);

const bearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
};

/**
 * Needs a valid Bearer token. Put it first in `@UseGuards(AuthGuard, RolesGuard)`;
 * who the user is allowed to be is the RolesGuard's job.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerToken(req);
    if (!token) throw new UnauthorizedException('Please log in.');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = { id: payload.sub, phone: payload.phone };
    } catch {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }
    return true;
  }
}

/** For public routes that personalise when someone is signed in: uses the token if it is valid, never refuses. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerToken(req);
    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(token);
        req.user = { id: payload.sub, phone: payload.phone };
      } catch {
        // an expired token on a public page just means "not signed in"
      }
    }
    return true;
  }
}
