import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateNotificationSettingsDto } from './create-notification-settings.dto';

export class UpdateNotificationSettingsDto extends PartialType(
  OmitType(CreateNotificationSettingsDto, ['branchId'] as const)
) {}