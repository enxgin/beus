// prisma-types.ts
// This file centralizes imports for Prisma-generated types and enums.
import {
  User,
  UserRole,
  PaymentMethod,
  CashLogType,
  AppointmentStatus,
  PaymentStatus,
  CommissionType,
  CommissionStatus,
  CommissionRuleType,
  Prisma,
} from '@prisma/client';

// Uygulama içinde kullanılacak ek enum'lar
export enum CashDayStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

// Re-export enums and types for centralized access throughout the application.
export {
  User,
  UserRole,
  PaymentMethod,
  CashLogType,
  AppointmentStatus,
  PaymentStatus,
  CommissionType,
  CommissionStatus,
  CommissionRuleType,
  Prisma,
};
