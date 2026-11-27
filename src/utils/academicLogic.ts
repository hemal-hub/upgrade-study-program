import type {
  AcademicGroup,
  AdmissionFormInput,
  AdmissionRecord,
  BatchShift,
  ClassLevel,
  CustomSection,
  DashboardMetrics,
  DayOfWeek,
  GradeLetter,
  NoticeCategory,
  NoticeFormInput,
  NoticeItem,
  NoticeTargetClass,
  PaymentFormInput,
  PaymentRecord,
  RankedStudentResult,
  ResultFormInput,
  RoutineEntry,
  RoutineFormInput,
  SiteSettings,
  StaffFormInput,
  StaffInviteFormInput,
  StudentRegistrationFormInput,
  StudentResult,
  ValidationResult,
} from '../types';

export const CLASS_LEVELS: ClassLevel[] = ['৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম', 'একাদশ'];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'শনিবার',
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
];

export const BATCH_SHIFTS: BatchShift[] = [
  'সকাল (৭:৩০ - ১০:৩০)',
  'বিকাল (৩:০০ - ৬:০০)',
  'সন্ধ্যা (৬:১৫ - ৮:৪৫)',
];

export const NOTICE_CATEGORIES: NoticeCategory[] = ['পরীক্ষা', 'ছুটি', 'ভর্তি', 'সাধারণ'];

const CLASS_CODE_MAP: Record<ClassLevel, string> = {
  '৬ষ্ঠ': '06',
  '৭ম': '07',
  '৮ম': '08',
  '৯ম': '09',
  '১০ম': '10',
  'একাদশ': '11',
};

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// Strict schema patterns mirrored verbatim from firebase-blueprint.json
export const BD_PHONE_REGEX = /^01[3-9][0-9]{8}$/;
export const TRX_ID_REGEX = /^[A-Za-z0-9-]+$/;
export const ROLL_NUMBER_REGEX = /^USP-[0-9A-Z-]+$/;
export const ISO_DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

export function formatBdt(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(Math.round(amount));
  return `৳${toBengaliDigits(formatted)}`;
}

export function getAllowedGroupsForClass(classLevel: ClassLevel): AcademicGroup[] {
  if (classLevel === '৬ষ্ঠ' || classLevel === '৭ম' || classLevel === '৮ম') {
    return ['সাধারণ'];
  }
  return ['বিজ্ঞান', 'ব্যবসায় শিক্ষা', 'মানবিক'];
}

export function calculateFeeBreakdown(
  classLevel: ClassLevel,
  group: AcademicGroup,
): { admissionFee: number; monthlyFee: number; totalPayableNow: number } {
  const baseFees: Record<ClassLevel, { admissionFee: number; monthlyFee: number }> = {
    '৬ষ্ঠ': { admissionFee: 1500, monthlyFee: 1800 },
    '৭ম': { admissionFee: 1500, monthlyFee: 2000 },
    '৮ম': { admissionFee: 2000, monthlyFee: 2200 },
    '৯ম': { admissionFee: 2500, monthlyFee: 2800 },
    '১০ম': { admissionFee: 2500, monthlyFee: 3000 },
    'একাদশ': { admissionFee: 3500, monthlyFee: 3800 },
  };

  const base = baseFees[classLevel];
  const scienceLabExtra =
    (classLevel === '৯ম' || classLevel === '১০ম' || classLevel === 'একাদশ') &&
    group === 'বিজ্ঞান'
      ? 400
      : 0;

  const monthlyFee = base.monthlyFee + scienceLabExtra;
  const admissionFee = base.admissionFee;
  return {
    admissionFee,
    monthlyFee,
    totalPayableNow: admissionFee + monthlyFee,
  };
}

export function generateRollNumber(classLevel: ClassLevel, sequence: number, year = 2026): string {
  const code = CLASS_CODE_MAP[classLevel];
  const paddedSeq = String(Math.max(1, Math.floor(sequence))).padStart(4, '0');
  return `USP-${code}-${year}-${paddedSeq}`;
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

export function validateAdmissionInput(input: AdmissionFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const studentName = sanitizeText(input.studentName, 100);
  const fatherName = sanitizeText(input.fatherName, 100);
  const motherName = sanitizeText(input.motherName, 100);
  const guardianName = sanitizeText(input.guardianName, 100);
  const guardianPhone = input.guardianPhone.trim().replace(/[\s-]/g, '');
  const studentPhone = input.studentPhone.trim().replace(/[\s-]/g, '');
  const dateOfBirth = input.dateOfBirth.trim();
  const presentAddress = sanitizeText(input.presentAddress, 300);
  const permanentAddress = sanitizeText(input.permanentAddress, 300);
  const schoolName = sanitizeText(input.schoolName, 150);

  if (!input.studentPhoto || input.studentPhoto.trim().length < 10) {
    errors.studentPhoto = 'শিক্ষার্থীর পাসপোর্ট সাইজ ছবি আপলোড করুন।';
  }
  if (studentName.length < 2) {
    errors.studentName = 'শিক্ষার্থীর পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (fatherName.length < 2) {
    errors.fatherName = 'পিতার নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (motherName.length < 2) {
    errors.motherName = 'মাতার নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (guardianName.length < 2) {
    errors.guardianName = 'অভিভাবকের নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (!ISO_DATE_REGEX.test(dateOfBirth)) {
    errors.dateOfBirth = 'শিক্ষার্থীর সঠিক জন্ম তারিখ নির্বাচন করুন।';
  }
  if (!BD_PHONE_REGEX.test(guardianPhone)) {
    errors.guardianPhone = 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।';
  }
  if (studentPhone.length > 0 && !BD_PHONE_REGEX.test(studentPhone)) {
    errors.studentPhone = 'শিক্ষার্থীর মোবাইল নম্বর দিলে তা ১১ সংখ্যার হতে হবে (01XXXXXXXXX)।';
  }
  if (presentAddress.length < 3) {
    errors.presentAddress = 'শিক্ষার্থীর বর্তমান ঠিকানা বিস্তারিত লিখুন।';
  }
  if (permanentAddress.length < 3) {
    errors.permanentAddress = 'শিক্ষার্থীর স্থায়ী ঠিকানা বিস্তারিত লিখুন।';
  }
  if (schoolName.length < 2) {
    errors.schoolName = 'বর্তমান স্কুল বা কলেজের নাম লিখুন।';
  }
  const allowedGroups = getAllowedGroupsForClass(input.classLevel);
  if (!allowedGroups.includes(input.group)) {
    errors.group = `${input.classLevel} শ্রেণির জন্য সঠিক বিভাগ নির্বাচন করুন।`;
  }
  if (!BATCH_SHIFTS.includes(input.batchShift)) {
    errors.batchShift = 'সঠিক ব্যাচ সময় নির্বাচন করুন।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePaymentInput(input: PaymentFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const senderNumber = input.senderNumber.trim().replace(/[\s-]/g, '');
  const transactionId = input.transactionId.trim().toUpperCase();

  if (input.method === 'Card') {
    if (!/^[0-9]{4,19}$/.test(senderNumber)) {
      errors.senderNumber = 'কার্ডের শেষ ৪ সংখ্যা বা সঠিক কার্ড নম্বর দিন।';
    }
  } else if (!BD_PHONE_REGEX.test(senderNumber)) {
    errors.senderNumber = `${input.method} প্রেরক নম্বরটি ১১ সংখ্যার হতে হবে (01XXXXXXXXX)।`;
  }

  if (transactionId.length < 6 || transactionId.length > 40 || !TRX_ID_REGEX.test(transactionId)) {
    errors.transactionId = 'সঠিক ট্রানজেকশন আইডি (TrxID) দিন (কমপক্ষে ৬ অক্ষর, শুধু ইংরেজি অক্ষর ও সংখ্যা)।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateNoticeInput(input: NoticeFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const title = sanitizeText(input.title, 180);
  const body = input.body.trim();

  if (title.length < 3) {
    errors.title = 'নোটিশের শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে।';
  }
  if (body.length < 10 || body.length > 2000) {
    errors.body = 'নোটিশের বিস্তারিত ১০ থেকে ২০০০ অক্ষরের মধ্যে হতে হবে।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRoutineInput(input: RoutineFormInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (sanitizeText(input.timeSlot, 60).length < 3) {
    errors.timeSlot = 'ক্লাসের সময়সীমা উল্লেখ করুন (যেমন: বিকাল ৩:৩০ - ৪:৩০)।';
  }
  if (sanitizeText(input.subject, 80).length < 2) {
    errors.subject = 'বিষয়ের নাম লিখুন।';
  }
  if (sanitizeText(input.teacherName, 100).length < 2) {
    errors.teacherName = 'শিক্ষকের নাম লিখুন।';
  }
  if (sanitizeText(input.room, 40).length < 2) {
    errors.room = 'কক্ষ নম্বর লিখুন (যেমন: কক্ষ-২০২)।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateBangladeshiGrade(
  obtainedMarks: number,
  fullMarks: number,
): { gpa: number; grade: GradeLetter; percentage: number; passed: boolean } {
  const safeFull = Math.max(1, fullMarks);
  const clamped = Math.max(0, Math.min(safeFull, obtainedMarks));
  const percentage = Number(((clamped / safeFull) * 100).toFixed(1));

  if (percentage >= 80) return { gpa: 5.0, grade: 'A+', percentage, passed: true };
  if (percentage >= 70) return { gpa: 4.0, grade: 'A', percentage, passed: true };
  if (percentage >= 60) return { gpa: 3.5, grade: 'A-', percentage, passed: true };
  if (percentage >= 50) return { gpa: 3.0, grade: 'B', percentage, passed: true };
  if (percentage >= 40) return { gpa: 2.0, grade: 'C', percentage, passed: true };
  if (percentage >= 33) return { gpa: 1.0, grade: 'D', percentage, passed: true };
  return { gpa: 0.0, grade: 'F', percentage, passed: false };
}

export function validateResultInput(input: ResultFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (sanitizeText(input.examName, 120).length < 2) {
    errors.examName = 'পরীক্ষার নাম লিখুন (যেমন: মাসিক মডেল টেস্ট — নভেম্বর ২০২৬)।';
  }
  if (sanitizeText(input.subject, 100).length < 2) {
    errors.subject = 'বিষয় বা পরীক্ষার ধরন লিখুন।';
  }
  if (!Number.isFinite(input.fullMarks) || input.fullMarks < 10 || input.fullMarks > 1000) {
    errors.fullMarks = 'পূর্ণমান ১০ থেকে ১০০০-এর মধ্যে হতে হবে।';
  }
  if (
    !Number.isFinite(input.obtainedMarks) ||
    input.obtainedMarks < 0 ||
    input.obtainedMarks > input.fullMarks
  ) {
    errors.obtainedMarks = `প্রাপ্ত নম্বর ০ থেকে ${toBengaliDigits(input.fullMarks)}-এর মধ্যে হতে হবে।`;
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function rankResultsWithMerit(results: StudentResult[]): RankedStudentResult[] {
  const sorted = [...results].sort((a, b) => {
    const pctA = a.fullMarks > 0 ? a.obtainedMarks / a.fullMarks : 0;
    const pctB = b.fullMarks > 0 ? b.obtainedMarks / b.fullMarks : 0;
    if (pctB !== pctA) return pctB - pctA;
    return b.obtainedMarks - a.obtainedMarks;
  });

  return sorted.map((item, idx) => ({
    ...item,
    meritPosition: idx + 1,
    percentage: item.fullMarks > 0 ? Number(((item.obtainedMarks / item.fullMarks) * 100).toFixed(1)) : 0,
  }));
}

export function groupStudentsByClass(
  admissions: AdmissionRecord[],
): Record<ClassLevel, AdmissionRecord[]> {
  const grouped: Record<ClassLevel, AdmissionRecord[]> = {
    '৬ষ্ঠ': [],
    '৭ম': [],
    '৮ম': [],
    '৯ম': [],
    '১০ম': [],
    'একাদশ': [],
  };
  for (const adm of admissions) {
    if (grouped[adm.classLevel]) {
      grouped[adm.classLevel].push(adm);
    }
  }
  return grouped;
}

export function validateCustomSectionInput(
  input: Omit<CustomSection, 'id'>,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (sanitizeText(input.title, 120).length < 2) {
    errors.title = 'সেকশনের শিরোনাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (input.body.trim().length < 5) {
    errors.body = 'সেকশনের বিবরণ কমপক্ষে ৫ অক্ষরের হতে হবে।';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSiteSettingsInput(input: SiteSettings): ValidationResult {
  const errors: Record<string, string> = {};
  if (sanitizeText(input.siteName, 100).length < 2) {
    errors.siteName = 'প্রতিষ্ঠানের নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (sanitizeText(input.heroTitle, 220).length < 3) {
    errors.heroTitle = 'হিরো শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে।';
  }
  if (sanitizeText(input.contactPhone, 80).length < 4) {
    errors.contactPhone = 'যোগাযোগের মোবাইল নম্বর দিন।';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function filterAndSortRoutines(
  routines: RoutineEntry[],
  options: {
    classLevel?: ClassLevel | 'সকল';
    group?: AcademicGroup | 'সকল';
    day?: DayOfWeek | 'সকল';
  },
): RoutineEntry[] {
  const filtered = routines.filter((item) => {
    if (options.classLevel && options.classLevel !== 'সকল' && item.classLevel !== options.classLevel) {
      return false;
    }
    if (options.group && options.group !== 'সকল' && item.group !== options.group) {
      return false;
    }
    if (options.day && options.day !== 'সকল' && item.day !== options.day) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    const dayDiff = DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.timeSlot.localeCompare(b.timeSlot, 'bn');
  });
}

export function filterAndSortNotices(
  notices: NoticeItem[],
  options: {
    category?: NoticeCategory | 'সকল';
    targetClass?: NoticeTargetClass | 'সকল';
    search?: string;
  },
): NoticeItem[] {
  const query = (options.search ?? '').trim().toLowerCase();

  const filtered = notices.filter((notice) => {
    if (options.category && options.category !== 'সকল' && notice.category !== options.category) {
      return false;
    }
    if (
      options.targetClass &&
      options.targetClass !== 'সকল' &&
      notice.targetClass !== 'সকল শ্রেণি' &&
      notice.targetClass !== options.targetClass
    ) {
      return false;
    }
    if (query) {
      const haystack = `${notice.title} ${notice.body} ${notice.authorName}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
}

export function findStudentAdmission(
  admissions: AdmissionRecord[],
  query: string,
): AdmissionRecord | undefined {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return undefined;
  return admissions.find(
    (adm) =>
      adm.rollNumber.toLowerCase() === normalized ||
      adm.guardianPhone.replace(/[\s-]/g, '') === normalized ||
      (adm.studentPhone && adm.studentPhone.replace(/[\s-]/g, '') === normalized),
  );
}

export function computeDashboardMetrics(
  admissions: AdmissionRecord[],
  payments: PaymentRecord[],
  notices: NoticeItem[],
  routines: RoutineEntry[],
): DashboardMetrics {
  const approvedStudents = admissions.filter((a) => a.status === 'approved').length;
  const pendingStudents = admissions.filter((a) => a.status === 'pending').length;

  const verifiedRevenue = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const classBreakdown = CLASS_LEVELS.map((classLevel) => ({
    classLevel,
    count: admissions.filter((a) => a.classLevel === classLevel).length,
  }));

  return {
    totalStudents: admissions.length,
    approvedStudents,
    pendingStudents,
    verifiedRevenue,
    pendingRevenue,
    totalNotices: notices.length,
    totalRoutines: routines.length,
    classBreakdown,
  };
}

export function canAccessDashboard(
  isAuthenticated: boolean,
  emailVerified: boolean,
  role: 'student' | 'teacher' | 'principal',
): boolean {
  return isAuthenticated && emailVerified && (role === 'principal' || role === 'teacher');
}

export function canManageStaff(
  isAuthenticated: boolean,
  emailVerified: boolean,
  role: 'student' | 'teacher' | 'principal',
): boolean {
  return isAuthenticated && emailVerified && role === 'principal';
}

export function validateStaffInput(input: {
  uid: string;
  name: string;
  role: 'teacher' | 'principal';
  subject: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  const uid = input.uid.trim();
  const name = sanitizeText(input.name, 100);
  const subject = sanitizeText(input.subject, 80);

  if (!/^[a-zA-Z0-9_-]{4,128}$/.test(uid)) {
    errors.uid = 'সঠিক শিক্ষক UID দিন (শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, _ বা -)।';
  }
  if (name.length < 2) {
    errors.name = 'শিক্ষকের পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (subject.length < 2) {
    errors.subject = 'পাঠদানের বিষয় উল্লেখ করুন।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;
export const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveLoginEmail(
  identifier: string,
  adminUsername: string,
  principalEmail: string,
): string | null {
  const cleaned = identifier.trim();
  if (!cleaned) return null;

  if (cleaned.includes('@')) {
    return SIMPLE_EMAIL_REGEX.test(cleaned) ? cleaned.toLowerCase() : null;
  }

  const normalizedAdmin = (adminUsername || 'admin').trim().toLowerCase();
  if (cleaned.toLowerCase() === normalizedAdmin) {
    return principalEmail.toLowerCase();
  }

  return null;
}

export function validateLoginCredentials(identifier: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmedId = identifier.trim();

  if (trimmedId.length < 3) {
    errors.identifier = 'সঠিক ইউজারনেম অথবা ইমেইল লিখুন।';
  }
  if (password.length < 6) {
    errors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateUsernameChange(newUsername: string): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmed = newUsername.trim();

  if (!USERNAME_REGEX.test(trimmed)) {
    errors.username =
      'ইউজারনেম ৩ থেকে ৩২ অক্ষরের হতে হবে (শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, _ অথবা - ব্যবহার করুন)।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  requireCurrent: boolean,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (requireCurrent && currentPassword.length < 6) {
    errors.currentPassword = 'আপনার বর্তমান পাসওয়ার্ড লিখুন।';
  }
  if (newPassword.length < 8) {
    errors.newPassword = 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।';
  }
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePasswordResetInput(identifier: string): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmed = identifier.trim();

  if (!trimmed) {
    errors.identifier = 'পাসওয়ার্ড রিসেট করতে আপনার নিবন্ধিত ইমেইল অথবা ইউজারনেম লিখুন।';
  } else if (trimmed.includes('@')) {
    if (!SIMPLE_EMAIL_REGEX.test(trimmed)) {
      errors.identifier = 'সঠিক ইমেইল ঠিকানা লিখুন (যেমন: teacher@example.com)।';
    }
  } else if (!USERNAME_REGEX.test(trimmed)) {
    errors.identifier =
      'সঠিক ইউজারনেম (৩–৩২ অক্ষর) অথবা ইমেইল ঠিকানা লিখুন।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function maskEmailAddress(email: string): string {
  const cleaned = email.trim();
  const atIndex = cleaned.indexOf('@');
  if (atIndex <= 0 || atIndex === cleaned.length - 1) return cleaned;

  const local = cleaned.slice(0, atIndex);
  const domain = cleaned.slice(atIndex + 1);
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function emailToInviteId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function validateStaffInviteInput(
  input: StaffInviteFormInput,
  rootAdminEmail: string,
): ValidationResult {
  const errors: Record<string, string> = {};
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const subject = input.subject.trim();

  if (!email || email.length < 5 || email.length > 120 || !SIMPLE_EMAIL_REGEX.test(email)) {
    errors.email = 'অ্যাডমিনের সঠিক ইমেইল ঠিকানা লিখুন (সর্বোচ্চ ১২০ অক্ষর)।';
  } else if (email === rootAdminEmail.trim().toLowerCase()) {
    errors.email = 'এই ইমেইলটি আগে থেকেই মূল অ্যাডমিন হিসেবে সুরক্ষিত আছে।';
  }

  if (name.length < 2 || name.length > 100) {
    errors.name = 'অ্যাডমিনের পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }

  if (subject.length < 2 || subject.length > 80) {
    errors.subject = 'পদবি বা দায়িত্বের বিবরণ লিখুন (যেমন: অফিস অ্যাডমিন)।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateFirstTimeSetupInput(
  identifier: string,
  password: string,
  confirmPassword: string,
): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmed = identifier.trim();
  if (!trimmed) {
    errors.identifier = 'পাসওয়ার্ড সেট করতে আপনার নিজস্ব ইমেইল অথবা মূল অ্যাডমিন ইউজারনেম লিখুন।';
  } else {
    const idCheck = validatePasswordResetInput(trimmed);
    if (!idCheck.valid) {
      errors.identifier =
        idCheck.errors.identifier || 'সঠিক ইমেইল ঠিকানা অথবা মূল অ্যাডমিন ইউজারনেম লিখুন।';
    }
  }
  if (password.length < 8) {
    errors.password = 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।';
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'পাসওয়ার্ড দুটি মেলেনি।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const STUDENT_AUTH_EMAIL_DOMAIN = 'students.usp-academy.edu.bd';
export const STUDENT_USERNAME_REGEX = /^[a-z0-9_-]{3,32}$/;

export function normalizeStudentUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function studentUsernameToAuthEmail(username: string): string {
  return `${normalizeStudentUsername(username)}@${STUDENT_AUTH_EMAIL_DOMAIN}`;
}

export function isStudentAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const cleaned = email.trim().toLowerCase();
  const suffix = `@${STUDENT_AUTH_EMAIL_DOMAIN}`;
  if (!cleaned.endsWith(suffix)) return false;
  const local = cleaned.slice(0, -suffix.length);
  return STUDENT_USERNAME_REGEX.test(local);
}

export function validateStudentRegistrationInput(
  input: StudentRegistrationFormInput,
): ValidationResult {
  const errors: Record<string, string> = {};
  const studentName = sanitizeText(input.studentName, 100);
  const fatherName = sanitizeText(input.fatherName, 100);
  const motherName = sanitizeText(input.motherName, 100);
  const guardianPhone = input.guardianPhone.replace(/[\s-]/g, '');
  const username = normalizeStudentUsername(input.username);
  const allowedGroups = getAllowedGroupsForClass(input.classLevel);

  if (
    !input.studentPhoto ||
    input.studentPhoto.trim().length < 10 ||
    input.studentPhoto.length > 180000
  ) {
    errors.studentPhoto = 'শিক্ষার্থীর পাসপোর্ট সাইজের ছবি আপলোড করুন।';
  }
  if (!CLASS_LEVELS.includes(input.classLevel)) {
    errors.classLevel = 'সঠিক শ্রেণি নির্বাচন করুন।';
  }
  if (!allowedGroups.includes(input.group)) {
    errors.group =
      input.classLevel === '৯ম' || input.classLevel === '১০ম' || input.classLevel === 'একাদশ'
        ? '৯ম থেকে একাদশ শ্রেণির জন্য সঠিক বিভাগ (বিজ্ঞান, ব্যবসায় শিক্ষা বা মানবিক) নির্বাচন করুন।'
        : 'এই শ্রেণির জন্য সাধারণ বিভাগ প্রযোজ্য।';
  }
  if (studentName.length < 2) {
    errors.studentName = 'শিক্ষার্থীর পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (input.gender !== 'ছেলে' && input.gender !== 'মেয়ে') {
    errors.gender = 'ছেলে অথবা মেয়ে — যেকোনো একটিতে টিক চিহ্ন দিন।';
  }
  if (fatherName.length < 2) {
    errors.fatherName = 'পিতার নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (motherName.length < 2) {
    errors.motherName = 'মাতার নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (!BD_PHONE_REGEX.test(guardianPhone)) {
    errors.guardianPhone = 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
  }
  if (!STUDENT_USERNAME_REGEX.test(username)) {
    errors.username =
      'ইউজারনেম ৩ থেকে ৩২ অক্ষরের হতে হবে (শুধুমাত্র ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, _ অথবা -)।';
  }
  if (input.password.length < 8) {
    errors.password = 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।';
  }
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'পাসওয়ার্ড এবং রি-টাইপ পাসওয়ার্ড মেলেনি।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStudentLoginInput(username: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  const normalized = normalizeStudentUsername(username);
  if (!STUDENT_USERNAME_REGEX.test(normalized)) {
    errors.username = 'সঠিক ইউজারনেম লিখুন (ইংরেজি অক্ষর, সংখ্যা, _ বা -)।';
  }
  if (password.length < 6) {
    errors.password = 'সঠিক পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)।';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}




