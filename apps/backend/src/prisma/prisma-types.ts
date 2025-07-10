// prisma-types.ts
// This file centralizes hardcoded enums to prevent runtime undefined errors
import {
  User,
  Prisma,
} from '@prisma/client';

// Tüm enum'ları Prisma schema'dan doğru değerlerle hardcoded tanımlayalım
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export enum AppointmentStatus {
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  SCHEDULED = 'SCHEDULED',
  ARRIVED = 'ARRIVED',
  CANCELED = 'CANCELED'
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELED = 'CANCELED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CUSTOMER_CREDIT = 'CUSTOMER_CREDIT'
}

export enum CashLogType {
  OPENING = 'OPENING',
  CLOSING = 'CLOSING',
  INCOME = 'INCOME',
  OUTCOME = 'OUTCOME',
  MANUAL_IN = 'MANUAL_IN',
  MANUAL_OUT = 'MANUAL_OUT',
  INVOICE_PAYMENT = 'INVOICE_PAYMENT'
}

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT'
}

export enum CommissionRuleType {
  GENERAL = 'GENERAL',
  SERVICE_SPECIFIC = 'SERVICE_SPECIFIC',
  STAFF_SPECIFIC = 'STAFF_SPECIFIC'
}

// Uygulama içinde kullanılacak ek enum'lar
export enum CashDayStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

// Re-export types for centralized access throughout the application.
export {
  User,
  Prisma,
};
