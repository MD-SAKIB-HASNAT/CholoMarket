import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import {
  VERIFICATION_STATUSES,
  type VerificationStatus,
} from 'src/database/enums';

export class VerificationQueryDto extends CursorQueryDto {
  @IsOptional() @IsIn(VERIFICATION_STATUSES) status?: VerificationStatus;
}

export class ReviewVerificationDto {
  @IsIn(['approved', 'rejected']) status: 'approved' | 'rejected';
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class PhysicalVisitDto {
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
