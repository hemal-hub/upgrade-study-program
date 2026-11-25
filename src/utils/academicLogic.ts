import type {
  AcademicGroup,
  AdmissionFormInput,
  AdmissionRecord,
  BatchShift,
  ClassLevel,
  DashboardMetrics,
  DayOfWeek,
  NoticeCategory,
  NoticeFormInput,
  NoticeItem,
  NoticeTargetClass,
  PaymentFormInput,
  PaymentRecord,
  RoutineEntry,
  RoutineFormInput,
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
  const guardianName = sanitizeText(input.guardianName, 100);
  const guardianPhone = input.guardianPhone.trim().replace(/[\s-]/g, '');
  const schoolName = sanitizeText(input.schoolName, 150);

  if (studentName.length < 2) {
    errors.studentName = 'শিক্ষার্থীর পূর্ণ নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (guardianName.length < 2) {
    errors.guardianName = 'অভিভাবকের নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  }
  if (!BD_PHONE_REGEX.test(guardianPhone)) {
    errors.guardianPhone = 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।';
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
      adm.guardianPhone.replace(/[\s-]/g, '') === normalized,
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

