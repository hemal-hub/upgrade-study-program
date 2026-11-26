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

export type AppView = 'home' | 'classes' | 'notices' | 'results' | 'admission' | 'dashboard';

export type GradeLetter = 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';

export interface SectionVisibility {
  heroBanner: boolean;
  programs: boolean;
  noticesAndRoutine: boolean;
  resultsSpotlight: boolean;
  features: boolean;
  faculty: boolean;
  customSections: boolean;
}

export interface ProofItem {
  value: string;
  label: string;
}

export type CustomSectionCtaTarget = 'none' | 'admission' | 'classes' | 'notices' | 'results';

export interface CustomSection {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaTarget: CustomSectionCtaTarget;
  visible: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  bannerUrl: string;
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  proofItems: ProofItem[];
  footerDescription: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  copyrightText: string;
  sectionVisibility: SectionVisibility;
  customSections: CustomSection[];
  adminUsername: string;
  updatedBy?: string;
  updatedAt?: string;
}

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
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianPhone: string;
  studentPhone: string;
  dateOfBirth: string;
  presentAddress: string;
  permanentAddress: string;
  studentPhoto: string;
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

export interface StudentResult {
  id: string;
  admissionId: string;
  studentName: string;
  rollNumber: string;
  studentPhoto: string;
  classLevel: ClassLevel;
  group: AcademicGroup;
  examName: string;
  subject: string;
  fullMarks: number;
  obtainedMarks: number;
  gpa: number;
  grade: GradeLetter;
  remarks: string;
  publishedDate: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RankedStudentResult extends StudentResult {
  meritPosition: number;
  percentage: number;
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

export interface StaffInvite {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'principal';
  subject: string;
  createdBy: string;
  createdAt?: string;
}

export interface StaffInviteFormInput {
  email: string;
  name: string;
  role: 'teacher' | 'principal';
  subject: string;
}

export interface AdmissionFormInput {
  studentName: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianPhone: string;
  studentPhone: string;
  dateOfBirth: string;
  presentAddress: string;
  permanentAddress: string;
  studentPhoto: string;
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

export interface ResultFormInput {
  admissionId: string;
  studentName: string;
  rollNumber: string;
  studentPhoto: string;
  classLevel: ClassLevel;
  group: AcademicGroup;
  examName: string;
  subject: string;
  fullMarks: number;
  obtainedMarks: number;
  remarks: string;
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
