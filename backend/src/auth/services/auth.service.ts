import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Redis } from 'ioredis';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { JwtPayload } from 'src/auth';
import { AccessService } from 'src/auth';
import type { UpdateProfileDto, VerifyOtpDto } from 'src/auth/dto/auth.dto';
import { normalizeBdPhone, randomDigits } from 'src/common/helper/util';
import { InjectRedis } from 'src/common/redis.module';
import { PostgresService } from 'src/database/postgres/postgres.service';

const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 30;
const hash = (code: string) => createHash('sha256').update(code).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly postgresService: PostgresService,
    @InjectRedis() private readonly redis: Redis,
    private readonly access: AccessService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async requestOtp(rawPhone: string) {
    const phone = normalizeBdPhone(rawPhone);
    const throttleKey = `otp:throttle:${phone}`;
    if (!(await this.redis.set(throttleKey, '1', 'EX', RESEND_SECONDS, 'NX'))) {
      throw new HttpException(
        `Please wait ${RESEND_SECONDS} seconds before requesting another code.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomDigits(6);
    const ttl = Number(this.config.get('OTP_TTL_SECONDS', 300));
    await this.redis
      .multi()
      .set(`otp:${phone}`, hash(code), 'EX', ttl)
      .del(`otp:attempts:${phone}`)
      .exec();

    const isProd = this.config.get('NODE_ENV') === 'production';
    if (isProd) {
      // Send via SMS gateway here.
    } else {
      this.logger.log(`OTP for ${phone}: ${code}`);
    }
    return { phone, expiresIn: ttl, ...(isProd ? {} : { devCode: code }) };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = normalizeBdPhone(dto.phone);
    const attemptsKey = `otp:attempts:${phone}`;
    const attempts = await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, 900);
    if (attempts > MAX_ATTEMPTS)
      throw new ForbiddenException(
        'Too many wrong attempts. Request a new code.',
      );

    const stored = await this.redis.get(`otp:${phone}`);
    const given = Buffer.from(hash(dto.code));
    if (!stored || !timingSafeEqual(Buffer.from(stored), given)) {
      throw new BadRequestException('Wrong or expired code.');
    }
    await this.redis.del(`otp:${phone}`, attemptsKey);

    let user = await this.postgresService.users.findOne({ where: { phone } });
    if (!user) {
      user = this.postgresService.users.create({
        phone,
        fullName: dto.fullName?.trim() || null,
      });
    } else if (user.status !== 'active') {
      throw new ForbiddenException(
        'This account is suspended. Call the hotline for help.',
      );
    }
    user.phoneVerifiedAt ??= new Date();
    user.lastLoginAt = new Date();
    if (dto.fullName && !user.fullName) user.fullName = dto.fullName.trim();
    user = await this.postgresService.users.save(user);

    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: await this.me(user.id),
    };
  }

  /** The user plus every role they hold, so the UI can show the right dashboards. */
  async me(userId: number) {
    const [user, platformRole, shops, markets] = await Promise.all([
      this.postgresService.users.findOneOrFail({ where: { id: userId } }),
      this.access.platformRole(userId),
      this.postgresService.shopMembers.find({
        where: { userId, isActive: true },
        relations: { shop: true },
      }),
      this.postgresService.marketMembers.find({
        where: { userId },
        relations: { market: true },
      }),
    ]);
    return {
      ...user,
      platformRole,
      shops: shops
        .filter((m) => m.shop && !m.shop.deletedAt)
        .map((m) => ({
          shopId: m.shopId,
          role: m.role,
          name: m.shop.nameEn,
          slug: m.shop.slug,
          status: m.shop.status,
        })),
      markets: markets.map((m) => ({
        marketId: m.marketId,
        role: m.role,
        name: m.market.nameEn,
        slug: m.market.slug,
      })),
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.postgresService.users.update(userId, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
      ...(dto.preferredLanguage && {
        preferredLanguage: dto.preferredLanguage,
      }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
    });
    return this.me(userId);
  }
}
