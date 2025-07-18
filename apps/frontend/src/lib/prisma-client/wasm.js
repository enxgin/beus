
/* !!! This is code generated by Prisma. Do not edit directly. !!!
/* eslint-disable */

Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.11.0
 * Query Engine version: 9c30299f5a0ea26a96790e13f796dc6094db3173
 */
Prisma.prismaVersion = {
  client: "6.11.0",
  engine: "9c30299f5a0ea26a96790e13f796dc6094db3173"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  name: 'name',
  role: 'role',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkHourScalarFieldEnum = {
  id: 'id',
  staffId: 'staffId',
  branchId: 'branchId',
  dayOfWeek: 'dayOfWeek',
  startTime: 'startTime',
  endTime: 'endTime',
  isOff: 'isOff',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BranchScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  phone: 'phone',
  description: 'description',
  parentBranchId: 'parentBranchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  phone: 'phone',
  email: 'email',
  notes: 'notes',
  branchId: 'branchId',
  discountRate: 'discountRate',
  creditBalance: 'creditBalance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  duration: 'duration',
  description: 'description',
  categoryId: 'categoryId',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffServiceScalarFieldEnum = {
  staffId: 'staffId',
  serviceId: 'serviceId'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  notes: 'notes',
  customerId: 'customerId',
  serviceId: 'serviceId',
  staffId: 'staffId',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PackageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  type: 'type',
  totalSessions: 'totalSessions',
  totalMinutes: 'totalMinutes',
  validityDays: 'validityDays',
  description: 'description',
  branchId: 'branchId',
  commissionRate: 'commissionRate',
  commissionFixed: 'commissionFixed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PackageServiceScalarFieldEnum = {
  packageId: 'packageId',
  serviceId: 'serviceId',
  quantity: 'quantity'
};

exports.Prisma.CustomerPackageScalarFieldEnum = {
  id: 'id',
  purchaseDate: 'purchaseDate',
  expiryDate: 'expiryDate',
  remainingSessions: 'remainingSessions',
  notes: 'notes',
  salesCode: 'salesCode',
  customerId: 'customerId',
  packageId: 'packageId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  totalAmount: 'totalAmount',
  amountPaid: 'amountPaid',
  debt: 'debt',
  status: 'status',
  customerId: 'customerId',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  appointmentId: 'appointmentId',
  customerPackageId: 'customerPackageId'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  paymentDate: 'paymentDate',
  notes: 'notes',
  invoiceId: 'invoiceId',
  cashLogId: 'cashLogId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommissionRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  rate: 'rate',
  fixedAmount: 'fixedAmount',
  startDate: 'startDate',
  endDate: 'endDate',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommissionItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  serviceId: 'serviceId',
  amount: 'amount',
  status: 'status',
  appliedRuleId: 'appliedRuleId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StaffCommissionScalarFieldEnum = {
  id: 'id',
  staffId: 'staffId',
  commissionItemId: 'commissionItemId',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  appliedRuleId: 'appliedRuleId',
  invoiceId: 'invoiceId',
  serviceId: 'serviceId'
};

exports.Prisma.CashRegisterLogScalarFieldEnum = {
  id: 'id',
  type: 'type',
  amount: 'amount',
  description: 'description',
  branchId: 'branchId',
  userId: 'userId',
  createdAt: 'createdAt',
  category: 'category'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  SUPER_BRANCH_MANAGER: 'SUPER_BRANCH_MANAGER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  RECEPTION: 'RECEPTION',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
};

exports.AppointmentStatus = exports.$Enums.AppointmentStatus = {
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  SCHEDULED: 'SCHEDULED',
  ARRIVED: 'ARRIVED',
  CANCELED: 'CANCELED'
};

exports.PackageType = exports.$Enums.PackageType = {
  SESSION: 'SESSION',
  TIME: 'TIME'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CUSTOMER_CREDIT: 'CUSTOMER_CREDIT'
};

exports.CommissionType = exports.$Enums.CommissionType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT'
};

exports.CommissionStatus = exports.$Enums.CommissionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  CANCELED: 'CANCELED'
};

exports.CashLogType = exports.$Enums.CashLogType = {
  OPENING: 'OPENING',
  CLOSING: 'CLOSING',
  INCOME: 'INCOME',
  OUTCOME: 'OUTCOME',
  MANUAL_IN: 'MANUAL_IN',
  MANUAL_OUT: 'MANUAL_OUT',
  INVOICE_PAYMENT: 'INVOICE_PAYMENT'
};

exports.CashMovementCategory = exports.$Enums.CashMovementCategory = {
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  SUPPLIES: 'SUPPLIES',
  STAFF_ADVANCE: 'STAFF_ADVANCE',
  MAINTENANCE: 'MAINTENANCE',
  MARKETING: 'MARKETING',
  OTHER_EXPENSE: 'OTHER_EXPENSE',
  OTHER_INCOME: 'OTHER_INCOME'
};

exports.Prisma.ModelName = {
  User: 'User',
  WorkHour: 'WorkHour',
  Branch: 'Branch',
  Customer: 'Customer',
  ServiceCategory: 'ServiceCategory',
  Service: 'Service',
  StaffService: 'StaffService',
  Appointment: 'Appointment',
  Package: 'Package',
  PackageService: 'PackageService',
  CustomerPackage: 'CustomerPackage',
  Invoice: 'Invoice',
  Payment: 'Payment',
  CommissionRule: 'CommissionRule',
  CommissionItem: 'CommissionItem',
  StaffCommission: 'StaffCommission',
  CashRegisterLog: 'CashRegisterLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
