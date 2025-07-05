import { PartialType } from '@nestjs/swagger';
import { CreateCashRegisterLogDto } from './create-cash-register-log.dto';

export class UpdateCashRegisterLogDto extends PartialType(CreateCashRegisterLogDto) {}
