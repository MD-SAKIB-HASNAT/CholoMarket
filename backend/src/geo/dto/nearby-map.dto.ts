import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const MAP_KINDS = ['markets', 'shops', 'products'] as const;
export type MapKind = (typeof MAP_KINDS)[number];

export class NearbyMapQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  /** How far to look, in km. Capped at the admin's maximum. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(1000)
  radiusKm?: number;

  @IsOptional()
  @IsIn(MAP_KINDS)
  kind?: MapKind;
}
