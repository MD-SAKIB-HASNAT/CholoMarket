import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

const toBool = ({ value }: { value: unknown }) =>
  value === undefined
    ? undefined
    : value === true || value === 'true' || value === '1';

/** "Nearby": only places within the admin-set radius of the customer's position, nearest first. */
export class NearbyQueryDto {
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  nearby?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  /** How far to look, in km. Never more than the admin's maximum. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(1000)
  radiusKm?: number;
}

/** Division → district → area → sub-area, plus "nearby". Used by the markets and shops lists. */
export class LocationFilterDto extends NearbyQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  areaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subAreaId?: number;
}
