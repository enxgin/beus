// prisma-types.ts
// This file centralizes hardcoded enums to prevent runtime undefined errors
import {
  User,
  PaymentMethod,
  CashLogType,
  CommissionType,
  CommissionRuleType,
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

// Uygulama içinde kullanılacak ek enum'lar
export enum CashDayStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

// Re-export types for centralized access throughout the application.
export {
  User,
  PaymentMethod,
  CashLogType,
  CommissionType,
  CommissionRuleType,
  Prisma,
};
