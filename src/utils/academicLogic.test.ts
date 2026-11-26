import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBangladeshiGrade,
  calculateFeeBreakdown,
  canAccessDashboard,
  canManageStaff,
  computeDashboardMetrics,
  filterAndSortNotices,
  filterAndSortRoutines,
  findStudentAdmission,
  formatBdt,
  generateRollNumber,
  getAllowedGroupsForClass,
  groupStudentsByClass,
  rankResultsWithMerit,
  resolveLoginEmail,
  ROLL_NUMBER_REGEX,
  toBengaliDigits,
  validateAdmissionInput,
  validateCustomSectionInput,
  validateLoginCredentials,
  validateNoticeInput,
  validatePasswordChange,
  validatePaymentInput,
  validateResultInput,
  validateRoutineInput,
  validateSiteSettingsInput,
  validateStaffInput,
  validateUsernameChange,
} from './academicLogic';
import { DEFAULT_SITE_SETTINGS } from '../data/seedData';
import type { AdmissionRecord, NoticeItem, PaymentRecord, RoutineEntry, StudentResult } from '../types';

test('fee breakdown calculates base fees and adds science lab fee for class 9-11 science', () => {
  const class6 = calculateFeeBreakdown('৬ষ্ঠ', 'সাধারণ');
  assert.deepEqual(class6, { admissionFee: 1500, monthlyFee: 1800, totalPayableNow: 3300 });

  const class9Science = calculateFeeBreakdown('৯ম', 'বিজ্ঞান');
  assert.deepEqual(class9Science, { admissionFee: 2500, monthlyFee: 3200, totalPayableNow: 5700 });

  const class11Humanities = calculateFeeBreakdown('একাদশ', 'মানবিক');
  assert.deepEqual(class11Humanities, { admissionFee: 3500, monthlyFee: 3800, totalPayableNow: 7300 });
});

test('roll number generator produces schema-compliant IDs for every class', () => {
  const roll = generateRollNumber('একাদশ', 42, 2026);
  assert.equal(roll, 'USP-11-2026-0042');
  assert.match(roll, ROLL_NUMBER_REGEX);
});

test('Bengali numeral and BDT currency formatting work accurately', () => {
  assert.equal(toBengaliDigits('2026'), '২০২৬');
  assert.equal(formatBdt(5700), '৳৫,৭০০');
});

test('admission validation enforces photo, parents, DOB, phone, and addresses', () => {
  const invalid = validateAdmissionInput({
    studentName: '',
    fatherName: 'ক',
    motherName: '',
    guardianName: 'ক',
    guardianPhone: '12345',
    studentPhone: '999',
    dateOfBirth: '',
    presentAddress: '',
    permanentAddress: 'a',
    studentPhoto: '',
    schoolName: '',
    classLevel: '৬ষ্ঠ',
    group: 'বিজ্ঞান',
    batchShift: 'বিকাল (৩:০০ - ৬:০০)',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.studentPhoto);
  assert.ok(invalid.errors.studentName);
  assert.ok(invalid.errors.fatherName);
  assert.ok(invalid.errors.motherName);
  assert.ok(invalid.errors.guardianName);
  assert.ok(invalid.errors.guardianPhone);
  assert.ok(invalid.errors.studentPhone);
  assert.ok(invalid.errors.dateOfBirth);
  assert.ok(invalid.errors.presentAddress);
  assert.ok(invalid.errors.permanentAddress);
  assert.ok(invalid.errors.schoolName);
  assert.ok(invalid.errors.group);

  const valid = validateAdmissionInput({
    studentName: 'তানভীর আহমেদ',
    fatherName: 'মোঃ রফিকুল ইসলাম',
    motherName: 'সালমা বেগম',
    guardianName: 'মোঃ রফিকুল ইসলাম',
    guardianPhone: '01712345678',
    studentPhone: '01812345678',
    dateOfBirth: '2011-05-12',
    presentAddress: 'বাড়ি ১২, ধানমন্ডি, ঢাকা',
    permanentAddress: 'গ্রাম: সোনারগাঁও, নারায়ণগঞ্জ',
    studentPhoto: 'data:image/jpeg;base64,abc1234567890',
    schoolName: 'ঢাকা রেসিডেনসিয়াল মডেল কলেজ',
    classLevel: '৯ম',
    group: 'বিজ্ঞান',
    batchShift: 'বিকাল (৩:০০ - ৬:০০)',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('payment validation enforces BD phone for mobile wallets and alphanumeric TrxID', () => {
  const badBkash = validatePaymentInput({
    method: 'bKash',
    senderNumber: '011111',
    transactionId: 'ab',
  });
  assert.equal(badBkash.valid, false);
  assert.ok(badBkash.errors.senderNumber);
  assert.ok(badBkash.errors.transactionId);

  const goodNagad = validatePaymentInput({
    method: 'Nagad',
    senderNumber: '01819223344',
    transactionId: 'NGD9928374A',
  });
  assert.equal(goodNagad.valid, true);
});

test('notice and routine validators catch short/empty fields', () => {
  assert.equal(
    validateNoticeInput({
      title: 'হাই',
      body: 'ছোট',
      category: 'পরীক্ষা',
      targetClass: 'সকল শ্রেণি',
      pinned: false,
    }).valid,
    false,
  );
  assert.equal(
    validateRoutineInput({
      classLevel: '১০ম',
      group: 'বিজ্ঞান',
      day: 'শনিবার',
      timeSlot: '',
      subject: 'পদার্থবিজ্ঞান',
      teacherName: 'মোঃ কামরুল হাসান',
      room: 'কক্ষ-৩০১',
    }).valid,
    false,
  );
});

test('Bangladeshi GPA grading, result validation, and merit ranking work accurately', () => {
  assert.deepEqual(calculateBangladeshiGrade(85, 100), {
    gpa: 5.0,
    grade: 'A+',
    percentage: 85,
    passed: true,
  });
  assert.deepEqual(calculateBangladeshiGrade(72, 100), {
    gpa: 4.0,
    grade: 'A',
    percentage: 72,
    passed: true,
  });
  assert.deepEqual(calculateBangladeshiGrade(32, 100), {
    gpa: 0.0,
    grade: 'F',
    percentage: 32,
    passed: false,
  });

  const badResult = validateResultInput({
    admissionId: 'adm-1',
    studentName: 'রাহাত',
    rollNumber: 'USP-09-2026-0001',
    studentPhoto: '',
    classLevel: '৯ম',
    group: 'বিজ্ঞান',
    examName: '',
    subject: 'গণিত',
    fullMarks: 100,
    obtainedMarks: 120,
    remarks: '',
  });
  assert.equal(badResult.valid, false);
  assert.ok(badResult.errors.examName);
  assert.ok(badResult.errors.obtainedMarks);

  const results: StudentResult[] = [
    {
      id: 'res-1',
      admissionId: 'a1',
      studentName: 'শিক্ষার্থী ১',
      rollNumber: 'USP-09-2026-0001',
      studentPhoto: '',
      classLevel: '৯ম',
      group: 'বিজ্ঞান',
      examName: 'মডেল টেস্ট ১',
      subject: 'গণিত',
      fullMarks: 100,
      obtainedMarks: 74,
      gpa: 4.0,
      grade: 'A',
      remarks: '',
      publishedDate: '২৫ নভেম্বর ২০২৬',
      authorId: 'p1',
    },
    {
      id: 'res-2',
      admissionId: 'a2',
      studentName: 'শিক্ষার্থী ২',
      rollNumber: 'USP-09-2026-0002',
      studentPhoto: '',
      classLevel: '৯ম',
      group: 'বিজ্ঞান',
      examName: 'মডেল টেস্ট ১',
      subject: 'গণিত',
      fullMarks: 100,
      obtainedMarks: 91,
      gpa: 5.0,
      grade: 'A+',
      remarks: 'অসাধারণ',
      publishedDate: '২৫ নভেম্বর ২০২৬',
      authorId: 'p1',
    },
  ];
  const ranked = rankResultsWithMerit(results);
  assert.equal(ranked[0].id, 'res-2');
  assert.equal(ranked[0].meritPosition, 1);
  assert.equal(ranked[1].meritPosition, 2);
});

test('CMS custom section and site settings validation catch invalid payloads', () => {
  assert.equal(
    validateCustomSectionInput({
      title: '',
      subtitle: '',
      body: 'abc',
      imageUrl: '',
      ctaLabel: '',
      ctaTarget: 'none',
      visible: true,
    }).valid,
    false,
  );
  assert.equal(
    validateCustomSectionInput({
      title: 'বিশেষ স্কলারশিপ প্রোগ্রাম',
      subtitle: 'মেধাবীদের জন্য',
      body: 'মডেল টেস্টে শীর্ষ ৫ জন শিক্ষার্থী পাবে ৫০% পর্যন্ত বৃত্তি।',
      imageUrl: '',
      ctaLabel: 'আবেদন করুন',
      ctaTarget: 'admission',
      visible: true,
    }).valid,
    true,
  );
  assert.equal(validateSiteSettingsInput(DEFAULT_SITE_SETTINGS).valid, true);
});

test('routine filtering sorts chronologically by weekday and filters by class', () => {
  const sample: RoutineEntry[] = [
    {
      id: 'r1',
      classLevel: '৯ম',
      group: 'বিজ্ঞান',
      day: 'সোমবার',
      timeSlot: 'বিকাল ৪:০০ - ৫:০০',
      subject: 'রসায়ন',
      teacherName: 'ফারহানা আক্তার',
      room: 'কক্ষ-২০২',
      authorId: 'staff1',
    },
    {
      id: 'r2',
      classLevel: '৯ম',
      group: 'বিজ্ঞান',
      day: 'শনিবার',
      timeSlot: 'বিকাল ৩:০০ - ৪:০০',
      subject: 'পদার্থবিজ্ঞান',
      teacherName: 'কামরুল হাসান',
      room: 'কক্ষ-২০১',
      authorId: 'staff1',
    },
    {
      id: 'r3',
      classLevel: '৬ষ্ঠ',
      group: 'সাধারণ',
      day: 'শনিবার',
      timeSlot: 'বিকাল ৩:০০ - ৪:০০',
      subject: 'গণিত',
      teacherName: 'সাজ্জাদ হোসেন',
      room: 'কক্ষ-১০১',
      authorId: 'staff1',
    },
  ];
  const result = filterAndSortRoutines(sample, { classLevel: '৯ম' });
  assert.equal(result.length, 2);
  assert.equal(result[0].day, 'শনিবার');
  assert.equal(result[1].day, 'সোমবার');
});

test('notice filtering prioritizes pinned notices and matches search', () => {
  const sample: NoticeItem[] = [
    {
      id: 'n1',
      title: 'সাধারণ ছুটির ঘোষণা',
      body: 'আগামী শুক্রবার প্রতিষ্ঠান বন্ধ থাকবে।',
      category: 'ছুটি',
      targetClass: 'সকল শ্রেণি',
      pinned: false,
      authorId: 'p1',
      authorName: 'প্রধান শিক্ষক',
      publishedDate: '২৪ নভেম্বর ২০২৬',
      createdAt: '2026-11-24T10:00:00Z',
    },
    {
      id: 'n2',
      title: 'মডেল টেস্ট পরীক্ষার রুটিন',
      body: 'দশম শ্রেণির সাপ্তাহিক মডেল টেস্ট আগামী শনিবার অনুষ্ঠিত হবে।',
      category: 'পরীক্ষা',
      targetClass: '১০ম',
      pinned: true,
      authorId: 'p1',
      authorName: 'প্রধান শিক্ষক',
      publishedDate: '২৩ নভেম্বর ২০২৬',
      createdAt: '2026-11-23T10:00:00Z',
    },
  ];
  const sorted = filterAndSortNotices(sample, {});
  assert.equal(sorted[0].id, 'n2');

  const searched = filterAndSortNotices(sample, { search: 'মডেল টেস্ট' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'n2');
});

test('student lookup, class grouping, and dashboard metrics aggregate accurately', () => {
  const admissions: AdmissionRecord[] = [
    {
      id: 'a1',
      ownerId: 'u1',
      rollNumber: 'USP-09-2026-0001',
      studentName: 'আরিফুল ইসলাম',
      fatherName: 'আব্দুল করিম',
      motherName: 'রাহেলা বেগম',
      guardianName: 'আব্দুল করিম',
      guardianPhone: '01711223344',
      studentPhone: '01711223300',
      dateOfBirth: '2011-01-10',
      presentAddress: 'ঢাকা',
      permanentAddress: 'কুমিল্লা',
      studentPhoto: 'data:image/jpeg;base64,abc',
      schoolName: 'আইডিয়াল স্কুল',
      classLevel: '৯ম',
      group: 'বিজ্ঞান',
      batchShift: 'বিকাল (৩:০০ - ৬:০০)',
      monthlyFee: 3200,
      admissionFee: 2500,
      status: 'approved',
      paymentStatus: 'verified',
    },
    {
      id: 'a2',
      ownerId: 'u2',
      rollNumber: 'USP-11-2026-0002',
      studentName: 'নুসরাত জাহান',
      fatherName: 'মাহমুদুল হক',
      motherName: 'নাসরিন বেগম',
      guardianName: 'মাহমুদুল হক',
      guardianPhone: '01911223355',
      studentPhone: '',
      dateOfBirth: '2009-04-02',
      presentAddress: 'ঢাকা',
      permanentAddress: 'ঢাকা',
      studentPhoto: 'data:image/jpeg;base64,xyz',
      schoolName: 'ভিকারুননিসা নূন কলেজ',
      classLevel: 'একাদশ',
      group: 'বিজ্ঞান',
      batchShift: 'সকাল (৭:৩০ - ১০:৩০)',
      monthlyFee: 4200,
      admissionFee: 3500,
      status: 'pending',
      paymentStatus: 'paid',
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'p1',
      admissionId: 'a1',
      ownerId: 'u1',
      studentName: 'আরিফুল ইসলাম',
      rollNumber: 'USP-09-2026-0001',
      classLevel: '৯ম',
      amount: 5700,
      method: 'bKash',
      senderNumber: '01711223344',
      transactionId: 'BKS889911',
      status: 'verified',
    },
    {
      id: 'p2',
      admissionId: 'a2',
      ownerId: 'u2',
      studentName: 'নুসরাত জাহান',
      rollNumber: 'USP-11-2026-0002',
      classLevel: 'একাদশ',
      amount: 7700,
      method: 'Nagad',
      senderNumber: '01911223355',
      transactionId: 'NGD774422',
      status: 'pending',
    },
  ];

  assert.equal(findStudentAdmission(admissions, '01911223355')?.id, 'a2');
  assert.equal(findStudentAdmission(admissions, '01711223300')?.id, 'a1');
  assert.equal(findStudentAdmission(admissions, 'usp-09-2026-0001')?.id, 'a1');
  assert.deepEqual(getAllowedGroupsForClass('৮ম'), ['সাধারণ']);

  const grouped = groupStudentsByClass(admissions);
  assert.equal(grouped['৯ম'].length, 1);
  assert.equal(grouped['একাদশ'].length, 1);
  assert.equal(grouped['৬ষ্ঠ'].length, 0);

  const metrics = computeDashboardMetrics(admissions, payments, [], []);
  assert.equal(metrics.totalStudents, 2);
  assert.equal(metrics.approvedStudents, 1);
  assert.equal(metrics.pendingStudents, 1);
  assert.equal(metrics.verifiedRevenue, 5700);
  assert.equal(metrics.pendingRevenue, 7700);
});

test('RBAC helpers strictly deny logged-out, unverified, and student users from dashboard actions', () => {
  assert.equal(canAccessDashboard(false, false, 'principal'), false);
  assert.equal(canAccessDashboard(true, false, 'principal'), false);
  assert.equal(canAccessDashboard(true, true, 'student'), false);
  assert.equal(canAccessDashboard(true, true, 'teacher'), true);
  assert.equal(canAccessDashboard(true, true, 'principal'), true);

  assert.equal(canManageStaff(true, true, 'teacher'), false);
  assert.equal(canManageStaff(true, true, 'principal'), true);

  assert.equal(
    validateStaffInput({ uid: 'bad id!', name: 'ক', role: 'teacher', subject: '' }).valid,
    false,
  );
  assert.equal(
    validateStaffInput({
      uid: 'teacher_uid_01',
      name: 'মোঃ কামরুল হাসান',
      role: 'teacher',
      subject: 'পদার্থবিজ্ঞান',
    }).valid,
    true,
  );
});

test('username alias resolution and password/username change validators enforce strict rules', () => {
  assert.equal(
    resolveLoginEmail('admin', 'admin', 'dark24dark24dark@gmail.com'),
    'dark24dark24dark@gmail.com',
  );
  assert.equal(
    resolveLoginEmail('USP_Boss', 'usp_boss', 'dark24dark24dark@gmail.com'),
    'dark24dark24dark@gmail.com',
  );
  assert.equal(resolveLoginEmail('wrong_user', 'usp_boss', 'dark24dark24dark@gmail.com'), null);
  assert.equal(
    resolveLoginEmail('teacher@school.edu.bd', 'admin', 'dark24dark24dark@gmail.com'),
    'teacher@school.edu.bd',
  );
  assert.equal(resolveLoginEmail('bad@email', 'admin', 'dark24dark24dark@gmail.com'), null);

  assert.equal(validateLoginCredentials('a', '123').valid, false);
  assert.equal(validateLoginCredentials('admin', 'secret123').valid, true);

  assert.equal(validateUsernameChange('ab').valid, false);
  assert.equal(validateUsernameChange('bad user!').valid, false);
  assert.equal(validateUsernameChange('usp_admin_26').valid, true);

  assert.equal(validatePasswordChange('', 'short', 'short', false).valid, false);
  assert.equal(validatePasswordChange('', 'StrongPass12', 'Different12', false).valid, false);
  assert.equal(validatePasswordChange('', 'StrongPass12', 'StrongPass12', false).valid, true);
  assert.equal(validatePasswordChange('', 'StrongPass12', 'StrongPass12', true).valid, false);
  assert.equal(
    validatePasswordChange('OldPass12', 'NewStrong12', 'NewStrong12', true).valid,
    true,
  );
});

