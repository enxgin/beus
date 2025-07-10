import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationTriggerDto } from './create-notification-trigger.dto';

export class UpdateNotificationTriggerDto extends PartialType(CreateNotificationTriggerDto) {}