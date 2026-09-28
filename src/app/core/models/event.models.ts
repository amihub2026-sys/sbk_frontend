export interface Category {
  id: string;
  name: string;
  nameTa: string;
  minMonths: number;
  maxMonths: number;
}


export interface Slot {
  id: string;
  name: string;
  date: string;
  start: string;
  end: string;
  venue: string;
  active?: boolean;
}


export type CompetitionKind =
  | "Art"
  | "Writing"
  | "Speaking"
  | "Quiz";


export interface Competition {
  id: string;
  name: string;
  tamil: string;
  kind: CompetitionKind;
  categoryIds: string[];
  fee: number;
  slotId: string;
  capacity: number;
  status: "Open" | "Closed";
  instructions: string;
  instructionsTa: string;
  language: string;
  image: string;
  registeredCount?: number;
}


export interface Student {
  name: string;
  fatherName: string;
  school: string;
  dob: string;
  email: string;
  phone: string;

  /**
   * Frontend preview may initially use a data URL.
   * Backend replaces it with the stored media URL.
   */
  photo?: string;
}


export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "RefundPending"
  | "Refunded";


export type PaymentRecordStatus =
  | "Created"
  | "Pending"
  | "Paid"
  | "Failed"
  | "RefundPending"
  | "Refunded";


export type RegistrationStatus =
  | "Payment Pending"
  | "Review Required"
  | "Confirmed"
  | "Rejected"
  | "Cancelled";


export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Correction requested"
  | "Rejected";


export type PassStatus =
  | "Pending"
  | "Generated"
  | "Email Sent"
  | "Email Failed";


export type CompetitionAttendance =
  | "Not marked"
  | "Present"
  | "Absent";


/**
 * ======================================================
 * PAYMENT RECORD
 * ======================================================
 */

export interface PaymentRecord {
  id: string;

  registrationId: string;

  provider: string;

  providerRef: string;

  transactionId: string;

  providerOrderId: string;

  amount: number;

  currency: string;

  status: PaymentRecordStatus;

  paymentMethod: string;

  paidAt: string | null;

  failedAt: string | null;

  refundedAt: string | null;

  verifiedAt: string | null;

  failureCode: string;

  failureReason: string;

  createdAt?: string | null;

  updatedAt?: string | null;
}


/**
 * ======================================================
 * REGISTRATION
 * ======================================================
 */

export interface Registration extends Student {
  id: string;

  applicationNo: string;

  categoryId: string;

  applicationDate: string;

  submittedOn: string;

  competitionIds: string[];

  feeSnapshot: {
    competitionId: string;
    fee: number;
  }[];


  /**
   * Expected / calculated competition fee.
   */
  total: number;


  /**
   * Actual amount received.
   *
   * Paper / Cash:
   * manually entered by Admin.
   *
   * Online:
   * can come from verified payment.
   *
   * Optional temporarily for compatibility
   * with older/demo registrations.
   */
  amountPaid?: number;


  /**
   * ======================================================
   * PAYMENT
   * ======================================================
   */

  payment: PaymentStatus;

  paymentMethod:
    | "Online"
    | "Cash";

  paymentConfirmedAt?: string | null;

  lastPaymentRecordId?: string;


  /**
   * Latest backend payment transaction.
   *
   * Admin state provides this.
   */
  latestPayment?: PaymentRecord | null;


  /**
   * Complete payment-attempt history.
   *
   * Admin state provides this.
   */
  paymentRecords?: PaymentRecord[];


  /**
   * ======================================================
   * REGISTRATION STATE
   * ======================================================
   */

  registrationStatus?: RegistrationStatus;

  approval: ApprovalStatus;

  reviewNote: string;

  approvedAt: string | null;

  cancelled: boolean;


  /**
   * ======================================================
   * PASS / EMAIL
   * ======================================================
   */

  qrToken: string;

  emailStatus:
    | "Pending"
    | "Ready"
    | "Sent"
    | "Failed";

  passStatus?: PassStatus;

  passGeneratedAt?: string | null;

  passEmailSentAt?: string | null;


  /**
   * ======================================================
   * EVENT
   * ======================================================
   */

  checkedInAt: string | null;

  competitionAttendance?: Record<
    string,
    CompetitionAttendance
  >;


  /**
   * ======================================================
   * REGISTRATION META
   * ======================================================
   */

  language:
    | "ta"
    | "en";

  source:
    | "Online"
    | "Paper";
}


/**
 * ======================================================
 * JUDGE
 * ======================================================
 */

export interface Judge {
  id: string;

  name: string;

  email: string;

  phone: string;

  competitionIds: string[];

  active: boolean;

  temporaryPassword: string;
}


/**
 * ======================================================
 * SCORE
 * ======================================================
 */

export interface Score {
  id: string;

  registrationId: string;

  competitionId: string;

  judgeId: string;

  mark: number;

  notes: string;

  savedAt: string;
}


/**
 * ======================================================
 * EVENT SETTINGS
 * ======================================================
 */

export interface Settings {
  title: string;

  titleTa: string;

  presenters: string;

  date: string;

  venue: string;

  registrationDeadline: string;

  maxEvents: number;

  registrationOpen: boolean;

  prefix: string;

  contact: string;

  email: string;

  instructionsEn: string;

  instructionsTa: string;

  termsEn: string;

  termsTa: string;

  bannerImage: string;
}


/**
 * ======================================================
 * EVENT STATE
 * ======================================================
 */

export interface EventState {
  categories: Category[];

  slots: Slot[];

  competitions: Competition[];

  registrations: Registration[];

  judges: Judge[];

  scores: Score[];

  settings: Settings;


  /**
   * Admin API provides payment records.
   *
   * Optional so public/demo state continues
   * working without payment history.
   */
  paymentRecords?: PaymentRecord[];
}


/**
 * ======================================================
 * SESSION
 * ======================================================
 */

export interface Session {
  name: string;

  role:
    | "admin"
    | "judge";

  judgeId?: string;
}