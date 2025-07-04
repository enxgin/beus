import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '../../prisma/prisma-types';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Ödeme tutarı', example: 1000.00 })
  @IsNumber({}, { message: 'Ödeme tutarı bir sayı olmalıdır' })
  @IsPositive({ message: 'Ödeme tutarı pozitif bir değer olmalıdır' })
  amount: number;

  @ApiProperty({ 
    description: 'Ödeme yöntemi', 
    enum: PaymentMethod,
    example: PaymentMethod.CASH
  })
  @IsEnum(PaymentMethod, { message: 'Geçerli bir ödeme yöntemi giriniz' })
  @IsNotEmpty({ message: 'Ödeme yöntemi boş olamaz' })
  method: PaymentMethod;

  @ApiProperty({ 
    description: 'Kasa kaydı ID (nakit ödeme için)', 
    example: '1a2b3c4d5e6f7g8h9i0j', 
    required: false 
  })
  @IsString()
  @IsOptional()
  cashRegisterLogId?: string;
}



