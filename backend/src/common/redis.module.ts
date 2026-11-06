import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS = Symbol('REDIS');
export const InjectRedis = () => Inject(REDIS);

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6380)),
          maxRetriesPerRequest: null,
        }),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
