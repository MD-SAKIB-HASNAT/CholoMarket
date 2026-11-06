import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CategoryInputDto {
  @IsString() @MaxLength(60) nameEn: string;
  @IsString() @MaxLength(60) nameBn: string;
  @IsOptional() @IsString() @MaxLength(60) slug?: string;
  @IsOptional() @IsInt() parentId?: number | null;
  @IsOptional() @IsString() @MaxLength(40) icon?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CategoryInputDto) {}
