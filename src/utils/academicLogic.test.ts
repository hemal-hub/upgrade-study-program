import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFeeBreakdown,
  computeDashboardMetrics,
  filterAndSortNotices,
  filterAndSortRoutines,
  findStudentAdmission,
  formatBdt,
  generateRollNumber,
  getAllowedGroupsForClass,
  ROLL_NUMBER_REGEX,
  toBengaliDigits,
  validateAdmissionInput,
  validateNoticeInput,
  validatePaymentInput,
  validateRoutineInput,
} from './academicLogic';
import type { AdmissionRecord, NoticeItem, PaymentRecord, RoutineEntry } from '../types';

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

test('admission validation rejects empty or malformed inputs and accepts valid data', () => {
  const invalid = validateAdmissionInput({
    studentName: '',
    guardianName: 'ক',
    guardianPhone: '12345',
    schoolName: '',
    classLevel: '৬ষ্ঠ',
    group: 'বিজ্ঞান',
    batchShift: 'বিকাল (৩:০০ - ৬:০০)',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.studentName);
  assert.ok(invalid.errors.guardianName);
  assert.ok(invalid.errors.guardianPhone);
  assert.ok(invalid.errors.schoolName);
  assert.ok(invalid.errors.group);

  const valid = validateAdmissionInput({
    studentName: 'তানভীর আহমেদ',
    guardianName: 'মোঃ রফিকুল ইসলাম',
    guardianPhone: '01712345678',
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

test('student lookup and dashboard metrics aggregate accurately', () => {
  const admissions: AdmissionRecord[] = [
    {
      id: 'a1',
      ownerId: 'u1',
      rollNumber: 'USP-09-2026-0001',
      studentName: 'আরিফুল ইসলাম',
      guardianName: 'আব্দুল করিম',
      guardianPhone: '01711223344',
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
      guardianName: 'মাহমুদুল হক',
      guardianPhone: '01911223355',
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
  assert.equal(findStudentAdmission(admissions, 'usp-09-2026-0001')?.id, 'a1');
  assert.deepEqual(getAllowedGroupsForClass('৮ম'), ['সাধারণ']);

  const metrics = computeDashboardMetrics(admissions, payments, [], []);
  assert.equal(metrics.totalStudents, 2);
  assert.equal(metrics.approvedStudents, 1);
  assert.equal(metrics.pendingStudents, 1);
  assert.equal(metrics.verifiedRevenue, 5700);
  assert.equal(metrics.pendingRevenue, 7700);
});

test('RBAC helpers strictly deny logged-out, unverified, and student users from dashboard actions', async () => {
  const { canAccessDashboard, canManageStaff, validateStaffInput } = await import('./academicLogic');

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

