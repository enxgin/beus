import { IsEnum } from 'class-validator';
import { CommissionStatus } from '../../../src/prisma/prisma-types';

export class UpdateCommissionStatusDto {
  @IsEnum(CommissionStatus)
  status: CommissionStatus;
}
