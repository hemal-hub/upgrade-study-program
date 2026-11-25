export type ClassLevel = '৬ষ্ঠ' | '৭ম' | '৮ম' | '৯ম' | '১০ম' | 'একাদশ';

export type AcademicGroup = 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা';

export type BatchShift =
  | 'সকাল (৭:৩০ - ১০:৩০)'
  | 'বিকাল (৩:০০ - ৬:০০)'
  | 'সন্ধ্যা (৬:১৫ - ৮:৪৫)';

export type DayOfWeek =
  | 'শনিবার'
  | 'রবিবার'
  | 'সোমবার'
  | 'মঙ্গলবার'
  | 'বুধবার'
  | 'বৃহস্পতিবার';

export type NoticeCategory = 'পরীক্ষা' | 'ছুটি' | 'ভর্তি' | 'সাধারণ';

export type NoticeTargetClass = 'সকল শ্রেণি' | ClassLevel;

export type PaymentMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Card';

export type AdmissionStatus = 'pending' | 'approved' | 'rejected';

export type PaymentStatus = 'unpaid' | 'paid' | 'verified';

export type TransactionStatus = 'pending' | 'verified' | 'refunded';

export type UserRole = 'student' | 'teacher' | 'principal';

export type AppView = 'home' | 'classes' | 'notices' | 'admission' | 'dashboard';

export interface ClassProgram {
  classLevel: ClassLevel;
  classCode: string;
  subtitle: string;
  groups: AcademicGroup[];
  coreSubjects: string[];
  monthlyFee: number;
  admissionFee: number;
  weeklyClasses: number;
  modelTestsPerMonth: number;
  leadTeacher: string;
  seatCapacity: number;
  enrolledSeats: number;
}

export interface RoutineEntry {
  id: string;
  classLevel: ClassLevel;
  group: AcademicGroup;
  day: DayOfWeek;
  timeSlot: string;
  subject: string;
  teacherName: string;
  room: string;
  authorId: string;
  createdAt?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  targetClass: NoticeTargetClass;
  pinned: boolean;
  authorId: string;
  authorName: string;
  publishedDate: string;
  createdAt?: string;
}

export interface AdmissionRecord {
  id: string;
  ownerId: string;
  rollNumber: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  schoolName: string;
  classLevel: ClassLevel;
  group: AcademicGroup;
  batchShift: BatchShift;
  monthlyFee: number;
  admissionFee: number;
  status: AdmissionStatus;
  paymentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  admissionId: string;
  ownerId: string;
  studentName: string;
  rollNumber: string;
  classLevel: ClassLevel;
  amount: number;
  method: PaymentMethod;
  senderNumber: string;
  transactionId: string;
  status: TransactionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  roleTitle: string;
  subject: string;
  qualification: string;
  experienceYears: number;
}

export interface StaffMember {
  uid: string;
  name: string;
  role: 'teacher' | 'principal';
  subject: string;
  createdAt?: string;
}

export interface StaffFormInput {
  uid: string;
  name: string;
  role: 'teacher' | 'principal';
  subject: string;
}

export interface AdmissionFormInput {
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  schoolName: string;
  classLevel: ClassLevel;
  group: AcademicGroup;
  batchShift: BatchShift;
}

export interface PaymentFormInput {
  method: PaymentMethod;
  senderNumber: string;
  transactionId: string;
}

export interface NoticeFormInput {
  title: string;
  body: string;
  category: NoticeCategory;
  targetClass: NoticeTargetClass;
  pinned: boolean;
}

export interface RoutineFormInput {
  classLevel: ClassLevel;
  group: AcademicGroup;
  day: DayOfWeek;
  timeSlot: string;
  subject: string;
  teacherName: string;
  room: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface DashboardMetrics {
  totalStudents: number;
  approvedStudents: number;
  pendingStudents: number;
  verifiedRevenue: number;
  pendingRevenue: number;
  totalNotices: number;
  totalRoutines: number;
  classBreakdown: Array<{ classLevel: ClassLevel; count: number }>;
}
