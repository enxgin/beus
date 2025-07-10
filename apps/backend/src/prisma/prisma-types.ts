// prisma-types.ts
// This file centralizes imports for Prisma-generated types and enums.
import {
  User,
  PaymentMethod,
  CashLogType,
  AppointmentStatus,
  PaymentStatus,
  CommissionType,
  CommissionStatus,
  CommissionRuleType,
  Prisma,
} from '@prisma/client';

// UserRole enum'unu hardcoded olarak tanımlayalım (runtime sorununu çözmek için)
export enum UserRole {
  STAFF = 'STAFF',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  RECEPTION = 'RECEPTION',
  ADMIN = 'ADMIN',
  SUPER_BRANCH_MANAGER = 'SUPER_BRANCH_MANAGER',
  CUSTOMER = 'CUSTOMER'
}

// Uygulama içinde kullanılacak ek enum'lar
export enum CashDayStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

// Re-export enums and types for centralized access throughout the application.
export {
  User,
  PaymentMethod,
  CashLogType,
  AppointmentStatus,
  PaymentStatus,
  CommissionType,
  CommissionStatus,
  CommissionRuleType,
  Prisma,
};
