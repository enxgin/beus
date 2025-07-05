import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endTime: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
