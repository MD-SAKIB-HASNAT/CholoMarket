import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CHECKOUT_PAYMENT_METHODS,
  DELIVERY_ZONES,
  RETURN_REASONS,
  type CheckoutPaymentMethod,
  type DeliveryZone,
  type ReturnReason,
} from 'src/database/enums';

export class CheckoutShopDto {
  @IsInt()
  shopId: number;

  /** shop_pickup / desk_pickup = collect in person; delivery = courier to the customer's address. */
  @IsIn(['shop_pickup', 'desk_pickup', 'delivery'])
  fulfillmentType: 'shop_pickup' | 'desk_pickup' | 'delivery';

  /** Required for desk_pickup: a pickup desk in the shop's market. */
  @IsOptional()
  @IsInt()
  pickupPointId?: number;
}

export class AddressInputDto {
  @IsOptional() @IsString() @MaxLength(30) label?: string;
  @IsString() @MinLength(2) @MaxLength(80) recipientName: string;
  @IsString() @Length(11, 14) phone: string;
  @IsString() @MinLength(2) @MaxLength(60) district: string;
  /** Thana / area, e.g. "Mirpur 10". */
  @IsString() @MinLength(2) @MaxLength(80) areaName: string;
  @IsString() @MinLength(5) @MaxLength(300) addressLine: string;
  @IsOptional() @IsString() @MaxLength(120) landmark?: string;
  @IsIn(DELIVERY_ZONES) zone: DeliveryZone;
}

export class CheckoutDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  contactName: string;

  @IsString()
  @Length(11, 14)
  contactPhone: string;

  /** bkash / nagad = pay in full now; cash = pay at pickup or cash on delivery (a deposit may still be required online). */
  @IsIn(CHECKOUT_PAYMENT_METHODS)
  paymentMethod: CheckoutPaymentMethod;

  /** Wallet used for any online deposit when paymentMethod is cash. */
  @IsOptional()
  @IsIn(['bkash', 'nagad'])
  depositMethod?: 'bkash' | 'nagad';

  @IsOptional()
  @IsString()
  @MaxLength(30)
  couponCode?: string;

  /** A saved address, used for shops chosen for delivery. */
  @IsOptional()
  @IsInt()
  addressId?: number;

  /** Or a new address. */
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  address?: AddressInputDto;

  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /** Pickup choice per shop; defaults to picking up at the shop counter. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutShopDto)
  shops?: CheckoutShopDto[];
}

export class PayOrderDto {
  @IsIn(['bkash', 'nagad'])
  method: 'bkash' | 'nagad';
}

export class MockGatewayDto {
  /** Simulates the customer approving (true) or cancelling (false) in the wallet app. */
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  walletNumber?: string;
}

export class ReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class PickupCodeDto {
  @IsString()
  @Length(6, 6)
  pickupCode: string;
}

export class CreateReviewDto {
  @IsInt()
  shopOrderId: number;

  /** Omit to review the shop itself. */
  @IsOptional()
  @IsInt()
  productId?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ReturnItemDto {
  @IsInt()
  orderItemId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReturnDto {
  @IsInt()
  shopOrderId: number;

  @IsIn(RETURN_REASONS)
  reason: ReturnReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
