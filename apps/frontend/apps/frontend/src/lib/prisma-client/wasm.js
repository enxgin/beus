
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
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
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
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
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
  discountRate: 'discountRate',
  creditBalance: 'creditBalance',
  branchId: 'branchId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ServiceCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.ServiceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  duration: 'duration',
  price: 'price',
  commissionRate: 'commissionRate',
  commissionFixed: 'commissionFixed',
  categoryId: 'categoryId',
  branchId: 'branchId'
};

exports.Prisma.PackageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  validityDays: 'validityDays',
  commissionRate: 'commissionRate',
  commissionFixed: 'commissionFixed'
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
  customerId: 'customerId',
  packageId: 'packageId'
};

exports.Prisma.PackageUsageHistoryScalarFieldEnum = {
  id: 'id',
  usedAt: 'usedAt',
  customerPackageId: 'customerPackageId',
  appointmentId: 'appointmentId'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  notes: 'notes',
  customerId: 'customerId',
  staffId: 'staffId',
  branchId: 'branchId',
  serviceId: 'serviceId',
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
  appointmentId: 'appointmentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  amount: 'amount',
  method: 'method',
  paymentDate: 'paymentDate',
  invoiceId: 'invoiceId',
  cashRegisterLogId: 'cashRegisterLogId'
};

exports.Prisma.StaffCommissionScalarFieldEnum = {
  id: 'id',
  amount: 'amount',
  isReversed: 'isReversed',
  staffId: 'staffId',
  invoiceId: 'invoiceId',
  createdAt: 'createdAt'
};

exports.Prisma.CashRegisterLogScalarFieldEnum = {
  id: 'id',
  type: 'type',
  amount: 'amount',
  description: 'description',
  branchId: 'branchId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
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
  STAFF: 'STAFF'
};

exports.ServiceType = exports.$Enums.ServiceType = {
  TIME_BASED: 'TIME_BASED',
  UNIT_BASED: 'UNIT_BASED'
};

exports.AppointmentStatus = exports.$Enums.AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  CANCELED: 'CANCELED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CUSTOMER_CREDIT: 'CUSTOMER_CREDIT'
};

exports.CashLogType = exports.$Enums.CashLogType = {
  OPENING: 'OPENING',
  CLOSING: 'CLOSING',
  INCOME: 'INCOME',
  OUTCOME: 'OUTCOME',
  MANUAL_IN: 'MANUAL_IN',
  MANUAL_OUT: 'MANUAL_OUT'
};

exports.Prisma.ModelName = {
  User: 'User',
  Branch: 'Branch',
  Customer: 'Customer',
  ServiceCategory: 'ServiceCategory',
  Service: 'Service',
  Package: 'Package',
  PackageService: 'PackageService',
  CustomerPackage: 'CustomerPackage',
  PackageUsageHistory: 'PackageUsageHistory',
  Appointment: 'Appointment',
  Invoice: 'Invoice',
  Payment: 'Payment',
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
