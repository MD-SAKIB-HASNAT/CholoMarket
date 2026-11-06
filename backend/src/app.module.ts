import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from 'src/admin/admin.module';
import { AuthModule } from 'src/auth/auth.module';
import { CartModule } from 'src/cart/cart.module';
import { CatalogModule } from 'src/catalog/catalog.module';
import { ChatModule } from 'src/chat/chat.module';
import { PostgresModule } from 'src/database/postgres/postgres.module';
import { RedisModule } from 'src/common/redis.module';
import { CourierModule } from 'src/courier/courier.module';
import { baseDataSourceOptions } from 'src/database/postgres/options';
import { GeoModule } from 'src/geo/geo.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { MarketPortalModule } from 'src/market-portal/market-portal.module';
import { OrdersModule } from 'src/orders/orders.module';
import { PlatformModule } from 'src/platform/platform.module';
import { ShopPortalModule } from 'src/shop-portal/shop-portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => baseDataSourceOptions(process.env),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6380)),
        },
        // QUEUE_PREFIX lets a second API (e.g. the smoke-test instance) run beside the dev one without sharing jobs.
        prefix: config.get('QUEUE_PREFIX', 'cholo'),
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
    RedisModule,
    PostgresModule,
    PlatformModule,
    AuthModule,
    CatalogModule,
    CartModule,
    ChatModule,
    OrdersModule,
    ShopPortalModule,
    CourierModule,
    GeoModule,
    MarketPortalModule,
    AdminModule,
    JobsModule,
  ],
})
export class AppModule {}
