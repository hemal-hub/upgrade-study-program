import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import {
  auth,
  BOOTSTRAP_PRINCIPAL_EMAIL,
  googleProvider,
} from '../firebase/config';
import {
  addStaffInviteInFirestore,
  addStaffMemberInFirestore,
  approveStudentRegistrationInFirestore,
  createAdmissionAndPaymentInFirestore,
  createNoticeInFirestore,
  createRoutineInFirestore,
  createStudentPortalPaymentInFirestore,
  createStudentRegistrationInFirestore,
  deleteFacultyMemberInFirestore,
  deleteNoticeInFirestore,
  deleteResultInFirestore,
  deleteRoutineInFirestore,
  ensureUserProfile,
  publishBatchResultsInFirestore,
  rejectStudentRegistrationInFirestore,
  removeStaffInviteInFirestore,
  removeStaffMemberInFirestore,
  saveFacultyMemberInFirestore,
  saveSiteSettingsInFirestore,
  setPrincipalFacultyInFirestore,
  subscribeAdmissions,
  subscribeAllStudentRegistrations,
  subscribeOwnStudentRegistration,
  subscribePayments,
  subscribePublicFaculty,
  subscribePublicNotices,
  subscribePublicResults,
  subscribePublicRoutines,
  subscribePublicSiteSettings,
  subscribeStaffInvites,
  subscribeStaffMembers,
  updateAdmissionStatusInFirestore,
  updatePaymentStatusInFirestore,
} from '../firebase/store';
import {
  DEFAULT_SITE_SETTINGS,
  FACULTY_MEMBERS,
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
  FacultyFormInput,
  FacultyMember,
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
  StaffInvite,
  StaffInviteFormInput,
  StaffMember,
  StudentRegistration,
  StudentRegistrationFormInput,
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
  isStudentAuthEmail,
  maskEmailAddress,
  normalizeStudentUsername,
  resolveLoginEmail,
  sanitizeText,
  studentUsernameToAuthEmail,
  toBengaliDigits,
  validatePasswordResetInput,
  validatePaymentInput,
  validateStaffInviteInput,
  validateStudentLoginInput,
  validateStudentRegistrationInput,
  validateUsernameChange,
} from '../utils/academicLogic';
import { sortFacultyMembers, validateFacultyInput } from '../utils/facultyUtils';
import { getPathForAppView, parseAppViewFromLocation } from '../utils/urlRouting';

function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'ইউজারনেম/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
  }
  if (code === 'auth/invalid-email') {
    return 'প্রদত্ত ইমেইল ঠিকানাটি সঠিক নয়। অনুগ্রহ করে সঠিক ইমেইল লিখুন।';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Firebase Console → Authentication → Sign-in method থেকে "Email/Password" চালু করা নেই। অনুগ্রহ করে সেটি Enable করুন।';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'এই ডোমেইনটি';
    return `Firebase Console → Authentication → Settings → Authorized domains-এ "${host}" ডোমেইনটি যুক্ত করা নেই।`;
  }
  if (code === 'auth/popup-blocked') {
    return 'ব্রাউজার Google লগইন পপআপ ব্লক করেছে। পপআপ অনুমতি দিন অথবা ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।';
  }
  if (code === 'auth/email-already-in-use') {
    return 'এই ইমেইলে আগে থেকেই অ্যাকাউন্ট আছে। নিচের "পাসওয়ার্ড রিসেট / সেট লিংক পাঠান" বাটন ব্যবহার করে পাসওয়ার্ড সেট করুন।';
  }
  if (code === 'auth/weak-password') {
    return 'পাসওয়ার্ডটি খুবই দুর্বল। কমপক্ষে ৮ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।';
  }
  if (code === 'auth/too-many-requests') {
    return 'অতিরিক্ত চেষ্টার কারণে সাময়িকভাবে অনুরোধ স্থগিত আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
  }
  if (code === 'auth/network-request-failed') {
    return 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। সংযোগ যাচাই করে আবার চেষ্টা করুন।';
  }
  if (code === 'auth/requires-recent-login') {
    return 'নিরাপত্তার জন্য অনুগ্রহ করে একবার লগআউট করে পুনরায় লগইন করুন এবং আবার চেষ্টা করুন।';
  }
  return 'লগইন বা অ্যাকাউন্ট আপডেট সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
}

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
  isRootAdmin: boolean;
  isStudentAccount: boolean;
  isApprovedStudent: boolean;
  ownStudentRegistration: StudentRegistration | null;
  studentRegistrationLoaded: boolean;
  studentRegistrations: StudentRegistration[];
  hasPasswordProvider: boolean;
  isCloudSynced: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithUsernameOrEmail: (identifier: string, password: string) => Promise<string | null>;
  setupPrincipalPasswordAccount: (identifier: string, password: string) => Promise<string | null>;
  sendPasswordReset: (
    identifier: string,
  ) => Promise<{ ok: boolean; maskedEmail?: string; error?: string }>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  changeAccountPassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  updateAdminUsername: (newUsername: string) => Promise<string | null>;
  registerStudentAccount: (input: StudentRegistrationFormInput) => Promise<string | null>;
  signInStudent: (username: string, password: string) => Promise<string | null>;
  approveStudentRegistration: (reg: StudentRegistration) => Promise<void>;
  rejectStudentRegistration: (uid: string) => Promise<void>;
  submitStudentPortalPayment: (
    admission: AdmissionRecord,
    paymentInput: PaymentFormInput,
    amount: number,
  ) => Promise<string | null>;
  signOutUser: () => Promise<void>;
  siteSettings: SiteSettings;
  updateSiteSettings: (nextSettings: SiteSettings) => Promise<void>;
  facultyMembers: FacultyMember[];
  saveFacultyMember: (input: FacultyFormInput, editingId?: string) => Promise<string | null>;
  setPrincipalFaculty: (id: string) => Promise<void>;
  removeFacultyMember: (id: string) => Promise<void>;
  notices: NoticeItem[];
  routines: RoutineEntry[];
  results: StudentResult[];
  admissions: AdmissionRecord[];
  payments: PaymentRecord[];
  staffMembers: StaffMember[];
  staffInvites: StaffInvite[];
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
  addStaffInvite: (input: StaffInviteFormInput) => Promise<string | null>;
  removeStaffInvite: (inviteId: string) => Promise<void>;
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
  const [activeView, setActiveViewState] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'home';
    return parseAppViewFromLocation(window.location.pathname, window.location.hash);
  });
  const [preselectedClass, setPreselectedClass] = useState<ClassLevel>('৯ম');

  const setActiveView = useCallback((nextView: AppView) => {
    setActiveViewState(nextView);
    if (typeof window !== 'undefined') {
      const targetPath = getPathForAppView(nextView);
      if (window.location.pathname !== targetPath || window.location.hash) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromLocation = () => {
      setActiveViewState(
        parseAppViewFromLocation(window.location.pathname, window.location.hash),
      );
    };
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('student');

  // Public CMS Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Remote Firestore lists
  const [cloudFaculty, setCloudFaculty] = useState<FacultyMember[]>([]);
  const [cloudNotices, setCloudNotices] = useState<NoticeItem[]>([]);
  const [cloudRoutines, setCloudRoutines] = useState<RoutineEntry[]>([]);
  const [cloudResults, setCloudResults] = useState<StudentResult[]>([]);
  const [cloudAdmissions, setCloudAdmissions] = useState<AdmissionRecord[]>([]);
  const [cloudPayments, setCloudPayments] = useState<PaymentRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffInvites, setStaffInvites] = useState<StaffInvite[]>([]);
  const [ownStudentRegistration, setOwnStudentRegistration] =
    useState<StudentRegistration | null>(null);
  const [studentRegistrationLoaded, setStudentRegistrationLoaded] = useState(false);
  const [studentRegistrations, setStudentRegistrations] = useState<StudentRegistration[]>([]);

  // Local lists (Notice & Results intentionally start empty until explicitly published!)
  const [localNotices, setLocalNotices] = useState<NoticeItem[]>(SEED_NOTICES);
  const [localRoutines, setLocalRoutines] = useState<RoutineEntry[]>(SEED_ROUTINES);
  const [localResults, setLocalResults] = useState<StudentResult[]>(SEED_RESULTS);
  const [localAdmissions, setLocalAdmissions] = useState<AdmissionRecord[]>(SEED_ADMISSIONS);
  const [localPayments, setLocalPayments] = useState<PaymentRecord[]>(SEED_PAYMENTS);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, setProviderRefreshTick] = useState(0);

  const clearAuthError = useCallback(() => setAuthError(null), []);

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

  // Subscribe to public collections (site settings, faculty, notices, routines, results)
  useEffect(() => {
    const unsubSettings = subscribePublicSiteSettings(
      (settings) => setSiteSettings(settings),
      () => {},
    );
    const unsubFaculty = subscribePublicFaculty(
      (items) => setCloudFaculty(items),
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
      unsubFaculty();
      unsubNotices();
      unsubRoutines();
      unsubResults();
    };
  }, []);

  const facultyMembers = useMemo(
    () => sortFacultyMembers(cloudFaculty.length > 0 ? cloudFaculty : FACULTY_MEMBERS),
    [cloudFaculty],
  );

  const isRootAdmin = Boolean(
    user?.emailVerified && user.email?.toLowerCase() === BOOTSTRAP_PRINCIPAL_EMAIL.toLowerCase(),
  );
  const isCloudSynced = Boolean(user);
  const hasPasswordProvider = Boolean(
    user?.providerData?.some((provider) => provider.providerId === 'password'),
  );
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
  const isStudentAccount = Boolean(user && isStudentAuthEmail(user.email));
  const isApprovedStudent = Boolean(
    user && !hasStaffAccess && ownStudentRegistration?.status === 'approved',
  );

  // Subscribe to private admissions, payments, student registrations, and admin registries ONLY when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setCloudAdmissions([]);
      setCloudPayments([]);
      setStaffMembers([]);
      setStaffInvites([]);
      setOwnStudentRegistration(null);
      setStudentRegistrationLoaded(false);
      setStudentRegistrations([]);
      return;
    }

    const unsubAdmissions = subscribeAdmissions(
      user,
      hasStaffAccess,
      (items) => setCloudAdmissions(items),
      () => {},
    );
    const unsubPayments = subscribePayments(
      user,
      hasStaffAccess,
      (items) => setCloudPayments(items),
      () => {},
    );
    const unsubOwnStudentReg = !hasStaffAccess
      ? subscribeOwnStudentRegistration(
          user.uid,
          (reg) => {
            setOwnStudentRegistration(reg);
            setStudentRegistrationLoaded(true);
          },
          () => {
            setStudentRegistrationLoaded(true);
          },
        )
      : undefined;
    if (hasStaffAccess) {
      setOwnStudentRegistration(null);
      setStudentRegistrationLoaded(true);
    }
    const unsubAllStudentRegs = hasStaffAccess
      ? subscribeAllStudentRegistrations(
          (items) => setStudentRegistrations(items),
          () => {},
        )
      : undefined;
    const unsubStaff = isRootAdmin
      ? subscribeStaffMembers(
          (items) => setStaffMembers(items),
          () => {},
        )
      : undefined;
    const unsubInvites = isRootAdmin
      ? subscribeStaffInvites(
          (items) => setStaffInvites(items),
          () => {},
        )
      : undefined;

    return () => {
      unsubAdmissions();
      unsubPayments();
      unsubOwnStudentReg?.();
      unsubAllStudentRegs?.();
      unsubStaff?.();
      unsubInvites?.();
    };
  }, [authReady, hasStaffAccess, isRootAdmin, user]);

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

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Google অ্যাকাউন্টের মাধ্যমে সফলভাবে লগইন হয়েছে এবং ক্লাউড ডাটাবেজ যুক্ত হয়েছে।', 'success');
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code ?? '')
          : '';
      if (code === 'auth/popup-closed-by-user') return;
      const msg = formatFirebaseAuthError(error);
      setAuthError(msg);
      showToast(msg, 'error');
    }
  }, [showToast]);

  const signInWithUsernameOrEmail = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      setAuthError(null);
      const resolvedEmail = resolveLoginEmail(
        identifier,
        siteSettings.adminUsername,
        BOOTSTRAP_PRINCIPAL_EMAIL,
      );
      if (!resolvedEmail) {
        const msg = 'ইউজারনেম বা ইমেইল সঠিক নয়। অনুগ্রহ করে সঠিক ইউজারনেম অথবা ইমেইল দিন।';
        setAuthError(msg);
        return msg;
      }

      try {
        await signInWithEmailAndPassword(auth, resolvedEmail, password);
        showToast('ইউজারনেম ও পাসওয়ার্ড দিয়ে সফলভাবে ড্যাশবোর্ডে লগইন হয়েছে।', 'success');
        return null;
      } catch (error) {
        const msg = formatFirebaseAuthError(error);
        setAuthError(msg);
        return msg;
      }
    },
    [showToast, siteSettings.adminUsername],
  );

  const setupPrincipalPasswordAccount = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      setAuthError(null);
      const resolvedEmail = resolveLoginEmail(
        identifier,
        siteSettings.adminUsername,
        BOOTSTRAP_PRINCIPAL_EMAIL,
      );
      if (!resolvedEmail) {
        const msg = 'সঠিক ইমেইল ঠিকানা (অথবা মূল অ্যাডমিনের ইউজারনেম) লিখুন।';
        setAuthError(msg);
        return msg;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, resolvedEmail, password);
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Non-fatal if verification email rate-limited
        }
        const masked = maskEmailAddress(resolvedEmail);
        showToast(
          `পাসওয়ার্ড তৈরি হয়েছে। ${masked} ইমেইলে পাঠানো ভেরিফিকেশন লিংকে ক্লিক করুন।`,
          'success',
        );
        return null;
      } catch (error) {
        const msg = formatFirebaseAuthError(error);
        setAuthError(msg);
        return msg;
      }
    },
    [showToast, siteSettings.adminUsername],
  );

  const sendPasswordReset = useCallback(
    async (
      identifier: string,
    ): Promise<{ ok: boolean; maskedEmail?: string; error?: string }> => {
      setAuthError(null);
      const validation = validatePasswordResetInput(identifier);
      if (!validation.valid) {
        const msg =
          validation.errors.identifier ||
          'পাসওয়ার্ড রিসেট করতে আপনার নিবন্ধিত ইমেইল অথবা ইউজারনেম লিখুন।';
        setAuthError(msg);
        return { ok: false, error: msg };
      }

      const resolvedEmail = resolveLoginEmail(
        identifier,
        siteSettings.adminUsername,
        BOOTSTRAP_PRINCIPAL_EMAIL,
      );
      if (!resolvedEmail) {
        const msg =
          'এই ইউজারনেমটি খুঁজে পাওয়া যায়নি। আপনার নিবন্ধিত ইমেইল ঠিকানা অথবা সঠিক অ্যাডমিন ইউজারনেম দিন।';
        setAuthError(msg);
        return { ok: false, error: msg };
      }

      const maskedEmail = maskEmailAddress(resolvedEmail);

      try {
        await sendPasswordResetEmail(auth, resolvedEmail);
        showToast(
          `${maskedEmail} ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার চেক করুন।`,
          'success',
        );
        return { ok: true, maskedEmail };
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code?: unknown }).code ?? '')
            : '';
        // Prevent account enumeration for unregistered email addresses
        if (code === 'auth/user-not-found') {
          showToast(
            `এই ঠিকানায় অ্যাকাউন্ট নিবন্ধিত থাকলে ${maskedEmail} ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।`,
            'info',
          );
          return { ok: true, maskedEmail };
        }
        const msg = formatFirebaseAuthError(error);
        setAuthError(msg);
        return { ok: false, error: msg };
      }
    },
    [showToast, siteSettings.adminUsername],
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      showToast(`${auth.currentUser.email} ইমেইলে ভেরিফিকেশন লিংক পুনরায় পাঠানো হয়েছে।`, 'success');
    } catch (error) {
      showToast(formatFirebaseAuthError(error), 'error');
    }
  }, [showToast]);

  const refreshAuthUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setUser(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        const role = await ensureUserProfile(auth.currentUser);
        setUserRole(role);
        showToast('ইমেইল ভেরিফিকেশন সম্পন্ন হয়েছে! ড্যাশবোর্ড আনলক হয়েছে।', 'success');
      } else {
        showToast('ইমেইল এখনো ভেরিফাই হয়নি। আপনার ইনবক্সের লিংকে ক্লিক করে আবার চেষ্টা করুন।', 'info');
      }
      setProviderRefreshTick((n) => n + 1);
    } catch {
      showToast('অ্যাকাউন্ট তথ্য রিফ্রেশ করা যায়নি। পুনরায় চেষ্টা করুন।', 'error');
    }
  }, [showToast]);

  const changeAccountPassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<string | null> => {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        return 'পাসওয়ার্ড পরিবর্তনের জন্য আগে লগইন করুন।';
      }

      const alreadyHasPassword = currentUser.providerData.some(
        (provider) => provider.providerId === 'password',
      );

      try {
        if (!alreadyHasPassword) {
          const emailCred = EmailAuthProvider.credential(currentUser.email, newPassword);
          try {
            await linkWithCredential(currentUser, emailCred);
          } catch (linkErr) {
            const code =
              typeof linkErr === 'object' && linkErr !== null && 'code' in linkErr
                ? String((linkErr as { code?: unknown }).code ?? '')
                : '';
            if (code === 'auth/requires-recent-login') {
              await reauthenticateWithPopup(currentUser, googleProvider);
              await linkWithCredential(currentUser, emailCred);
            } else {
              throw linkErr;
            }
          }
          await currentUser.reload();
          setUser(auth.currentUser);
          setProviderRefreshTick((n) => n + 1);
          showToast('নতুন ড্যাশবোর্ড পাসওয়ার্ড সফলভাবে সেট করা হয়েছে।', 'success');
          return null;
        }

        const existingCred = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, existingCred);
        await updatePassword(currentUser, newPassword);
        showToast('আপনার ড্যাশবোর্ড পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।', 'success');
        return null;
      } catch (error) {
        return formatFirebaseAuthError(error);
      }
    },
    [showToast],
  );

  const updateAdminUsername = useCallback(
    async (newUsername: string): Promise<string | null> => {
      if (!user || !isRootAdmin) {
        return 'শুধুমাত্র মূল অ্যাডমিন (প্রধান শিক্ষক) অ্যাডমিন ইউজারনেম পরিবর্তন করতে পারবেন।';
      }
      const validation = validateUsernameChange(newUsername);
      if (!validation.valid) {
        return validation.errors.username ?? 'সঠিক ইউজারনেম লিখুন।';
      }
      const trimmed = newUsername.trim();
      const nextSettings: SiteSettings = {
        ...siteSettings,
        adminUsername: trimmed,
      };
      try {
        await saveSiteSettingsInFirestore(nextSettings, user.uid, true);
        setSiteSettings(nextSettings);
        showToast(`নতুন অ্যাডমিন ইউজারনেম "${trimmed}" সফলভাবে সংরক্ষিত হয়েছে।`, 'success');
        return null;
      } catch {
        return 'ইউজারনেম সংরক্ষণ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      }
    },
    [isRootAdmin, showToast, siteSettings, user],
  );

  const registerStudentAccount = useCallback(
    async (input: StudentRegistrationFormInput): Promise<string | null> => {
      const validation = validateStudentRegistrationInput(input);
      if (!validation.valid) {
        return Object.values(validation.errors)[0] || 'অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন।';
      }

      const normalizedUsername = normalizeStudentUsername(input.username);
      const authEmail = studentUsernameToAuthEmail(normalizedUsername);

      try {
        const cred = await createUserWithEmailAndPassword(auth, authEmail, input.password);
        await createStudentRegistrationInFirestore(cred.user.uid, {
          ...input,
          username: normalizedUsername,
        });
        showToast(
          'আপনার রেজিস্ট্রেশন আবেদন জমা হয়েছে! অ্যাডমিন অনুমোদন দিলে আপনি লগইন করতে পারবেন।',
          'success',
        );
        return null;
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code?: unknown }).code ?? '')
            : '';
        if (code === 'auth/email-already-in-use') {
          return 'এই ইউজারনেমটি আগে থেকেই ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য একটি ইউজারনেম বেছে নিন।';
        }
        return formatFirebaseAuthError(error);
      }
    },
    [showToast],
  );

  const signInStudent = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const validation = validateStudentLoginInput(username, password);
      if (!validation.valid) {
        return Object.values(validation.errors)[0] || 'সঠিক ইউজারনেম ও পাসওয়ার্ড দিন।';
      }

      const authEmail = studentUsernameToAuthEmail(username);
      try {
        await signInWithEmailAndPassword(auth, authEmail, password);
        showToast('সফলভাবে শিক্ষার্থী অ্যাকাউন্টে লগইন হয়েছে।', 'success');
        return null;
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code?: unknown }).code ?? '')
            : '';
        if (
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found'
        ) {
          return 'ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়।';
        }
        return formatFirebaseAuthError(error);
      }
    },
    [showToast],
  );

  const approveStudentRegistration = useCallback(
    async (reg: StudentRegistration) => {
      if (!user || !hasStaffAccess) {
        showToast('শিক্ষার্থী অনুমোদনের জন্য অ্যাডমিন লগইন আবশ্যক।', 'error');
        return;
      }
      const fees = calculateFeeBreakdown(reg.classLevel, reg.group);
      const rollNumber =
        reg.rollNumber || generateRollNumber(reg.classLevel, admissions.length + 101, 2026);
      await approveStudentRegistrationInFirestore(reg, rollNumber, fees);
      showToast(
        `${reg.studentName} (@${reg.username}) অনুমোদিত হয়েছে এবং Student List-এ সেভ হয়েছে (রোল: ${rollNumber})।`,
        'success',
      );
    },
    [admissions.length, hasStaffAccess, showToast, user],
  );

  const rejectStudentRegistration = useCallback(
    async (uid: string) => {
      if (!user || !hasStaffAccess) {
        showToast('আবেদন বাতিলের জন্য অ্যাডমিন লগইন আবশ্যক।', 'error');
        return;
      }
      await rejectStudentRegistrationInFirestore(uid);
      showToast('শিক্ষার্থীর রেজিস্ট্রেশন আবেদন বাতিল করা হয়েছে।', 'info');
    },
    [hasStaffAccess, showToast, user],
  );

  const submitStudentPortalPayment = useCallback(
    async (
      admission: AdmissionRecord,
      paymentInput: PaymentFormInput,
      amount: number,
    ): Promise<string | null> => {
      if (!user || !isApprovedStudent) {
        return 'পেমেন্ট জমা দিতে অনুমোদিত শিক্ষার্থী অ্যাকাউন্টে লগইন থাকতে হবে।';
      }
      const validation = validatePaymentInput(paymentInput);
      if (!validation.valid) {
        return Object.values(validation.errors)[0] || 'সঠিক পেমেন্ট তথ্য দিন।';
      }
      if (!Number.isFinite(amount) || amount < 500 || amount > 50000) {
        return 'সঠিক ফি পরিমাণ নির্বাচন করুন।';
      }
      try {
        await createStudentPortalPaymentInFirestore(admission, paymentInput, amount);
        showToast('আপনার পেমেন্ট তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করে অনুমোদন করবেন।', 'success');
        return null;
      } catch {
        return 'পেমেন্ট জমা দেওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      }
    },
    [isApprovedStudent, showToast, user],
  );

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setAuthError(null);
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
      await saveSiteSettingsInFirestore(nextSettings, user.uid, false);
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
      if (!user || !isRootAdmin) {
        showToast('শুধুমাত্র মূল অ্যাডমিন নতুন শিক্ষক/অ্যাডমিন যুক্ত করতে পারবেন।', 'error');
        return;
      }
      await addStaffMemberInFirestore(input);
      showToast(`${input.name}-কে সফলভাবে অনুমোদিত তালিকায় যুক্ত করা হয়েছে।`, 'success');
    },
    [isRootAdmin, showToast, user],
  );

  const removeStaffMember = useCallback(
    async (uid: string) => {
      if (!user || !isRootAdmin) {
        showToast('শুধুমাত্র মূল অ্যাডমিন এই পরিবর্তন করতে পারবেন।', 'error');
        return;
      }
      await removeStaffMemberInFirestore(uid);
      showToast('অ্যাকাউন্টের ড্যাশবোর্ড অ্যাক্সেস প্রত্যাহার করা হয়েছে।', 'info');
    },
    [isRootAdmin, showToast, user],
  );

  const addStaffInvite = useCallback(
    async (input: StaffInviteFormInput): Promise<string | null> => {
      if (!user || !isRootAdmin) {
        const msg = 'শুধুমাত্র মূল অ্যাডমিন নতুন অ্যাডমিন ইমেইল যুক্ত করতে পারবেন।';
        showToast(msg, 'error');
        return msg;
      }
      const validation = validateStaffInviteInput(input, BOOTSTRAP_PRINCIPAL_EMAIL);
      if (!validation.valid) {
        return Object.values(validation.errors)[0] || 'সঠিক তথ্য দিন।';
      }
      try {
        await addStaffInviteInFirestore(input, user.uid);
        showToast(
          `${input.email.trim().toLowerCase()}-কে সহকারী অ্যাডমিন হিসেবে অনুমোদন দেওয়া হয়েছে।`,
          'success',
        );
        return null;
      } catch {
        const msg = 'অ্যাডমিন ইমেইল সংরক্ষণ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
        showToast(msg, 'error');
        return msg;
      }
    },
    [isRootAdmin, showToast, user],
  );

  const removeStaffInvite = useCallback(
    async (inviteId: string) => {
      if (!user || !isRootAdmin) {
        showToast('শুধুমাত্র মূল অ্যাডমিন অনুমোদন বাতিল করতে পারবেন।', 'error');
        return;
      }
      await removeStaffInviteInFirestore(inviteId);
      showToast('সহকারী অ্যাডমিনের ড্যাশবোর্ড অনুমোদন বাতিল করা হয়েছে।', 'info');
    },
    [isRootAdmin, showToast, user],
  );

  const saveFacultyMember = useCallback(
    async (input: FacultyFormInput, editingId?: string): Promise<string | null> => {
      if (!user || !hasStaffAccess) {
        const msg = 'শিক্ষক প্যানেল সম্পাদনা করতে অনুমোদিত অ্যাডমিন লগইন প্রয়োজন।';
        showToast(msg, 'error');
        return msg;
      }
      const validation = validateFacultyInput(input);
      if (!validation.valid) {
        return Object.values(validation.errors)[0] || 'অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন।';
      }
      try {
        await saveFacultyMemberInFirestore({
          editingId,
          input,
          authorId: user.uid,
          existingCloudFaculty: cloudFaculty,
          defaultSeedFaculty: FACULTY_MEMBERS,
        });
        showToast(
          editingId
            ? `${input.name.trim()}-এর তথ্য ও ছবি সফলভাবে আপডেট হয়েছে।`
            : `${input.name.trim()}-কে শিক্ষক প্যানেলে যুক্ত করা হয়েছে।`,
          'success',
        );
        return null;
      } catch {
        const msg = 'শিক্ষকের তথ্য সংরক্ষণ করা যায়নি। ছবির সাইজ বা ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।';
        showToast(msg, 'error');
        return msg;
      }
    },
    [cloudFaculty, hasStaffAccess, showToast, user],
  );

  const setPrincipalFaculty = useCallback(
    async (id: string) => {
      if (!user || !hasStaffAccess) {
        showToast('প্রধান শিক্ষক পরিবর্তন করতে অনুমোদিত অ্যাডমিন লগইন প্রয়োজন।', 'error');
        return;
      }
      try {
        await setPrincipalFacultyInFirestore({
          targetId: id,
          authorId: user.uid,
          existingCloudFaculty: cloudFaculty,
          defaultSeedFaculty: FACULTY_MEMBERS,
        });
        showToast('প্রধান শিক্ষক সফলভাবে নির্ধারণ করা হয়েছে। হোম পেইজে নতুন ডিজাইনে প্রদর্শিত হবে।', 'success');
      } catch {
        showToast('প্রধান শিক্ষক আপডেট করা যায়নি। আবার চেষ্টা করুন।', 'error');
      }
    },
    [cloudFaculty, hasStaffAccess, showToast, user],
  );

  const removeFacultyMember = useCallback(
    async (id: string) => {
      if (!user || !hasStaffAccess) {
        showToast('শিক্ষক মুছে ফেলতে অনুমোদিত অ্যাডমিন লগইন প্রয়োজন।', 'error');
        return;
      }
      if (facultyMembers.length <= 1) {
        showToast('শিক্ষক প্যানেলে কমপক্ষে একজন শিক্ষক থাকা আবশ্যক।', 'error');
        return;
      }
      try {
        await deleteFacultyMemberInFirestore({
          targetId: id,
          authorId: user.uid,
          existingCloudFaculty: cloudFaculty,
          defaultSeedFaculty: FACULTY_MEMBERS,
        });
        showToast('শিক্ষকের প্রোফাইল প্যানেল থেকে মুছে ফেলা হয়েছে।', 'info');
      } catch {
        showToast('শিক্ষকের প্রোফাইল মুছে ফেলা যায়নি। আবার চেষ্টা করুন।', 'error');
      }
    },
    [cloudFaculty, facultyMembers.length, hasStaffAccess, showToast, user],
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
    isRootAdmin,
    isStudentAccount,
    isApprovedStudent,
    ownStudentRegistration,
    studentRegistrationLoaded,
    studentRegistrations,
    hasPasswordProvider,
    isCloudSynced,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithUsernameOrEmail,
    setupPrincipalPasswordAccount,
    sendPasswordReset,
    resendVerificationEmail,
    refreshAuthUser,
    changeAccountPassword,
    updateAdminUsername,
    registerStudentAccount,
    signInStudent,
    approveStudentRegistration,
    rejectStudentRegistration,
    submitStudentPortalPayment,
    signOutUser,
    siteSettings,
    updateSiteSettings,
    facultyMembers,
    saveFacultyMember,
    setPrincipalFaculty,
    removeFacultyMember,
    notices,
    routines,
    results,
    admissions,
    payments,
    staffMembers,
    staffInvites,
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
    addStaffInvite,
    removeStaffInvite,
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
