import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  auth,
  BOOTSTRAP_PRINCIPAL_EMAIL,
  googleProvider,
} from '../firebase/config';
import {
  addStaffMemberInFirestore,
  createAdmissionAndPaymentInFirestore,
  createNoticeInFirestore,
  createRoutineInFirestore,
  deleteNoticeInFirestore,
  deleteResultInFirestore,
  deleteRoutineInFirestore,
  ensureUserProfile,
  publishBatchResultsInFirestore,
  removeStaffMemberInFirestore,
  saveSiteSettingsInFirestore,
  subscribeAdmissions,
  subscribePayments,
  subscribePublicNotices,
  subscribePublicResults,
  subscribePublicRoutines,
  subscribePublicSiteSettings,
  subscribeStaffMembers,
  updateAdmissionStatusInFirestore,
  updatePaymentStatusInFirestore,
} from '../firebase/store';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_ADMISSIONS,
  SEED_NOTICES,
  SEED_PAYMENTS,
  SEED_RESULTS,
  SEED_ROUTINES,
} from '../data/seedData';
import type {
  AdmissionFormInput,
  AdmissionRecord,
  AdmissionStatus,
  AppView,
  ClassLevel,
  NoticeFormInput,
  NoticeItem,
  PaymentFormInput,
  PaymentRecord,
  PaymentStatus,
  ResultFormInput,
  RoutineEntry,
  RoutineFormInput,
  SiteSettings,
  StaffFormInput,
  StaffMember,
  StudentResult,
  TransactionStatus,
  UserRole,
} from '../types';
import {
  calculateBangladeshiGrade,
  calculateFeeBreakdown,
  canAccessDashboard,
  canManageStaff,
  generateRollNumber,
  sanitizeText,
  toBengaliDigits,
} from '../utils/academicLogic';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info' | 'error';
}

interface AppContextValue {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  preselectedClass: ClassLevel;
  navigateToAdmissionForClass: (classLevel: ClassLevel) => void;
  navigateToClassesForLevel: (classLevel: ClassLevel) => void;
  user: User | null;
  authReady: boolean;
  userRole: UserRole;
  hasStaffAccess: boolean;
  isPrincipalAccess: boolean;
  isCloudSynced: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  siteSettings: SiteSettings;
  updateSiteSettings: (nextSettings: SiteSettings) => Promise<void>;
  notices: NoticeItem[];
  routines: RoutineEntry[];
  results: StudentResult[];
  admissions: AdmissionRecord[];
  payments: PaymentRecord[];
  staffMembers: StaffMember[];
  submitAdmissionWithPayment: (
    admissionInput: AdmissionFormInput,
    paymentInput: PaymentFormInput,
  ) => Promise<{ admission: AdmissionRecord; payment: PaymentRecord }>;
  publishNotice: (input: NoticeFormInput) => Promise<void>;
  removeNotice: (id: string) => Promise<void>;
  publishRoutine: (input: RoutineFormInput) => Promise<void>;
  removeRoutine: (id: string) => Promise<void>;
  publishBatchResults: (inputs: ResultFormInput[]) => Promise<void>;
  removeResult: (id: string) => Promise<void>;
  updateAdmissionStatus: (
    admissionId: string,
    status: AdmissionStatus,
    paymentStatus?: PaymentStatus,
  ) => Promise<void>;
  updatePaymentStatus: (
    paymentId: string,
    admissionId: string,
    status: TransactionStatus,
  ) => Promise<void>;
  addStaffMember: (input: StaffFormInput) => Promise<void>;
  removeStaffMember: (uid: string) => Promise<void>;
  toast: ToastMessage | null;
  dismissToast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function formatBengaliToday(): string {
  const months = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const now = new Date();
  return `${toBengaliDigits(now.getDate())} ${months[now.getMonth()]} ${toBengaliDigits(now.getFullYear())}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [preselectedClass, setPreselectedClass] = useState<ClassLevel>('৯ম');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('student');

  // Public CMS Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Remote Firestore lists
  const [cloudNotices, setCloudNotices] = useState<NoticeItem[]>([]);
  const [cloudRoutines, setCloudRoutines] = useState<RoutineEntry[]>([]);
  const [cloudResults, setCloudResults] = useState<StudentResult[]>([]);
  const [cloudAdmissions, setCloudAdmissions] = useState<AdmissionRecord[]>([]);
  const [cloudPayments, setCloudPayments] = useState<PaymentRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // Local lists (Notice & Results intentionally start empty until explicitly published!)
  const [localNotices, setLocalNotices] = useState<NoticeItem[]>(SEED_NOTICES);
  const [localRoutines, setLocalRoutines] = useState<RoutineEntry[]>(SEED_ROUTINES);
  const [localResults, setLocalResults] = useState<StudentResult[]>(SEED_RESULTS);
  const [localAdmissions, setLocalAdmissions] = useState<AdmissionRecord[]>(SEED_ADMISSIONS);
  const [localPayments, setLocalPayments] = useState<PaymentRecord[]>(SEED_PAYMENTS);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, tone: 'success' | 'info' | 'error' = 'success') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Listen for Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const role = await ensureUserProfile(firebaseUser);
          setUserRole(role);
        } catch {
          setUserRole(
            firebaseUser.emailVerified && firebaseUser.email === BOOTSTRAP_PRINCIPAL_EMAIL
              ? 'principal'
              : 'student',
          );
        }
      } else {
        setUserRole('student');
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to public collections (site settings, notices, routines, results)
  useEffect(() => {
    const unsubSettings = subscribePublicSiteSettings(
      (settings) => setSiteSettings(settings),
      () => {},
    );
    const unsubNotices = subscribePublicNotices(
      (items) => setCloudNotices(items),
      () => {},
    );
    const unsubRoutines = subscribePublicRoutines(
      (items) => setCloudRoutines(items),
      () => {},
    );
    const unsubResults = subscribePublicResults(
      (items) => setCloudResults(items),
      () => {},
    );
    return () => {
      unsubSettings();
      unsubNotices();
      unsubRoutines();
      unsubResults();
    };
  }, []);

  // Subscribe to private admissions, payments, and staff ONLY when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setCloudAdmissions([]);
      setCloudPayments([]);
      setStaffMembers([]);
      return;
    }

    const isBootstrapPrincipal =
      Boolean(user.emailVerified) && user.email === BOOTSTRAP_PRINCIPAL_EMAIL;

    const unsubAdmissions = subscribeAdmissions(
      user,
      isBootstrapPrincipal,
      (items) => setCloudAdmissions(items),
      () => {},
    );
    const unsubPayments = subscribePayments(
      user,
      isBootstrapPrincipal,
      (items) => setCloudPayments(items),
      () => {},
    );
    const unsubStaff = isBootstrapPrincipal
      ? subscribeStaffMembers(
          (items) => setStaffMembers(items),
          () => {},
        )
      : undefined;

    return () => {
      unsubAdmissions();
      unsubPayments();
      unsubStaff?.();
    };
  }, [authReady, user]);

  // Merge cloud records without duplicating IDs
  const notices = useMemo(() => {
    const map = new Map<string, NoticeItem>();
    for (const item of localNotices) map.set(item.id, item);
    for (const item of cloudNotices) map.set(item.id, item);
    return Array.from(map.values());
  }, [localNotices, cloudNotices]);

  const routines = useMemo(() => {
    const map = new Map<string, RoutineEntry>();
    for (const item of localRoutines) map.set(item.id, item);
    for (const item of cloudRoutines) map.set(item.id, item);
    return Array.from(map.values());
  }, [localRoutines, cloudRoutines]);

  const results = useMemo(() => {
    const map = new Map<string, StudentResult>();
    for (const item of localResults) map.set(item.id, item);
    for (const item of cloudResults) map.set(item.id, item);
    return Array.from(map.values());
  }, [localResults, cloudResults]);

  const admissions = useMemo(() => {
    const map = new Map<string, AdmissionRecord>();
    for (const item of localAdmissions) map.set(item.id, item);
    for (const item of cloudAdmissions) map.set(item.id, item);
    return Array.from(map.values());
  }, [localAdmissions, cloudAdmissions]);

  const payments = useMemo(() => {
    const map = new Map<string, PaymentRecord>();
    for (const item of localPayments) map.set(item.id, item);
    for (const item of cloudPayments) map.set(item.id, item);
    return Array.from(map.values());
  }, [localPayments, cloudPayments]);

  const isCloudSynced = Boolean(user);
  const hasStaffAccess = canAccessDashboard(
    Boolean(user),
    Boolean(user?.emailVerified),
    userRole,
  );
  const isPrincipalAccess = canManageStaff(
    Boolean(user),
    Boolean(user?.emailVerified),
    userRole,
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Google অ্যাকাউন্টের মাধ্যমে সফলভাবে লগইন হয়েছে এবং ক্লাউড ডাটাবেজ যুক্ত হয়েছে।', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'লগইন ব্যর্থ হয়েছে।';
      if (!message.includes('popup-closed-by-user')) {
        showToast('Google লগইন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।', 'error');
      }
    }
  }, [showToast]);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      showToast('সফলভাবে লগআউট সম্পন্ন হয়েছে।', 'info');
    } catch {
      showToast('লগআউট করতে সমস্যা হয়েছে।', 'error');
    }
  }, [showToast]);

  const navigateToAdmissionForClass = useCallback((classLevel: ClassLevel) => {
    setPreselectedClass(classLevel);
    setActiveView('admission');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToClassesForLevel = useCallback((classLevel: ClassLevel) => {
    setPreselectedClass(classLevel);
    setActiveView('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateSiteSettings = useCallback(
    async (nextSettings: SiteSettings) => {
      if (!user || !hasStaffAccess) {
        showToast('ওয়েবসাইটের তথ্য পরিবর্তনের জন্য প্রধান শিক্ষক বা শিক্ষক লগইন আবশ্যক।', 'error');
        return;
      }
      await saveSiteSettingsInFirestore(nextSettings, user.uid);
      setSiteSettings(nextSettings);
      showToast('ওয়েবসাইটের লোগো, ব্যানার, সেকশন ও তথ্য সফলভাবে সংরক্ষিত হয়েছে।', 'success');
    },
    [hasStaffAccess, showToast, user],
  );

  const submitAdmissionWithPayment = useCallback(
    async (admissionInput: AdmissionFormInput, paymentInput: PaymentFormInput) => {
      const fees = calculateFeeBreakdown(admissionInput.classLevel, admissionInput.group);
      const rollNumber = generateRollNumber(
        admissionInput.classLevel,
        admissions.length + 101,
        2026,
      );
      const nowIso = new Date().toISOString();
      const ownerId = user?.uid ?? 'guest_student';

      const baseAdmission: Omit<AdmissionRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        ownerId,
        rollNumber,
        studentName: sanitizeText(admissionInput.studentName, 100),
        fatherName: sanitizeText(admissionInput.fatherName, 100),
        motherName: sanitizeText(admissionInput.motherName, 100),
        guardianName: sanitizeText(admissionInput.guardianName, 100),
        guardianPhone: admissionInput.guardianPhone.trim().replace(/[\s-]/g, ''),
        studentPhone: admissionInput.studentPhone.trim().replace(/[\s-]/g, ''),
        dateOfBirth: admissionInput.dateOfBirth.trim(),
        presentAddress: sanitizeText(admissionInput.presentAddress, 300),
        permanentAddress: sanitizeText(admissionInput.permanentAddress, 300),
        studentPhoto: admissionInput.studentPhoto,
        schoolName: sanitizeText(admissionInput.schoolName, 150),
        classLevel: admissionInput.classLevel,
        group: admissionInput.group,
        batchShift: admissionInput.batchShift,
        monthlyFee: fees.monthlyFee,
        admissionFee: fees.admissionFee,
        status: 'pending',
        paymentStatus: 'paid',
      };

      const basePayment: Omit<PaymentRecord, 'id' | 'admissionId' | 'createdAt' | 'updatedAt'> = {
        ownerId,
        studentName: baseAdmission.studentName,
        rollNumber,
        classLevel: admissionInput.classLevel,
        amount: fees.totalPayableNow,
        method: paymentInput.method,
        senderNumber: paymentInput.senderNumber.trim().replace(/[\s-]/g, ''),
        transactionId: paymentInput.transactionId.trim().toUpperCase(),
        status: 'pending',
      };

      if (user && user.emailVerified) {
        const { admissionId, paymentId } = await createAdmissionAndPaymentInFirestore(
          baseAdmission,
          basePayment,
        );
        const createdAdmission: AdmissionRecord = {
          ...baseAdmission,
          id: admissionId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const createdPayment: PaymentRecord = {
          ...basePayment,
          id: paymentId,
          admissionId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        showToast(`ভর্তি আবেদন ও পেমেন্ট ক্লাউড ডাটাবেজে সংরক্ষিত হয়েছে (রোল: ${rollNumber})।`, 'success');
        return { admission: createdAdmission, payment: createdPayment };
      }

      const localAdmissionId = `adm_local_${Date.now()}`;
      const localPaymentId = `pay_local_${Date.now()}`;
      const createdAdmission: AdmissionRecord = {
        ...baseAdmission,
        id: localAdmissionId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const createdPayment: PaymentRecord = {
        ...basePayment,
        id: localPaymentId,
        admissionId: localAdmissionId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setLocalAdmissions((prev) => [createdAdmission, ...prev]);
      setLocalPayments((prev) => [createdPayment, ...prev]);
      showToast(`অনলাইন ভর্তি ও পেমেন্ট সফলভাবে সম্পন্ন হয়েছে (রোল: ${rollNumber})।`, 'success');
      return { admission: createdAdmission, payment: createdPayment };
    },
    [admissions.length, showToast, user],
  );

  const publishNotice = useCallback(
    async (input: NoticeFormInput) => {
      if (!user || !hasStaffAccess) {
        showToast('নোটিশ প্রকাশের জন্য অনুমোদিত প্রধান শিক্ষক বা শিক্ষক হিসেবে লগইন করুন।', 'error');
        return;
      }
      const authorName = user.displayName || 'অধ্যক্ষ মোঃ রফিকুল ইসলাম';
      const publishedDate = formatBengaliToday();

      await createNoticeInFirestore({
        title: sanitizeText(input.title, 180),
        body: input.body.trim().slice(0, 2000),
        category: input.category,
        targetClass: input.targetClass,
        pinned: input.pinned,
        authorId: user.uid,
        authorName,
        publishedDate,
      });
      showToast('নতুন নোটিশ সফলভাবে ডাটাবেজে প্রকাশ করা হয়েছে।', 'success');
    },
    [hasStaffAccess, showToast, user],
  );

  const removeNotice = useCallback(
    async (id: string) => {
      if (!user || !hasStaffAccess) {
        showToast('নোটিশ মোছার জন্য অনুমোদিত প্রধান শিক্ষক বা শিক্ষক হিসেবে লগইন করুন।', 'error');
        return;
      }
      const isCloudDoc = cloudNotices.some((n) => n.id === id);
      if (isCloudDoc) {
        await deleteNoticeInFirestore(id);
      }
      setLocalNotices((prev) => prev.filter((n) => n.id !== id));
      showToast('নোটিশটি তালিকা থেকে মুছে ফেলা হয়েছে।', 'info');
    },
    [cloudNotices, hasStaffAccess, showToast, user],
  );

  const publishRoutine = useCallback(
    async (input: RoutineFormInput) => {
      if (!user || !hasStaffAccess) {
        showToast('রুটিন প্রকাশের জন্য অনুমোদিত প্রধান শিক্ষক বা শিক্ষক হিসেবে লগইন করুন।', 'error');
        return;
      }
      await createRoutineInFirestore({
        classLevel: input.classLevel,
        group: input.group,
        day: input.day,
        timeSlot: sanitizeText(input.timeSlot, 60),
        subject: sanitizeText(input.subject, 80),
        teacherName: sanitizeText(input.teacherName, 100),
        room: sanitizeText(input.room, 40),
        authorId: user.uid,
      });
      showToast('নতুন ক্লাস রুটিন সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে।', 'success');
    },
    [hasStaffAccess, showToast, user],
  );

  const removeRoutine = useCallback(
    async (id: string) => {
      if (!user || !hasStaffAccess) {
        showToast('রুটিন মোছার জন্য অনুমোদিত প্রধান শিক্ষক বা শিক্ষক হিসেবে লগইন করুন।', 'error');
        return;
      }
      const isCloudDoc = cloudRoutines.some((r) => r.id === id);
      if (isCloudDoc) {
        await deleteRoutineInFirestore(id);
      }
      setLocalRoutines((prev) => prev.filter((r) => r.id !== id));
      showToast('রুটিন এন্ট্রিটি মুছে ফেলা হয়েছে।', 'info');
    },
    [cloudRoutines, hasStaffAccess, showToast, user],
  );

  const publishBatchResults = useCallback(
    async (inputs: ResultFormInput[]) => {
      if (!user || !hasStaffAccess) {
        showToast('রেজাল্ট প্রকাশের জন্য প্রধান শিক্ষক বা শিক্ষক লগইন আবশ্যক।', 'error');
        return;
      }
      if (inputs.length === 0) return;

      const publishedDate = formatBengaliToday();
      const payload = inputs.map((item) => {
        const computed = calculateBangladeshiGrade(item.obtainedMarks, item.fullMarks);
        return {
          admissionId: item.admissionId,
          studentName: sanitizeText(item.studentName, 100),
          rollNumber: item.rollNumber,
          studentPhoto: item.studentPhoto || '',
          classLevel: item.classLevel,
          group: item.group,
          examName: sanitizeText(item.examName, 120),
          subject: sanitizeText(item.subject, 100),
          fullMarks: item.fullMarks,
          obtainedMarks: item.obtainedMarks,
          gpa: computed.gpa,
          grade: computed.grade,
          remarks: sanitizeText(item.remarks, 200),
          publishedDate,
          authorId: user.uid,
        };
      });

      await publishBatchResultsInFirestore(payload);
      showToast(
        `${toBengaliDigits(payload.length)} জন শিক্ষার্থীর রেজাল্ট সফলভাবে প্রকাশ করা হয়েছে।`,
        'success',
      );
    },
    [hasStaffAccess, showToast, user],
  );

  const removeResult = useCallback(
    async (id: string) => {
      if (!user || !hasStaffAccess) {
        showToast('রেজাল্ট মোছার জন্য প্রধান শিক্ষক বা শিক্ষক লগইন আবশ্যক।', 'error');
        return;
      }
      const isCloudDoc = cloudResults.some((r) => r.id === id);
      if (isCloudDoc) {
        await deleteResultInFirestore(id);
      }
      setLocalResults((prev) => prev.filter((r) => r.id !== id));
      showToast('রেজাল্টটি মুছে ফেলা হয়েছে।', 'info');
    },
    [cloudResults, hasStaffAccess, showToast, user],
  );

  const updateAdmissionStatus = useCallback(
    async (admissionId: string, status: AdmissionStatus, paymentStatus?: PaymentStatus) => {
      if (!user || !hasStaffAccess) {
        showToast('শিক্ষার্থী অনুমোদন বা বাতিলের জন্য শিক্ষক/প্রধান শিক্ষক লগইন আবশ্যক।', 'error');
        return;
      }
      const isCloudDoc = cloudAdmissions.some((a) => a.id === admissionId);
      if (isCloudDoc) {
        await updateAdmissionStatusInFirestore(admissionId, status, paymentStatus);
        if (paymentStatus === 'verified') {
          const linkedCloudPayment = cloudPayments.find(
            (p) => p.admissionId === admissionId && p.status === 'pending',
          );
          if (linkedCloudPayment) {
            await updatePaymentStatusInFirestore(linkedCloudPayment.id, 'verified');
          }
        }
      }
      setLocalAdmissions((prev) =>
        prev.map((a) =>
          a.id === admissionId
            ? {
                ...a,
                status,
                paymentStatus: paymentStatus ?? a.paymentStatus,
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      );
      if (paymentStatus === 'verified') {
        setLocalPayments((prev) =>
          prev.map((p) =>
            p.admissionId === admissionId && p.status === 'pending'
              ? { ...p, status: 'verified', updatedAt: new Date().toISOString() }
              : p,
          ),
        );
      }
      showToast(
        status === 'approved'
          ? 'শিক্ষার্থীর ভর্তি অনুমোদন করা হয়েছে।'
          : status === 'rejected'
            ? 'ভর্তি আবেদন বাতিল করা হয়েছে।'
            : 'ভর্তি তথ্য হালনাগাদ হয়েছে।',
        'success',
      );
    },
    [cloudAdmissions, cloudPayments, hasStaffAccess, showToast, user],
  );

  const updatePaymentStatus = useCallback(
    async (paymentId: string, admissionId: string, status: TransactionStatus) => {
      if (!user || !hasStaffAccess) {
        showToast('পেমেন্ট যাচাইয়ের জন্য শিক্ষক/প্রধান শিক্ষক লগইন আবশ্যক।', 'error');
        return;
      }
      const isCloudPayment = cloudPayments.some((p) => p.id === paymentId);
      const isCloudAdmission = cloudAdmissions.some((a) => a.id === admissionId);
      const syncedPaymentStatus: PaymentStatus = status === 'verified' ? 'verified' : 'paid';

      if (isCloudPayment) {
        await updatePaymentStatusInFirestore(paymentId, status);
        if (isCloudAdmission) {
          await updateAdmissionStatusInFirestore(
            admissionId,
            status === 'verified' ? 'approved' : 'pending',
            syncedPaymentStatus,
          );
        }
      }

      setLocalPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, status, updatedAt: new Date().toISOString() } : p,
        ),
      );
      setLocalAdmissions((prev) =>
        prev.map((a) =>
          a.id === admissionId
            ? {
                ...a,
                paymentStatus: syncedPaymentStatus,
                status: status === 'verified' ? 'approved' : a.status,
                updatedAt: new Date().toISOString(),
              }
            : a,
        ),
      );
      showToast(
        status === 'verified'
          ? 'পেমেন্ট যাচাই সম্পন্ন এবং ভর্তি অনুমোদিত হয়েছে।'
          : 'পেমেন্ট স্ট্যাটাস হালনাগাদ হয়েছে।',
        'success',
      );
    },
    [cloudAdmissions, cloudPayments, hasStaffAccess, showToast, user],
  );

  const addStaffMember = useCallback(
    async (input: StaffFormInput) => {
      if (!user || !isPrincipalAccess) {
        showToast('শুধুমাত্র প্রধান শিক্ষক নতুন শিক্ষক যুক্ত করতে পারবেন।', 'error');
        return;
      }
      await addStaffMemberInFirestore(input);
      showToast(`${input.name}-কে সফলভাবে অনুমোদিত শিক্ষক তালিকায় যুক্ত করা হয়েছে।`, 'success');
    },
    [isPrincipalAccess, showToast, user],
  );

  const removeStaffMember = useCallback(
    async (uid: string) => {
      if (!user || !isPrincipalAccess) {
        showToast('শুধুমাত্র প্রধান শিক্ষক এই পরিবর্তন করতে পারবেন।', 'error');
        return;
      }
      await removeStaffMemberInFirestore(uid);
      showToast('শিক্ষকের ড্যাশবোর্ড অ্যাক্সেস প্রত্যাহার করা হয়েছে।', 'info');
    },
    [isPrincipalAccess, showToast, user],
  );

  const value: AppContextValue = {
    activeView,
    setActiveView,
    preselectedClass,
    navigateToAdmissionForClass,
    navigateToClassesForLevel,
    user,
    authReady,
    userRole,
    hasStaffAccess,
    isPrincipalAccess,
    isCloudSynced,
    signInWithGoogle,
    signOutUser,
    siteSettings,
    updateSiteSettings,
    notices,
    routines,
    results,
    admissions,
    payments,
    staffMembers,
    submitAdmissionWithPayment,
    publishNotice,
    removeNotice,
    publishRoutine,
    removeRoutine,
    publishBatchResults,
    removeResult,
    updateAdmissionStatus,
    updatePaymentStatus,
    addStaffMember,
    removeStaffMember,
    toast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
