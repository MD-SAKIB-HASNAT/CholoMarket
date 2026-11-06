import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class RequestOtpDto {
  /** 01XXXXXXXXX or +8801XXXXXXXXX */
  @IsString()
  @Length(11, 14)
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @Length(11, 14)
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;

  /** Used when the account is created on first login. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fullName?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['bn', 'en'])
  preferredLanguage?: 'bn' | 'en';

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
