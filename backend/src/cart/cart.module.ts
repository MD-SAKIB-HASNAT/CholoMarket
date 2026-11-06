import { Module } from '@nestjs/common';
import { CartController } from 'src/cart/controllers/cart.controller';
import { CartService } from 'src/cart/services/cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
