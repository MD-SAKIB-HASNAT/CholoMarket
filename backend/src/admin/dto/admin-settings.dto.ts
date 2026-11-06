import { IsDefined } from 'class-validator';

export class SettingDto {
  @IsDefined() value: unknown;
}
