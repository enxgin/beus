import { z } from "zod"

// Branch schema
export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Tag schema
export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});

// Staff schema
export const staffSchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Service schema
export const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  price: z.number(),
});

// Appointment status enum
export const appointmentStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]);

// Payment status enum
export const paymentStatusEnum = z.enum([
  'PENDING',
  'PARTIAL',
  'PAID',
  'REFUNDED'
]);

// Appointment schema
export const appointmentSchema = z.object({
  id: z.string(),
  startTime: z.string(), // ISO date string
  endTime: z.string(),   // ISO date string
  duration: z.number().nullable().optional(),
  status: appointmentStatusEnum,
  notes: z.string().nullable().optional(),
  service: serviceSchema.optional(),
  staff: staffSchema.optional(),
  invoice: z.object({
    id: z.string(),
    totalAmount: z.number(),
    amountPaid: z.number(),
    debt: z.number(),
    status: z.string(),
  }).nullable().optional(),
  customerPackage: z.any().nullable().optional(),
});

// Package schema
export const packageSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  totalSessions: z.number().optional(),
  sessionCount: z.number().optional(), // Backward compatibility
  services: z.array(z.object({
    serviceId: z.string(),
    quantity: z.number(),
    service: z.object({
      id: z.string(),
      name: z.string(),
    }).optional(),
  })).optional(),
});

// Customer Package schema
export const customerPackageSchema = z.object({
  id: z.string(),
  purchaseDate: z.string(), // ISO date string
  expiryDate: z.string(),   // ISO date string (backend'de expiryDate olarak geliyor)
  createdAt: z.string().optional(), // Backward compatibility
  endDate: z.string().optional(), // Backward compatibility
  remainingSessions: z.any().nullable().optional(), // JSON olarak geliyor
  package: packageSchema,
  usageHistory: z.array(z.any()).optional(),
  // Frontend için hesaplanan alanlar
  totalSessions: z.number().optional(),
  usedSessions: z.number().optional(),
  active: z.boolean().optional(),
});

// Payment schema
export const paymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  date: z.string(), // ISO date string
  method: z.string(),
  status: z.string(),
  appointmentId: z.string().optional(),
  packageId: z.string().optional(),
});

// Customer schema with branch, tags, appointments, packages and payments
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  creditBalance: z.number(),
  createdAt: z.string(), // Dates will be strings in JSON
  notes: z.string().nullable().optional(),
  discountRate: z.number().optional().default(0),
  branch: branchSchema.optional(),
  tags: z.array(tagSchema).optional().default([]),
  appointments: z.array(appointmentSchema).optional().default([]),
  customerPackages: z.array(customerPackageSchema).optional().default([]),
  payments: z.array(paymentSchema).optional().default([]),
});

export type Branch = z.infer<typeof branchSchema>
export type Tag = z.infer<typeof tagSchema>
export type Staff = z.infer<typeof staffSchema>
export type Service = z.infer<typeof serviceSchema>
export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>
export type PaymentStatus = z.infer<typeof paymentStatusEnum>
export type Appointment = z.infer<typeof appointmentSchema>
export type Package = z.infer<typeof packageSchema>
export type CustomerPackage = z.infer<typeof customerPackageSchema>
export type Payment = z.infer<typeof paymentSchema>
export type Customer = z.infer<typeof customerSchema>
