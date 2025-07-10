--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'SCHEDULED',
    'ARRIVED',
    'CANCELED'
);


ALTER TYPE public."AppointmentStatus" OWNER TO engin;

--
-- Name: CashLogType; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."CashLogType" AS ENUM (
    'OPENING',
    'CLOSING',
    'INCOME',
    'OUTCOME',
    'MANUAL_IN',
    'MANUAL_OUT',
    'INVOICE_PAYMENT'
);


ALTER TYPE public."CashLogType" OWNER TO engin;

--
-- Name: CashMovementCategory; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."CashMovementCategory" AS ENUM (
    'RENT',
    'UTILITIES',
    'SUPPLIES',
    'STAFF_ADVANCE',
    'MAINTENANCE',
    'MARKETING',
    'OTHER_EXPENSE',
    'OTHER_INCOME'
);


ALTER TYPE public."CashMovementCategory" OWNER TO engin;

--
-- Name: CommissionRuleType; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."CommissionRuleType" AS ENUM (
    'GENERAL',
    'SERVICE_SPECIFIC',
    'STAFF_SPECIFIC'
);


ALTER TYPE public."CommissionRuleType" OWNER TO engin;

--
-- Name: CommissionStatus; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."CommissionStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'PAID',
    'CANCELED'
);


ALTER TYPE public."CommissionStatus" OWNER TO engin;

--
-- Name: CommissionType; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."CommissionType" AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT'
);


ALTER TYPE public."CommissionType" OWNER TO engin;

--
-- Name: NotificationDeliveryStatus; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."NotificationDeliveryStatus" AS ENUM (
    'SENT',
    'DELIVERED',
    'FAILED',
    'READ'
);


ALTER TYPE public."NotificationDeliveryStatus" OWNER TO engin;

--
-- Name: NotificationEventType; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."NotificationEventType" AS ENUM (
    'APPOINTMENT_REMINDER',
    'APPOINTMENT_CONFIRMATION',
    'BIRTHDAY',
    'PACKAGE_EXPIRY',
    'PAYMENT_REMINDER',
    'WELCOME_MESSAGE',
    'CUSTOM'
);


ALTER TYPE public."NotificationEventType" OWNER TO engin;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."NotificationStatus" OWNER TO engin;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."NotificationType" AS ENUM (
    'SMS',
    'WHATSAPP',
    'EMAIL'
);


ALTER TYPE public."NotificationType" OWNER TO engin;

--
-- Name: PackageType; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."PackageType" AS ENUM (
    'SESSION',
    'TIME'
);


ALTER TYPE public."PackageType" OWNER TO engin;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'CREDIT_CARD',
    'BANK_TRANSFER',
    'CUSTOMER_CREDIT'
);


ALTER TYPE public."PaymentMethod" OWNER TO engin;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PAID',
    'UNPAID',
    'PARTIALLY_PAID',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO engin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: engin
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'SUPER_BRANCH_MANAGER',
    'BRANCH_MANAGER',
    'RECEPTION',
    'STAFF',
    'CUSTOMER'
);


ALTER TYPE public."UserRole" OWNER TO engin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    status public."AppointmentStatus" NOT NULL,
    notes text,
    "customerId" text NOT NULL,
    "serviceId" text NOT NULL,
    "staffId" text NOT NULL,
    "branchId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Appointment" OWNER TO engin;

--
-- Name: Branch; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    description text,
    "parentBranchId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Branch" OWNER TO engin;

--
-- Name: CashRegisterLog; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."CashRegisterLog" (
    id text NOT NULL,
    type public."CashLogType" NOT NULL,
    amount double precision NOT NULL,
    description text,
    "branchId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category public."CashMovementCategory"
);


ALTER TABLE public."CashRegisterLog" OWNER TO engin;

--
-- Name: CommissionItem; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."CommissionItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "serviceId" text,
    amount double precision NOT NULL,
    status public."CommissionStatus" NOT NULL,
    "appliedRuleId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CommissionItem" OWNER TO engin;

--
-- Name: CommissionRule; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."CommissionRule" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type public."CommissionType" NOT NULL,
    rate double precision DEFAULT 0 NOT NULL,
    "fixedAmount" double precision DEFAULT 0 NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "branchId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "ruleType" public."CommissionRuleType" DEFAULT 'GENERAL'::public."CommissionRuleType" NOT NULL,
    "serviceId" text,
    "staffId" text
);


ALTER TABLE public."CommissionRule" OWNER TO engin;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    notes text,
    "branchId" text NOT NULL,
    "discountRate" double precision DEFAULT 0 NOT NULL,
    "creditBalance" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO engin;

--
-- Name: CustomerPackage; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."CustomerPackage" (
    id text NOT NULL,
    "purchaseDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    "remainingSessions" jsonb,
    notes text,
    "salesCode" text,
    "customerId" text NOT NULL,
    "packageId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomerPackage" OWNER TO engin;

--
-- Name: CustomerTag; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."CustomerTag" (
    "customerId" text NOT NULL,
    "tagId" text NOT NULL
);


ALTER TABLE public."CustomerTag" OWNER TO engin;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "amountPaid" double precision NOT NULL,
    debt double precision NOT NULL,
    status public."PaymentStatus" NOT NULL,
    "customerId" text NOT NULL,
    "branchId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "appointmentId" text,
    "customerPackageId" text
);


ALTER TABLE public."Invoice" OWNER TO engin;

--
-- Name: NotificationHistory; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."NotificationHistory" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "templateId" text NOT NULL,
    "triggerId" text,
    "branchId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    status public."NotificationDeliveryStatus" NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    cost double precision,
    "sentAt" timestamp(3) without time zone NOT NULL,
    "deliveredAt" timestamp(3) without time zone,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."NotificationHistory" OWNER TO engin;

--
-- Name: NotificationProvider; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."NotificationProvider" (
    id text NOT NULL,
    name text NOT NULL,
    type public."NotificationType" NOT NULL,
    config jsonb NOT NULL,
    "branchId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationProvider" OWNER TO engin;

--
-- Name: NotificationQueue; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."NotificationQueue" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "templateId" text NOT NULL,
    "triggerId" text,
    "branchId" text NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    data jsonb NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationQueue" OWNER TO engin;

--
-- Name: NotificationSettings; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."NotificationSettings" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "smsConfig" jsonb,
    "whatsappConfig" jsonb,
    "emailConfig" jsonb,
    "generalSettings" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationSettings" OWNER TO engin;

--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."NotificationTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    type public."NotificationType" NOT NULL,
    subject text,
    content text NOT NULL,
    variables jsonb NOT NULL,
    language text DEFAULT 'tr'::text NOT NULL,
    "branchId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTemplate" OWNER TO engin;

--
-- Name: NotificationTrigger; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."NotificationTrigger" (
    id text NOT NULL,
    name text NOT NULL,
    "eventType" public."NotificationEventType" NOT NULL,
    conditions jsonb NOT NULL,
    "templateId" text NOT NULL,
    "branchId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    schedule text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."NotificationTrigger" OWNER TO engin;

--
-- Name: Package; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Package" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    type public."PackageType" NOT NULL,
    "totalSessions" integer,
    "totalMinutes" integer,
    "validityDays" integer,
    description text,
    "branchId" text NOT NULL,
    "commissionRate" double precision,
    "commissionFixed" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Package" OWNER TO engin;

--
-- Name: PackageService; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."PackageService" (
    "packageId" text NOT NULL,
    "serviceId" text NOT NULL,
    quantity integer NOT NULL
);


ALTER TABLE public."PackageService" OWNER TO engin;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    amount double precision NOT NULL,
    method public."PaymentMethod" NOT NULL,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "invoiceId" text NOT NULL,
    "cashRegisterLogId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO engin;

--
-- Name: Service; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Service" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    duration integer NOT NULL,
    description text,
    "categoryId" text NOT NULL,
    "branchId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Service" OWNER TO engin;

--
-- Name: ServiceCategory; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."ServiceCategory" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchId" text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ServiceCategory" OWNER TO engin;

--
-- Name: StaffCommission; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."StaffCommission" (
    id text NOT NULL,
    "staffId" text NOT NULL,
    "commissionItemId" text NOT NULL,
    amount double precision NOT NULL,
    status public."CommissionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "appliedRuleId" text,
    "invoiceId" text NOT NULL,
    "serviceId" text
);


ALTER TABLE public."StaffCommission" OWNER TO engin;

--
-- Name: StaffService; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."StaffService" (
    "userId" text NOT NULL,
    "serviceId" text NOT NULL
);


ALTER TABLE public."StaffService" OWNER TO engin;

--
-- Name: Tag; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."Tag" (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tag" OWNER TO engin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."UserRole" NOT NULL,
    "branchId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."User" OWNER TO engin;

--
-- Name: WorkHour; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public."WorkHour" (
    id text NOT NULL,
    "staffId" text NOT NULL,
    "branchId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isOff" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkHour" OWNER TO engin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: engin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO engin;

--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Appointment" (id, "startTime", "endTime", status, notes, "customerId", "serviceId", "staffId", "branchId", "createdAt", "updatedAt") FROM stdin;
cmcwvvtxw0008sbde7vc3y373	2025-07-10 09:00:00	2025-07-10 09:30:00	SCHEDULED	\N	cmcwtl01s0000sbo1s0b1r6mm	cmcwvu3d50007sbdey0bqpge4	cmcwvskyo0004sbder51og6ul	branch-2	2025-07-10 04:24:29.012	2025-07-10 04:24:29.012
cmcww9p920000sb3k76s2y4j5	2025-07-10 13:30:00	2025-07-10 14:00:00	COMPLETED	\N	cmcwugd8t0003sb263qqz6ay2	cmcwvu3d50007sbdey0bqpge4	cmcwvskyo0004sbder51og6ul	branch-2	2025-07-10 04:35:16.119	2025-07-10 04:35:30.224
cmcwx5dwo0002sbr184gnkfk4	2025-07-10 14:00:00	2025-07-10 14:30:00	COMPLETED	\N	cmcwuql1f0002sbjrl10yvy76	cmcwvu3d50007sbdey0bqpge4	cmcwvskyo0004sbder51og6ul	branch-2	2025-07-10 04:59:54.408	2025-07-10 05:00:19.827
cmcwxzzce0002sb6wc65203kd	2025-07-10 13:30:00	2025-07-10 14:00:00	COMPLETED	\N	cmcwugd8t0003sb263qqz6ay2	cmcwvte8a0006sbdem8vqwp83	cmcwsyisa0003sbueqpgea51g	branch-2	2025-07-10 05:23:41.87	2025-07-10 05:23:49.152
cmcwyah0z0000sbbklbyi2y25	2025-07-10 14:30:00	2025-07-10 15:00:00	COMPLETED	\N	cmcwuql1f0002sbjrl10yvy76	cmcwvu3d50007sbdey0bqpge4	cmcwvskyo0004sbder51og6ul	branch-2	2025-07-10 05:31:51.348	2025-07-10 05:31:56.29
cmcwzje0z0004sb4i5yvu0m3t	2025-07-10 14:30:00	2025-07-10 15:00:00	COMPLETED	\N	cmcwuql1f0002sbjrl10yvy76	cmcwvte8a0006sbdem8vqwp83	cmcwsyisa0003sbueqpgea51g	branch-2	2025-07-10 06:06:46.98	2025-07-10 06:06:51.565
\.


--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Branch" (id, name, address, phone, description, "parentBranchId", "createdAt", "updatedAt") FROM stdin;
branch-1	Ana Şube	İstanbul, Türkiye	+90 212 123 45 67	Ana şube lokasyonu	\N	2025-07-10 03:02:35.581	2025-07-10 03:02:35.581
branch-2	Şube 2	Ankara, Türkiye	+90 312 123 45 67	İkinci şube lokasyonu	\N	2025-07-10 03:02:35.603	2025-07-10 03:02:35.603
\.


--
-- Data for Name: CashRegisterLog; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."CashRegisterLog" (id, type, amount, description, "branchId", "userId", "createdAt", category) FROM stdin;
cmcwwajj10004sb3kmu3k7dxi	INCOME	1000	Fatura #cmcwwa0kr0002sb3kkyql6jaq için nakit tahsilat - Gülkader sivri	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 04:35:55.358	\N
cmcwx6pxm0006sbr1poapug9c	INCOME	1000	Fatura #cmcwx5y1o0004sbr1p0el3pac için nakit tahsilat - selin	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 05:00:56.65	\N
cmcwy0ebr0006sb6wt7yf9dvi	INCOME	500	Fatura #cmcwy05et0004sb6w08aryqsi için nakit tahsilat - Gülkader sivri	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 05:24:01.288	\N
cmcwyavnt0004sbbk6d93u0ts	INCOME	1000	Fatura #cmcwyala80002sbbktmgfy60f için nakit tahsilat - selin	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 05:32:10.313	\N
cmcwzibfe0001sb4i8feg6c2m	INCOME	10000	Fatura #cmcwz6h1o0002sbshae27fm65 için nakit tahsilat - selin	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 06:05:56.954	\N
cmcwzkrld0008sb4icorp6u95	OPENING	10	Kasa açılışı	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 06:07:51.217	\N
cmcwzlequ000asb4iogz7o2rp	MANUAL_OUT	4000	kira dükkan	branch-2	cmcwsyisa0003sbueqpgea51g	2025-07-10 06:08:21.223	RENT
\.


--
-- Data for Name: CommissionItem; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."CommissionItem" (id, "invoiceId", "serviceId", amount, status, "appliedRuleId", "createdAt", "updatedAt") FROM stdin;
cmcwyavod0008sbbkv1tpmc0h	cmcwyala80002sbbktmgfy60f	cmcwvu3d50007sbdey0bqpge4	100	PENDING	cmcwwv56v0001sbr1a5w7i4qq	2025-07-10 05:32:10.333	2025-07-10 05:32:10.333
\.


--
-- Data for Name: CommissionRule; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."CommissionRule" (id, name, description, type, rate, "fixedAmount", "startDate", "endDate", "branchId", "createdAt", "updatedAt", "isActive", "ruleType", "serviceId", "staffId") FROM stdin;
cmcwwv56v0001sbr1a5w7i4qq	Bali Masaji Prim Kuralı	Bali masaji prim	PERCENTAGE	10	0	2025-07-10 04:51:56.549	\N	branch-2	2025-07-10 04:51:56.55	2025-07-10 04:51:56.55	t	GENERAL	\N	\N
cmcwxz59h0001sb6w2ul9zb4p	Saç kesimi prim genel 2	Saç kesimi prim genel 2	PERCENTAGE	20	0	2025-07-10 00:00:00	2027-06-10 00:00:00	branch-2	2025-07-10 05:23:02.884	2025-07-10 05:23:02.884	t	SERVICE_SPECIFIC	cmcwvte8a0006sbdem8vqwp83	\N
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Customer" (id, name, phone, email, notes, "branchId", "discountRate", "creditBalance", "createdAt", "updatedAt") FROM stdin;
cmcwtaswc0000sbmh8d4dzk6m	Test Müşteri	05426988513	test@example.com	\N	branch-1	0	0	2025-07-10 03:12:08.652	2025-07-10 03:12:08.652
cmcwuf69f0002sb26a7iqosei	Test Müşteri 2	05551234568	test2@example.com	\N	branch-1	0	0	2025-07-10 03:43:32.211	2025-07-10 03:43:32.211
cmcwugd8t0003sb263qqz6ay2	Gülkader sivri	05011083889	ddd@gmail.com	\N	branch-2	0	0	2025-07-10 03:44:27.917	2025-07-10 03:51:59.163
cmcwtl01s0000sbo1s0b1r6mm	Asli Mert	05426988511	asli@gmail.com	\N	branch-2	0	0	2025-07-10 03:20:04.479	2025-07-10 03:52:35.872
cmcwuzjcb0000sb6t09jm0qqu	Ayşe	05011043889	ayse@gmail.com	fdgdfgdfg	branch-2	9	0	2025-07-10 03:59:22.284	2025-07-10 04:23:33.615
cmcwuql1f0002sbjrl10yvy76	selin	05446988512	sdf@gmail.com	\N	branch-2	0	0	2025-07-10 03:52:24.579	2025-07-10 06:34:34.968
\.


--
-- Data for Name: CustomerPackage; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."CustomerPackage" (id, "purchaseDate", "expiryDate", "remainingSessions", notes, "salesCode", "customerId", "packageId", "createdAt", "updatedAt") FROM stdin;
cmcwz6h0l0000sbshn98tv377	2025-07-10 05:56:37.875	2026-07-10 05:56:37.875	{"cmcwvte8a0006sbdem8vqwp83": 10}	\N	SLS-898662	cmcwuql1f0002sbjrl10yvy76	cmcwyrn5i0000sb5x1ddby90i	2025-07-10 05:56:44.325	2025-07-10 05:56:44.325
\.


--
-- Data for Name: CustomerTag; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."CustomerTag" ("customerId", "tagId") FROM stdin;
cmcwuf69f0002sb26a7iqosei	cmcwudnbd0000sb267lccsjst
cmcwugd8t0003sb263qqz6ay2	cmcwudnbd0000sb267lccsjst
cmcwuzjcb0000sb6t09jm0qqu	cmcwudnbd0000sb267lccsjst
cmcwuzjcb0000sb6t09jm0qqu	cmcwuplua0000sbjrgh82334t
cmcwuzjcb0000sb6t09jm0qqu	cmcwuq0rl0001sbjrxatw5p8o
cmcwuql1f0002sbjrl10yvy76	cmcwuq0rl0001sbjrxatw5p8o
cmcwuql1f0002sbjrl10yvy76	cmcwudnbd0000sb267lccsjst
cmcwuql1f0002sbjrl10yvy76	cmcx0j45v0000sbg6aguzsjql
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Invoice" (id, "totalAmount", "amountPaid", debt, status, "customerId", "branchId", "createdAt", "updatedAt", "appointmentId", "customerPackageId") FROM stdin;
cmcwwa0kr0002sb3kkyql6jaq	1000	1000	0	PAID	cmcwugd8t0003sb263qqz6ay2	branch-2	2025-07-10 04:35:30.795	2025-07-10 04:35:55.364	cmcww9p920000sb3k76s2y4j5	\N
cmcwx5y1o0004sbr1p0el3pac	1000	1000	0	PAID	cmcwuql1f0002sbjrl10yvy76	branch-2	2025-07-10 05:00:20.508	2025-07-10 05:00:56.658	cmcwx5dwo0002sbr184gnkfk4	\N
cmcwy05et0004sb6w08aryqsi	500	500	0	PAID	cmcwugd8t0003sb263qqz6ay2	branch-2	2025-07-10 05:23:49.734	2025-07-10 05:24:01.293	cmcwxzzce0002sb6wc65203kd	\N
cmcwyala80002sbbktmgfy60f	1000	1000	0	PAID	cmcwuql1f0002sbjrl10yvy76	branch-2	2025-07-10 05:31:56.864	2025-07-10 05:32:10.323	cmcwyah0z0000sbbklbyi2y25	\N
cmcwz6h1o0002sbshae27fm65	10000	10000	0	PAID	cmcwuql1f0002sbjrl10yvy76	branch-2	2025-07-10 05:56:44.364	2025-07-10 06:05:57.012	\N	\N
cmcwzji240006sb4i2w35n1ws	500	0	500	UNPAID	cmcwuql1f0002sbjrl10yvy76	branch-2	2025-07-10 06:06:52.205	2025-07-10 06:06:52.205	cmcwzje0z0004sb4i5yvu0m3t	\N
\.


--
-- Data for Name: NotificationHistory; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."NotificationHistory" (id, "customerId", "templateId", "triggerId", "branchId", type, status, content, metadata, cost, "sentAt", "deliveredAt", "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: NotificationProvider; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."NotificationProvider" (id, name, type, config, "branchId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationQueue; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."NotificationQueue" (id, "customerId", "templateId", "triggerId", "branchId", status, data, "scheduledAt", "sentAt", "errorMessage", "retryCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationSettings; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."NotificationSettings" (id, "branchId", "smsConfig", "whatsappConfig", "emailConfig", "generalSettings", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."NotificationTemplate" (id, name, type, subject, content, variables, language, "branchId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: NotificationTrigger; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."NotificationTrigger" (id, name, "eventType", conditions, "templateId", "branchId", "isActive", priority, schedule, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Package; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Package" (id, name, price, type, "totalSessions", "totalMinutes", "validityDays", description, "branchId", "commissionRate", "commissionFixed", "createdAt", "updatedAt") FROM stdin;
cmcwyrn5i0000sb5x1ddby90i	Altin suyu duşu 10	10000	SESSION	10	\N	365		branch-2	\N	\N	2025-07-10 05:45:12.438	2025-07-10 05:45:12.438
\.


--
-- Data for Name: PackageService; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."PackageService" ("packageId", "serviceId", quantity) FROM stdin;
cmcwyrn5i0000sb5x1ddby90i	cmcwvte8a0006sbdem8vqwp83	10
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Payment" (id, amount, method, "paymentDate", "invoiceId", "cashRegisterLogId", "createdAt", "updatedAt") FROM stdin;
cmcwwajj60006sb3kkpev7zc3	1000	CASH	2025-07-10 04:35:55.363	cmcwwa0kr0002sb3kkyql6jaq	cmcwwajj10004sb3kmu3k7dxi	2025-07-10 04:35:55.363	2025-07-10 04:35:55.363
cmcwx6pxs0008sbr1rx4w27ls	1000	CASH	2025-07-10 05:00:56.656	cmcwx5y1o0004sbr1p0el3pac	cmcwx6pxm0006sbr1poapug9c	2025-07-10 05:00:56.656	2025-07-10 05:00:56.656
cmcwy0ebw0008sb6wbs2ffec5	500	CASH	2025-07-10 05:24:01.292	cmcwy05et0004sb6w08aryqsi	cmcwy0ebr0006sb6wt7yf9dvi	2025-07-10 05:24:01.292	2025-07-10 05:24:01.292
cmcwyavo00006sbbkt81ssiv1	1000	CASH	2025-07-10 05:32:10.319	cmcwyala80002sbbktmgfy60f	cmcwyavnt0004sbbk6d93u0ts	2025-07-10 05:32:10.319	2025-07-10 05:32:10.319
cmcwzibgw0003sb4iq890xayx	10000	CASH	2025-07-10 06:05:57.008	cmcwz6h1o0002sbshae27fm65	cmcwzibfe0001sb4i8feg6c2m	2025-07-10 06:05:57.008	2025-07-10 06:05:57.008
\.


--
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Service" (id, name, price, duration, description, "categoryId", "branchId", "createdAt", "updatedAt", "isActive") FROM stdin;
cmcwvu3d50007sbdey0bqpge4	Bali Masaji	1000	30	\N	cmcwvpjie0001sbdekm8hoe6z	branch-2	2025-07-10 04:23:07.914	2025-07-10 12:43:04.459	t
cmcwvte8a0006sbdem8vqwp83	Saç Kesimi	500	30	\N	cmcwvrzc50003sbdevalun0ku	branch-2	2025-07-10 04:22:35.338	2025-07-10 12:43:10.149	t
\.


--
-- Data for Name: ServiceCategory; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."ServiceCategory" (id, name, description, "createdAt", "updatedAt", "branchId", "isActive") FROM stdin;
cmcwvpjie0001sbdekm8hoe6z	Masaj		2025-07-10 04:19:35.558	2025-07-10 04:19:35.558	branch-2	t
cmcwvgqac0000sboc05yfag3y	Cilt Bakımı	Cilt Bakımı Cilt Bakımı	2025-07-10 04:12:44.436	2025-07-10 04:19:40.87	\N	t
cmcwvrzc50003sbdevalun0ku	Saç Bakımı	Saç Bakımı Saç Bakımı	2025-07-10 04:21:29.381	2025-07-10 04:21:29.381	branch-2	t
\.


--
-- Data for Name: StaffCommission; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."StaffCommission" (id, "staffId", "commissionItemId", amount, status, "createdAt", "updatedAt", "appliedRuleId", "invoiceId", "serviceId") FROM stdin;
cmcwyavoh000asbbkwcbd5jyi	cmcwvskyo0004sbder51og6ul	cmcwyavod0008sbbkv1tpmc0h	100	APPROVED	2025-07-10 05:32:10.338	2025-07-10 10:51:00.723	cmcwwv56v0001sbr1a5w7i4qq	cmcwyala80002sbbktmgfy60f	cmcwvu3d50007sbdey0bqpge4
\.


--
-- Data for Name: StaffService; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."StaffService" ("userId", "serviceId") FROM stdin;
cmcwsyisa0003sbueqpgea51g	cmcwvte8a0006sbdem8vqwp83
cmcwvskyo0004sbder51og6ul	cmcwvte8a0006sbdem8vqwp83
cmcwvszc60005sbdem86ivrsy	cmcwvte8a0006sbdem8vqwp83
cmcwvszc60005sbdem86ivrsy	cmcwvu3d50007sbdey0bqpge4
cmcwsyisa0003sbueqpgea51g	cmcwvu3d50007sbdey0bqpge4
cmcwvskyo0004sbder51og6ul	cmcwvu3d50007sbdey0bqpge4
\.


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."Tag" (id, name, color, "createdAt", "updatedAt") FROM stdin;
cmcwudnbd0000sb267lccsjst	VIP Müşteri	#ff6b6b	2025-07-10 03:42:21.002	2025-07-10 03:42:21.002
cmcwuplua0000sbjrgh82334t	fgfdg	#3b82f6	2025-07-10 03:51:38.962	2025-07-10 03:51:38.962
cmcwuq0rl0001sbjrxatw5p8o	dfgdfg	#3b82f6	2025-07-10 03:51:58.305	2025-07-10 03:51:58.305
cmcx0j45v0000sbg6aguzsjql	mo	#1f3a65	2025-07-10 06:34:33.811	2025-07-10 06:34:33.811
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."User" (id, email, password, name, role, "branchId", "createdAt", "updatedAt", "isActive") FROM stdin;
cmcwsyis40001sbueotr9ogz3	test-admin@salonflow.com	$2b$10$mb4/1bJg3Nr6JHMj0Gsx8.qnipQEC8SRU/I7/bQSOYjZHRXbfJ0se	Test Admin	ADMIN	branch-1	2025-07-10 03:02:35.668	2025-07-10 03:02:35.668	t
cmcwsyisc0005sbuea3uumuxy	staff@salonflow.com	$2b$10$mb4/1bJg3Nr6JHMj0Gsx8.qnipQEC8SRU/I7/bQSOYjZHRXbfJ0se	Test Staff	STAFF	branch-1	2025-07-10 03:02:35.677	2025-07-10 03:02:35.677	t
cmcwsyisa0003sbueqpgea51g	mudur@randevum.com	$2b$10$hjoarl0gOJpgBhLz0lFm.OGPmZKw0tcr3i4CUbpJ79EN/nnT.fPKS	Mert	BRANCH_MANAGER	branch-2	2025-07-10 03:02:35.675	2025-07-10 03:19:26.829	t
cmcwvszc60005sbdem86ivrsy	asli@randevum.com	$2b$10$TlDr2ITAHo1cef3wB9APLOWEBy1t2jhA9eKUA3u7Bua9DUO8792Cy	Aslı	RECEPTION	branch-2	2025-07-10 04:22:16.039	2025-07-10 12:08:04.751	t
cmcwvskyo0004sbder51og6ul	melis@randevum.com	$2b$10$a5QByWJRUZsb3/iSG/bEKuohqRem56hHTh/FcmC/xiC5fDnibCMw6	Melis	STAFF	branch-2	2025-07-10 04:21:57.408	2025-07-10 12:22:50.923	t
\.


--
-- Data for Name: WorkHour; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public."WorkHour" (id, "staffId", "branchId", "dayOfWeek", "startTime", "endTime", "isOff", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: engin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3983cd72-0880-4280-8d43-5cf445d90287	a23da67b74f4633ac6ed44406ed88b4f55a9c8951152ef4bd36afccab59c3fdb	2025-07-10 05:58:17.090499+03	20250710025817_initial_setup	\N	\N	2025-07-10 05:58:17.046379+03	1
1aa367ce-5b9d-4bbf-b269-4f7f68049e0e	f90cd994ce6c4f2ca37280625e0119d2e21d171b627176f9d644d4d9264a5a3f	2025-07-10 06:05:01.180097+03	20250710030501_add_service_isactive_field	\N	\N	2025-07-10 06:05:01.177641+03	1
90d4369b-2f63-4939-aae0-176f16de5572	08c19e04c24ac66a070d374d4ab73f83a98b7fced7bc31a35445f7739c7da6e4	2025-07-10 06:23:23.727125+03	20250710032323_add_tag_models	\N	\N	2025-07-10 06:23:23.703063+03	1
cf8bbd4e-8b53-4f46-94c3-c51eb8fc3fd8	4e246d93535efc55adeba61b75cd98b8e3b33aa1f57a604f640df585f69a9b49	2025-07-10 07:06:16.343719+03	20250710040616_add_service_category_branch_relation	\N	\N	2025-07-10 07:06:16.341274+03	1
253ec9e6-c25e-45e3-a0b3-57606d9233bf	54c6cec7e0be5884263cf63af9bbd617297bc6153a72b22b273408f94491591b	2025-07-10 07:09:37.062032+03	20250710040937_revert_service_category_changes	\N	\N	2025-07-10 07:09:37.0591+03	1
dee25a87-6a33-455b-829d-04812bbfa798	4e246d93535efc55adeba61b75cd98b8e3b33aa1f57a604f640df585f69a9b49	2025-07-10 07:17:08.633549+03	20250710041708_add_service_category_isactive_branch	\N	\N	2025-07-10 07:17:08.629439+03	1
6b2c350f-f27a-4da7-b1ed-f738e8d72e9b	8a217e866038cf5e99dcd4bbdc9fedc79e73267a1142061dcbe917044961773f	2025-07-10 08:09:51.697836+03	20250710050951_update_commission_system	\N	\N	2025-07-10 08:09:51.684257+03	1
04a01267-deef-4989-b9ee-1534c7a37de8	d49428359d73ab13cb87d1204b6dae4c33afd2079c55f5365ee24d6109defef1	2025-07-10 09:48:40.786709+03	20250710064840_add_notification_system	\N	\N	2025-07-10 09:48:40.735474+03	1
57931ad2-6a52-45a7-9ebf-a70d333d5a3c	fbe7dbf19171b954266fb0bb9b7738e4b55a959c5e3d1f4de4ee09bf49a4678a	2025-07-10 13:53:12.072031+03	20250710105311_add_user_is_active	\N	\N	2025-07-10 13:53:11.873604+03	1
\.


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: CashRegisterLog CashRegisterLog_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CashRegisterLog"
    ADD CONSTRAINT "CashRegisterLog_pkey" PRIMARY KEY (id);


--
-- Name: CommissionItem CommissionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionItem"
    ADD CONSTRAINT "CommissionItem_pkey" PRIMARY KEY (id);


--
-- Name: CommissionRule CommissionRule_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionRule"
    ADD CONSTRAINT "CommissionRule_pkey" PRIMARY KEY (id);


--
-- Name: CustomerPackage CustomerPackage_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CustomerPackage"
    ADD CONSTRAINT "CustomerPackage_pkey" PRIMARY KEY (id);


--
-- Name: CustomerTag CustomerTag_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CustomerTag"
    ADD CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("customerId", "tagId");


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: NotificationHistory NotificationHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY (id);


--
-- Name: NotificationProvider NotificationProvider_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationProvider"
    ADD CONSTRAINT "NotificationProvider_pkey" PRIMARY KEY (id);


--
-- Name: NotificationQueue NotificationQueue_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationQueue"
    ADD CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY (id);


--
-- Name: NotificationSettings NotificationSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationSettings"
    ADD CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY (id);


--
-- Name: NotificationTrigger NotificationTrigger_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationTrigger"
    ADD CONSTRAINT "NotificationTrigger_pkey" PRIMARY KEY (id);


--
-- Name: PackageService PackageService_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."PackageService"
    ADD CONSTRAINT "PackageService_pkey" PRIMARY KEY ("packageId", "serviceId");


--
-- Name: Package Package_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Package"
    ADD CONSTRAINT "Package_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: ServiceCategory ServiceCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."ServiceCategory"
    ADD CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: StaffCommission StaffCommission_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffCommission"
    ADD CONSTRAINT "StaffCommission_pkey" PRIMARY KEY (id);


--
-- Name: StaffService StaffService_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffService"
    ADD CONSTRAINT "StaffService_pkey" PRIMARY KEY ("userId", "serviceId");


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WorkHour WorkHour_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."WorkHour"
    ADD CONSTRAINT "WorkHour_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CashRegisterLog_branchId_createdAt_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "CashRegisterLog_branchId_createdAt_idx" ON public."CashRegisterLog" USING btree ("branchId", "createdAt");


--
-- Name: CommissionRule_ruleType_branchId_isActive_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "CommissionRule_ruleType_branchId_isActive_idx" ON public."CommissionRule" USING btree ("ruleType", "branchId", "isActive");


--
-- Name: CommissionRule_serviceId_isActive_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "CommissionRule_serviceId_isActive_idx" ON public."CommissionRule" USING btree ("serviceId", "isActive");


--
-- Name: CommissionRule_staffId_isActive_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "CommissionRule_staffId_isActive_idx" ON public."CommissionRule" USING btree ("staffId", "isActive");


--
-- Name: CustomerPackage_salesCode_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "CustomerPackage_salesCode_key" ON public."CustomerPackage" USING btree ("salesCode");


--
-- Name: Customer_email_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "Customer_email_key" ON public."Customer" USING btree (email);


--
-- Name: Customer_phone_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "Customer_phone_key" ON public."Customer" USING btree (phone);


--
-- Name: Invoice_appointmentId_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "Invoice_appointmentId_key" ON public."Invoice" USING btree ("appointmentId");


--
-- Name: Invoice_customerPackageId_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "Invoice_customerPackageId_key" ON public."Invoice" USING btree ("customerPackageId");


--
-- Name: NotificationHistory_branchId_sentAt_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationHistory_branchId_sentAt_idx" ON public."NotificationHistory" USING btree ("branchId", "sentAt");


--
-- Name: NotificationHistory_customerId_sentAt_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationHistory_customerId_sentAt_idx" ON public."NotificationHistory" USING btree ("customerId", "sentAt");


--
-- Name: NotificationProvider_branchId_type_isActive_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationProvider_branchId_type_isActive_idx" ON public."NotificationProvider" USING btree ("branchId", type, "isActive");


--
-- Name: NotificationQueue_branchId_status_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationQueue_branchId_status_idx" ON public."NotificationQueue" USING btree ("branchId", status);


--
-- Name: NotificationQueue_status_scheduledAt_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationQueue_status_scheduledAt_idx" ON public."NotificationQueue" USING btree (status, "scheduledAt");


--
-- Name: NotificationSettings_branchId_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "NotificationSettings_branchId_key" ON public."NotificationSettings" USING btree ("branchId");


--
-- Name: NotificationTemplate_branchId_type_isActive_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationTemplate_branchId_type_isActive_idx" ON public."NotificationTemplate" USING btree ("branchId", type, "isActive");


--
-- Name: NotificationTrigger_branchId_eventType_isActive_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "NotificationTrigger_branchId_eventType_isActive_idx" ON public."NotificationTrigger" USING btree ("branchId", "eventType", "isActive");


--
-- Name: StaffCommission_staffId_serviceId_status_idx; Type: INDEX; Schema: public; Owner: engin
--

CREATE INDEX "StaffCommission_staffId_serviceId_status_idx" ON public."StaffCommission" USING btree ("staffId", "serviceId", status);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: WorkHour_staffId_branchId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: engin
--

CREATE UNIQUE INDEX "WorkHour_staffId_branchId_dayOfWeek_key" ON public."WorkHour" USING btree ("staffId", "branchId", "dayOfWeek");


--
-- Name: Appointment Appointment_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Branch Branch_parentBranchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CashRegisterLog CashRegisterLog_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CashRegisterLog"
    ADD CONSTRAINT "CashRegisterLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CashRegisterLog CashRegisterLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CashRegisterLog"
    ADD CONSTRAINT "CashRegisterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommissionItem CommissionItem_appliedRuleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionItem"
    ADD CONSTRAINT "CommissionItem_appliedRuleId_fkey" FOREIGN KEY ("appliedRuleId") REFERENCES public."CommissionRule"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CommissionItem CommissionItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionItem"
    ADD CONSTRAINT "CommissionItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommissionItem CommissionItem_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionItem"
    ADD CONSTRAINT "CommissionItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CommissionRule CommissionRule_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionRule"
    ADD CONSTRAINT "CommissionRule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CommissionRule CommissionRule_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionRule"
    ADD CONSTRAINT "CommissionRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CommissionRule CommissionRule_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CommissionRule"
    ADD CONSTRAINT "CommissionRule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CustomerPackage CustomerPackage_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CustomerPackage"
    ADD CONSTRAINT "CustomerPackage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerPackage CustomerPackage_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CustomerPackage"
    ADD CONSTRAINT "CustomerPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public."Package"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CustomerTag CustomerTag_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CustomerTag"
    ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerTag CustomerTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."CustomerTag"
    ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_customerPackageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES public."CustomerPackage"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationHistory NotificationHistory_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationHistory NotificationHistory_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationHistory NotificationHistory_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."NotificationTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationHistory NotificationHistory_triggerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES public."NotificationTrigger"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationProvider NotificationProvider_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationProvider"
    ADD CONSTRAINT "NotificationProvider_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationQueue NotificationQueue_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationQueue"
    ADD CONSTRAINT "NotificationQueue_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationQueue NotificationQueue_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationQueue"
    ADD CONSTRAINT "NotificationQueue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationQueue NotificationQueue_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationQueue"
    ADD CONSTRAINT "NotificationQueue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."NotificationTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationQueue NotificationQueue_triggerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationQueue"
    ADD CONSTRAINT "NotificationQueue_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES public."NotificationTrigger"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationSettings NotificationSettings_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationSettings"
    ADD CONSTRAINT "NotificationSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationTemplate NotificationTemplate_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationTrigger NotificationTrigger_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationTrigger"
    ADD CONSTRAINT "NotificationTrigger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationTrigger NotificationTrigger_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."NotificationTrigger"
    ADD CONSTRAINT "NotificationTrigger_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."NotificationTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PackageService PackageService_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."PackageService"
    ADD CONSTRAINT "PackageService_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public."Package"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PackageService PackageService_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."PackageService"
    ADD CONSTRAINT "PackageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Package Package_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Package"
    ADD CONSTRAINT "Package_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_cashRegisterLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_cashRegisterLogId_fkey" FOREIGN KEY ("cashRegisterLogId") REFERENCES public."CashRegisterLog"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ServiceCategory ServiceCategory_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."ServiceCategory"
    ADD CONSTRAINT "ServiceCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Service Service_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Service Service_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ServiceCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffCommission StaffCommission_commissionItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffCommission"
    ADD CONSTRAINT "StaffCommission_commissionItemId_fkey" FOREIGN KEY ("commissionItemId") REFERENCES public."CommissionItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffCommission StaffCommission_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffCommission"
    ADD CONSTRAINT "StaffCommission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffCommission StaffCommission_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffCommission"
    ADD CONSTRAINT "StaffCommission_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StaffCommission StaffCommission_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffCommission"
    ADD CONSTRAINT "StaffCommission_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffService StaffService_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffService"
    ADD CONSTRAINT "StaffService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffService StaffService_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."StaffService"
    ADD CONSTRAINT "StaffService_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkHour WorkHour_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."WorkHour"
    ADD CONSTRAINT "WorkHour_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkHour WorkHour_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: engin
--

ALTER TABLE ONLY public."WorkHour"
    ADD CONSTRAINT "WorkHour_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

