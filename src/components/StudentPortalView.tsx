import { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  Check,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  GraduationCap,
  LogIn,
  LogOut,
  Printer,
  Search,
  ShieldAlert,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type {
  AcademicGroup,
  ClassLevel,
  NoticeCategory,
  PaymentFormInput,
  PaymentMethod,
  StudentGender,
  StudentRegistrationFormInput,
  StudentResult,
} from '../types';
import {
  CLASS_LEVELS,
  calculateFeeBreakdown,
  filterAndSortNotices,
  formatBdt,
  getAllowedGroupsForClass,
  NOTICE_CATEGORIES,
  rankResultsWithMerit,
  toBengaliDigits,
  validatePaymentInput,
  validateStudentLoginInput,
  validateStudentRegistrationInput,
} from '../utils/academicLogic';
import { compressImageFile, createStudentAvatarSvg } from '../utils/imageUtils';

type StudentPanelTab = 'notices' | 'results' | 'payment';
type AuthScreenTab = 'login' | 'register';

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; merchant: string }> = [
  { id: 'bKash', label: 'বিকাশ (bKash)', merchant: '01711-245680' },
  { id: 'Nagad', label: 'নগদ (Nagad)', merchant: '01819-442190' },
  { id: 'Rocket', label: 'রকেট (Rocket)', merchant: '01711-2456809' },
  { id: 'Card', label: 'কার্ড / ব্যাংক', merchant: 'USP-2026-BANK' },
];

export function StudentPortalView() {
  const {
    user,
    authReady,
    hasStaffAccess,
    isApprovedStudent,
    ownStudentRegistration,
    studentRegistrationLoaded,
    siteSettings,
    notices,
    results,
    admissions,
    payments,
    registerStudentAccount,
    signInStudent,
    submitStudentPortalPayment,
    signOutUser,
    setActiveView,
  } = useApp();

  // Auth screen state (Login vs Register)
  const [authTab, setAuthTab] = useState<AuthScreenTab>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginSubmitError, setLoginSubmitError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Registration form state
  const [regForm, setRegForm] = useState<StudentRegistrationFormInput>({
    studentPhoto: '',
    classLevel: '৯ম',
    group: 'বিজ্ঞান',
    studentName: '',
    gender: 'ছেলে',
    fatherName: '',
    motherName: '',
    guardianPhone: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegPass, setShowRegPass] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regSubmitError, setRegSubmitError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [registering, setRegistering] = useState(false);

  // Approved Student Panel state
  const [panelTab, setPanelTab] = useState<StudentPanelTab>('notices');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory | 'সকল'>('সকল');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [resultScope, setResultScope] = useState<'mine' | 'class'>('mine');
  const [selectedMarksheet, setSelectedMarksheet] = useState<
    (StudentResult & { meritPosition: number }) | null
  >(null);

  // Student Portal Payment Form state
  const [paymentType, setPaymentType] = useState<'monthly' | 'admission'>('monthly');
  const [paymentForm, setPaymentForm] = useState<PaymentFormInput>({
    method: 'bKash',
    senderNumber: '',
    transactionId: '',
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [paymentSubmitError, setPaymentSubmitError] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const allowedRegGroups = getAllowedGroupsForClass(regForm.classLevel);
  const showGroupSelector =
    regForm.classLevel === '৯ম' ||
    regForm.classLevel === '১০ম' ||
    regForm.classLevel === 'একাদশ';

  // Own admission record (saved in Student List upon approval)
  const ownAdmission = useMemo(() => {
    if (!user || !ownStudentRegistration) return null;
    return (
      admissions.find((a) => a.id === ownStudentRegistration.admissionId) ??
      admissions.find((a) => a.ownerId === user.uid) ??
      null
    );
  }, [admissions, ownStudentRegistration, user]);

  // Notices relevant to student (all classes or student's class)
  const filteredNotices = useMemo(() => {
    const base = filterAndSortNotices(notices, {
      category: noticeCategory,
      search: noticeSearch,
    });
    if (!ownStudentRegistration) return base;
    return base.filter(
      (n) =>
        n.targetClass === 'সকল শ্রেণি' || n.targetClass === ownStudentRegistration.classLevel,
    );
  }, [notices, noticeCategory, noticeSearch, ownStudentRegistration]);

  // Results for student & class
  const rankedClassResults = useMemo(() => {
    if (!ownStudentRegistration) return [];
    const classOnly = results.filter((r) => r.classLevel === ownStudentRegistration.classLevel);
    return rankResultsWithMerit(classOnly);
  }, [ownStudentRegistration, results]);

  const ownResults = useMemo(() => {
    if (!ownStudentRegistration) return [];
    return rankedClassResults.filter(
      (r) =>
        (ownStudentRegistration.admissionId &&
          r.admissionId === ownStudentRegistration.admissionId) ||
        (ownStudentRegistration.rollNumber &&
          r.rollNumber === ownStudentRegistration.rollNumber),
    );
  }, [ownStudentRegistration, rankedClassResults]);

  // Own payments
  const ownPayments = useMemo(() => {
    if (!user) return [];
    return payments.filter((p) => p.ownerId === user.uid);
  }, [payments, user]);

  const feeSummary = useMemo(() => {
    if (ownAdmission) {
      return {
        monthlyFee: ownAdmission.monthlyFee,
        admissionFee: ownAdmission.admissionFee,
      };
    }
    if (ownStudentRegistration) {
      return calculateFeeBreakdown(
        ownStudentRegistration.classLevel,
        ownStudentRegistration.group,
      );
    }
    return { monthlyFee: 1500, admissionFee: 2000 };
  }, [ownAdmission, ownStudentRegistration]);

  const handleClassChange = (nextClass: ClassLevel) => {
    const allowed = getAllowedGroupsForClass(nextClass);
    const nextGroup: AcademicGroup = allowed.includes(regForm.group) ? regForm.group : allowed[0];
    setRegForm((prev) => ({
      ...prev,
      classLevel: nextClass,
      group: nextGroup,
    }));
    setRegErrors((prev) => ({ ...prev, classLevel: '', group: '' }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 420,
        maxHeight: 420,
        quality: 0.72,
        maxDataUrlChars: 150000,
      });
      setRegForm((prev) => ({ ...prev, studentPhoto: dataUrl }));
      setRegErrors((prev) => ({ ...prev, studentPhoto: '' }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি।');
    } finally {
      e.target.value = '';
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitError('');
    const validation = validateStudentLoginInput(loginUsername, loginPassword);
    setLoginErrors(validation.errors);
    if (!validation.valid) return;

    setLoggingIn(true);
    try {
      const err = await signInStudent(loginUsername, loginPassword);
      if (err) {
        setLoginSubmitError(err);
      } else {
        setLoginPassword('');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegSubmitError('');
    const validation = validateStudentRegistrationInput(regForm);
    setRegErrors(validation.errors);
    if (!validation.valid) return;

    setRegistering(true);
    try {
      const err = await registerStudentAccount(regForm);
      if (err) {
        setRegSubmitError(err);
      } else {
        setRegForm({
          studentPhoto: '',
          classLevel: '৯ম',
          group: 'বিজ্ঞান',
          studentName: '',
          gender: 'ছেলে',
          fatherName: '',
          motherName: '',
          guardianPhone: '',
          username: '',
          password: '',
          confirmPassword: '',
        });
      }
    } finally {
      setRegistering(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSubmitError('');
    if (!ownAdmission) {
      setPaymentSubmitError('আপনার ভর্তি তথ্য এখনো লোড হয়নি। অনুগ্রহ করে পেজটি রিলোড করুন।');
      return;
    }
    const validation = validatePaymentInput(paymentForm);
    setPaymentErrors(validation.errors);
    if (!validation.valid) return;

    const payableAmount =
      paymentType === 'monthly' ? feeSummary.monthlyFee : feeSummary.admissionFee;

    setSubmittingPayment(true);
    try {
      const err = await submitStudentPortalPayment(ownAdmission, paymentForm, payableAmount);
      if (err) {
        setPaymentSubmitError(err);
      } else {
        setPaymentForm({ method: 'bKash', senderNumber: '', transactionId: '' });
        setPaymentErrors({});
      }
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Loading state
  if (!authReady || (user && !hasStaffAccess && !studentRegistrationLoaded)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-white border border-[#E7E2DA] rounded-2xl p-10 space-y-2">
          <p className="text-base font-semibold text-[#1C1917]">শিক্ষার্থী প্যানেল লোড হচ্ছে...</p>
          <p className="text-sm text-[#57534E]">অনুগ্রহ করে একটু অপেক্ষা করুন।</p>
        </div>
      </div>
    );
  }

  // State A: Currently logged in as Admin/Staff
  if (user && hasStaffAccess) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <section className="bg-white border border-[#E7E2DA] rounded-2xl p-8 text-center space-y-5">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-[#7A0D14]" aria-hidden="true" />
          </span>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#B8862B]">Student Panel</p>
            <h1 className="text-2xl font-bold text-[#1C1917]">
              আপনি বর্তমানে অ্যাডমিন অ্যাকাউন্টে লগইন আছেন
            </h1>
            <p className="text-sm text-[#57534E] leading-relaxed">
              শিক্ষার্থীদের আবেদন অনুমোদন করতে ড্যাশবোর্ডের{' '}
              <strong className="text-[#1C1917]">Student Login Approval</strong> ট্যাবে যান, অথবা
              শিক্ষার্থী হিসেবে লগইন করতে বর্তমান অ্যাকাউন্ট থেকে লগআউট করুন।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer"
            >
              অ্যাডমিন ড্যাশবোর্ডে যান
            </button>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট করে Student Login-এ যান</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  // State B: Logged-out Student Login / Register Screen
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <section className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-9 space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-[#7A0D14]" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#B8862B]">শিক্ষার্থী পোর্টাল</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                {authTab === 'login' ? 'Student Login' : 'নতুন শিক্ষার্থী রেজিস্ট্রেশন'}
              </h1>
              <p className="text-sm text-[#57534E]">
                {authTab === 'login'
                  ? 'নোটিশ বোর্ড, পরীক্ষার রেজাল্ট ও পেমেন্ট দেখতে আপনার ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।'
                  : 'নতুন একাউন্টের জন্য নিচের ফরমটি পূরণ করুন। অ্যাডমিন অনুমোদন দিলেই আপনি লগইন করতে পারবেন।'}
              </p>
            </div>
          </div>

          {/* Login / Register Tab Switcher */}
          <div
            role="tablist"
            aria-label="শিক্ষার্থী লগইন বা রেজিস্ট্রেশন"
            className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4F0E8] border border-[#E7E2DA] rounded-xl text-sm"
          >
            <button
              id="tab-student-login"
              type="button"
              role="tab"
              aria-selected={authTab === 'login'}
              aria-controls="panel-student-auth"
              onClick={() => {
                setAuthTab('login');
                setRegSubmitError('');
              }}
              className={`py-2.5 px-3 font-semibold rounded-lg transition-colors cursor-pointer ${
                authTab === 'login'
                  ? 'bg-[#7A0D14] text-white'
                  : 'text-[#44403C] hover:text-[#1C1917]'
              }`}
            >
              Student Login
            </button>
            <button
              id="tab-student-register"
              type="button"
              role="tab"
              aria-selected={authTab === 'register'}
              aria-controls="panel-student-auth"
              onClick={() => {
                setAuthTab('register');
                setLoginSubmitError('');
              }}
              className={`py-2.5 px-3 font-semibold rounded-lg transition-colors cursor-pointer ${
                authTab === 'register'
                  ? 'bg-[#7A0D14] text-white'
                  : 'text-[#44403C] hover:text-[#1C1917]'
              }`}
            >
              Register (নতুন একাউন্ট)
            </button>
          </div>

          <div
            id="panel-student-auth"
            role="tabpanel"
            aria-labelledby={authTab === 'login' ? 'tab-student-login' : 'tab-student-register'}
          >
            {authTab === 'login' ? (
              <form onSubmit={handleStudentLogin} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="stu-login-user"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Username (ইউজারনেম) *
                  </label>
                  <input
                    id="stu-login-user"
                    type="text"
                    autoComplete="username"
                    value={loginUsername}
                    onChange={(e) => {
                      setLoginUsername(e.target.value);
                      setLoginErrors((prev) => ({ ...prev, username: '' }));
                      setLoginSubmitError('');
                    }}
                    placeholder="যেমন: mahmud_9"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14] focus:ring-2 focus:ring-[#7A0D14]/15"
                  />
                  {loginErrors.username && (
                    <p role="alert" className="text-xs text-[#B91C1C]">
                      {loginErrors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="stu-login-pass"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Password (পাসওয়ার্ড) *
                  </label>
                  <div className="relative">
                    <input
                      id="stu-login-pass"
                      type={showLoginPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginErrors((prev) => ({ ...prev, password: '' }));
                        setLoginSubmitError('');
                      }}
                      placeholder="আপনার পাসওয়ার্ড লিখুন"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14] focus:ring-2 focus:ring-[#7A0D14]/15"
                    />
                    <button
                      type="button"
                      aria-label={showLoginPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                      onClick={() => setShowLoginPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p role="alert" className="text-xs text-[#B91C1C]">
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                {loginSubmitError && (
                  <div
                    role="alert"
                    className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium rounded-xl px-4 py-3"
                  >
                    {loginSubmitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loggingIn ? 'লগইন হচ্ছে...' : 'Student Login'}</span>
                </button>

                <div className="pt-2 text-center text-xs text-[#57534E]">
                  একাউন্ট নেই?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className="font-semibold text-[#7A0D14] hover:underline cursor-pointer"
                  >
                    Register-এ ক্লিক করে নতুন একাউন্টের আবেদন করুন
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStudentRegister} noValidate className="space-y-5">
                {/* 1. Student Photo Upload */}
                <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-[#D6CFC5] overflow-hidden flex items-center justify-center shrink-0">
                    {regForm.studentPhoto ? (
                      <img
                        src={regForm.studentPhoto}
                        alt="শিক্ষার্থীর ছবি প্রিভিউ"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] text-[#78716C] text-center px-1">
                        শিক্ষার্থীর ছবি
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-bold text-[#1C1917]">শিক্ষার্থীর ছবি *</p>
                    <p className="text-xs text-[#57534E]">
                      পাসপোর্ট সাইজ স্পষ্ট ছবি আপলোড করুন (JPG/PNG)।
                    </p>
                    <label
                      htmlFor="stu-reg-photo"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7A0D14] text-white text-xs font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{regForm.studentPhoto ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন'}</span>
                      <input
                        id="stu-reg-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handlePhotoUpload(e)}
                        className="sr-only"
                      />
                    </label>
                    {(photoError || regErrors.studentPhoto) && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {photoError || regErrors.studentPhoto}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Class & Conditional Group (9-11) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="stu-reg-class"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      ক্লাস (শ্রেণি) *
                    </label>
                    <select
                      id="stu-reg-class"
                      value={regForm.classLevel}
                      onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    >
                      {CLASS_LEVELS.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls} শ্রেণি
                        </option>
                      ))}
                    </select>
                  </div>

                  {showGroupSelector ? (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="stu-reg-group"
                        className="block text-xs font-semibold text-[#1C1917]"
                      >
                        গ্রুপ (৯ম – একাদশ শ্রেণির জন্য) *
                      </label>
                      <select
                        id="stu-reg-group"
                        value={regForm.group}
                        onChange={(e) => {
                          setRegForm((prev) => ({
                            ...prev,
                            group: e.target.value as AcademicGroup,
                          }));
                          setRegErrors((prev) => ({ ...prev, group: '' }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                      >
                        {allowedRegGroups.map((grp) => (
                          <option key={grp} value={grp}>
                            {grp}
                          </option>
                        ))}
                      </select>
                      {regErrors.group && (
                        <p role="alert" className="text-xs text-[#B91C1C]">
                          {regErrors.group}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="block text-xs font-semibold text-[#1C1917]">বিভাগ / গ্রুপ</p>
                      <div className="px-3.5 py-2.5 bg-[#F4F0E8] border border-[#E7E2DA] rounded-xl text-sm text-[#57534E]">
                        সাধারণ (৬ষ্ঠ – ৮ম শ্রেণির জন্য গ্রুপ প্রযোজ্য নয়)
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Name & Gender (ছেলে / মেয়ে ঠিক চিহ্ন দেওয়ার অপশন) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="stu-reg-name"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      শিক্ষার্থীর নাম *
                    </label>
                    <input
                      id="stu-reg-name"
                      type="text"
                      value={regForm.studentName}
                      onChange={(e) => {
                        setRegForm((prev) => ({ ...prev, studentName: e.target.value }));
                        setRegErrors((prev) => ({ ...prev, studentName: '' }));
                      }}
                      placeholder="শিক্ষার্থীর পূর্ণ নাম"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {regErrors.studentName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {regErrors.studentName}
                      </p>
                    )}
                  </div>

                  <fieldset className="space-y-1.5">
                    <legend className="block text-xs font-semibold text-[#1C1917]">
                      শিক্ষার্থী (ছেলে / মেয়ে ঠিক চিহ্ন দিন) *
                    </legend>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['ছেলে', 'মেয়ে'] as StudentGender[]).map((g) => {
                        const checked = regForm.gender === g;
                        return (
                          <label
                            key={g}
                            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                              checked
                                ? 'bg-[#7A0D14]/8 border-[#7A0D14] text-[#7A0D14]'
                                : 'bg-[#FAF8F5] border-[#D6CFC5] text-[#44403C] hover:border-[#7A0D14]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="studentGender"
                              value={g}
                              checked={checked}
                              onChange={() => {
                                setRegForm((prev) => ({ ...prev, gender: g }));
                                setRegErrors((prev) => ({ ...prev, gender: '' }));
                              }}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                checked
                                  ? 'bg-[#7A0D14] border-[#7A0D14] text-white'
                                  : 'bg-white border-[#A8A29E]'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                            <span>{g}</span>
                          </label>
                        );
                      })}
                    </div>
                    {regErrors.gender && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {regErrors.gender}
                      </p>
                    )}
                  </fieldset>
                </div>

                {/* 4. Father, Mother & Guardian Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="stu-reg-father"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      পিতার নাম *
                    </label>
                    <input
                      id="stu-reg-father"
                      type="text"
                      value={regForm.fatherName}
                      onChange={(e) => {
                        setRegForm((prev) => ({ ...prev, fatherName: e.target.value }));
                        setRegErrors((prev) => ({ ...prev, fatherName: '' }));
                      }}
                      placeholder="পিতার পূর্ণ নাম"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {regErrors.fatherName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {regErrors.fatherName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="stu-reg-mother"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      মাতার নাম *
                    </label>
                    <input
                      id="stu-reg-mother"
                      type="text"
                      value={regForm.motherName}
                      onChange={(e) => {
                        setRegForm((prev) => ({ ...prev, motherName: e.target.value }));
                        setRegErrors((prev) => ({ ...prev, motherName: '' }));
                      }}
                      placeholder="মাতার পূর্ণ নাম"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {regErrors.motherName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {regErrors.motherName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="stu-reg-phone"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      অভিভাবকের মোবাইল নম্বর *
                    </label>
                    <input
                      id="stu-reg-phone"
                      type="tel"
                      value={regForm.guardianPhone}
                      onChange={(e) => {
                        setRegForm((prev) => ({ ...prev, guardianPhone: e.target.value }));
                        setRegErrors((prev) => ({ ...prev, guardianPhone: '' }));
                      }}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {regErrors.guardianPhone && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {regErrors.guardianPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Login Credentials: Username, Password, Re-type Password */}
                <div className="pt-3 border-t border-[#E7E2DA] space-y-4">
                  <p className="text-xs font-bold text-[#7A0D14]">লগইন তথ্য সেট করুন</p>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="stu-reg-username"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      Username (ইউজারনেম) *
                    </label>
                    <input
                      id="stu-reg-username"
                      type="text"
                      autoComplete="username"
                      value={regForm.username}
                      onChange={(e) => {
                        setRegForm((prev) => ({ ...prev, username: e.target.value }));
                        setRegErrors((prev) => ({ ...prev, username: '' }));
                      }}
                      placeholder="যেমন: rahim_2026 (ইংরেজি ছোট হাতের অক্ষর ও সংখ্যা)"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {regErrors.username && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {regErrors.username}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="stu-reg-password"
                        className="block text-xs font-semibold text-[#1C1917]"
                      >
                        Password (কমপক্ষে ৮ অক্ষর) *
                      </label>
                      <div className="relative">
                        <input
                          id="stu-reg-password"
                          type={showRegPass ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regForm.password}
                          onChange={(e) => {
                            setRegForm((prev) => ({ ...prev, password: e.target.value }));
                            setRegErrors((prev) => ({ ...prev, password: '' }));
                          }}
                          placeholder="কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড"
                          className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                        />
                        <button
                          type="button"
                          aria-label={showRegPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                          onClick={() => setShowRegPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                        >
                          {showRegPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {regErrors.password && (
                        <p role="alert" className="text-xs text-[#B91C1C]">
                          {regErrors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="stu-reg-confirm"
                        className="block text-xs font-semibold text-[#1C1917]"
                      >
                        Re-type Password (পুনরায় পাসওয়ার্ড) *
                      </label>
                      <input
                        id="stu-reg-confirm"
                        type={showRegPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={regForm.confirmPassword}
                        onChange={(e) => {
                          setRegForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                          setRegErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }}
                        placeholder="পাসওয়ার্ডটি পুনরায় লিখুন"
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                      />
                      {regErrors.confirmPassword && (
                        <p role="alert" className="text-xs text-[#B91C1C]">
                          {regErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {regSubmitError && (
                  <div
                    role="alert"
                    className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium rounded-xl px-4 py-3"
                  >
                    {regSubmitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{registering ? 'আবেদন জমা হচ্ছে...' : 'রেজিস্ট্রেশন আবেদন জমা দিন'}</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    );
  }

  // State C: Logged in Student whose registration is pending, rejected, or missing
  if (!isApprovedStudent) {
    const status = ownStudentRegistration?.status;
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <section className="bg-white border border-[#E7E2DA] rounded-2xl p-8 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            {ownStudentRegistration ? (
              <img
                src={
                  ownStudentRegistration.studentPhoto ||
                  createStudentAvatarSvg(ownStudentRegistration.studentName, 0)
                }
                alt={ownStudentRegistration.studentName}
                className="w-20 h-20 rounded-2xl object-cover border border-[#D6CFC5]"
              />
            ) : (
              <span className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-[#B45309]" />
              </span>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#B8862B]">
                {status === 'rejected'
                  ? 'আবেদন বাতিল হয়েছে'
                  : status === 'pending'
                    ? 'অ্যাডমিন অনুমোদনের অপেক্ষায়'
                    : 'শিক্ষার্থী প্রোফাইল পাওয়া যায়নি'}
              </p>
              <h1 className="text-2xl font-bold text-[#1C1917]">
                {status === 'rejected'
                  ? 'আপনার একাউন্ট আবেদনটি অনুমোদিত হয়নি'
                  : status === 'pending'
                    ? 'আপনার আবেদনটি অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে'
                    : 'এই অ্যাকাউন্টটি শিক্ষার্থী হিসেবে নিবন্ধিত নয়'}
              </h1>
            </div>
          </div>

          {ownStudentRegistration && (
            <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 text-left text-xs space-y-1.5">
              <p className="font-bold text-sm text-[#1C1917]">
                {ownStudentRegistration.studentName} ({ownStudentRegistration.gender})
              </p>
              <p className="text-[#57534E]">
                {ownStudentRegistration.classLevel} শ্রেণি · {ownStudentRegistration.group} ·
                ইউজারনেম:{' '}
                <span className="font-mono-tabular font-semibold text-[#7A0D14]">
                  @{ownStudentRegistration.username}
                </span>
              </p>
              <p className="text-[#57534E]">
                পিতা: {ownStudentRegistration.fatherName} · মাতা: {ownStudentRegistration.motherName}
              </p>
            </div>
          )}

          <p className="text-sm text-[#57534E] leading-relaxed">
            {status === 'rejected' ? (
              'বিস্তারিত জানতে প্রতিষ্ঠানের অফিসে যোগাযোগ করুন।'
            ) : status === 'pending' ? (
              <>
                <Clock className="w-4 h-4 inline-block mr-1 text-[#B8862B] -mt-0.5" />
                অ্যাডমিন তাঁর ড্যাশবোর্ডের <strong className="text-[#1C1917]">Student Login Approval</strong>{' '}
                থেকে অনুমতি দিলেই আপনার তথ্য Student List-এ সংরক্ষিত হবে এবং আপনার Student Panel
                (নোটিশ, রেজাল্ট ও পেমেন্ট) চালু হয়ে যাবে।
              </>
            ) : (
              'অনুগ্রহ করে লগআউট করে শিক্ষার্থী ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন অথবা নতুন রেজিস্ট্রেশন করুন।'
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট করুন</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="px-5 py-2.5 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
            >
              হোম পেইজে ফিরুন
            </button>
          </div>
        </section>
      </div>
    );
  }

  // State D: Approved Student Panel (1. Notice Board, 2. Result Section, 3. Payment)
  const student = ownStudentRegistration!;
  const activeResultsList = resultScope === 'mine' ? ownResults : rankedClassResults;
  const selectedMethodObj =
    PAYMENT_METHODS.find((m) => m.id === paymentForm.method) ?? PAYMENT_METHODS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Student Profile Header */}
      <div className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <img
            src={student.studentPhoto || createStudentAvatarSvg(student.studentName, 0)}
            alt={student.studentName}
            className="w-16 h-16 rounded-xl object-cover border border-[#D6CFC5] shrink-0"
          />
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-[#B8862B]">Student Panel · অনুমোদিত শিক্ষার্থী</p>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] truncate">
              {student.studentName}
            </h1>
            <p className="text-xs sm:text-sm text-[#57534E]">
              {student.classLevel} শ্রেণি ({student.group}) · {student.gender} · রোল:{' '}
              <span className="font-mono-tabular font-semibold text-[#7A0D14]">
                {student.rollNumber || ownAdmission?.rollNumber || '—'}
              </span>{' '}
              · <span className="font-mono-tabular">@{student.username}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signOutUser()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট</span>
        </button>
      </div>

      {/* Main Student Workspace: 3 Requested Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-white border border-[#E7E2DA] rounded-2xl p-3 no-print">
          <nav aria-label="শিক্ষার্থী প্যানেল মেনু" className="flex lg:flex-col gap-1 overflow-x-auto">
            {(
              [
                { id: 'notices' as StudentPanelTab, label: 'Notice Board (নোটিশ)', icon: Bell },
                { id: 'results' as StudentPanelTab, label: 'Result Section (রেজাল্ট)', icon: Award },
                { id: 'payment' as StudentPanelTab, label: 'Payment (পেমেন্ট)', icon: CreditCard },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = panelTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPanelTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#7A0D14] text-white'
                      : 'text-[#44403C] hover:bg-[#FAF8F5] hover:text-[#1C1917]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {/* 1. Notice Board */}
          {panelTab === 'notices' && (
            <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#F0EBE3]">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917]">Notice Board — নোটিশ বোর্ড</h2>
                  <p className="text-xs text-[#78716C]">
                    সকল শ্রেণি এবং {student.classLevel} শ্রেণির সর্বশেষ অফিসিয়াল নোটিশসমূহ।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    aria-label="নোটিশ ধরন"
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory | 'সকল')}
                    className="px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                  >
                    <option value="সকল">সব ধরন</option>
                    {NOTICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={noticeSearch}
                      onChange={(e) => setNoticeSearch(e.target.value)}
                      placeholder="নোটিশ খুঁজুন..."
                      className="pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm w-full sm:w-52"
                    />
                  </div>
                </div>
              </div>

              {filteredNotices.length === 0 ? (
                <div className="py-14 text-center space-y-2 bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl">
                  <Bell className="w-7 h-7 text-[#A8A29E] mx-auto" />
                  <p className="text-base font-semibold text-[#1C1917]">
                    এখনো কোন নোটিশ পাবলিশ হয়নি
                  </p>
                  <p className="text-xs text-[#78716C]">
                    প্রতিষ্ঠান থেকে নতুন নোটিশ প্রকাশ করা হলে এখানে দেখা যাবে।
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EBE3]">
                  {filteredNotices.map((notice) => (
                    <article key={notice.id} className="py-4 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#78716C]">
                        <span className="font-semibold text-[#7A0D14]">{notice.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{notice.targetClass}</span>
                        <span aria-hidden="true">·</span>
                        <span>{notice.publishedDate}</span>
                        {notice.pinned && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#B8862B]">জরুরি</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917]">{notice.title}</h3>
                      <p className="text-sm text-[#57534E] leading-relaxed whitespace-pre-line">
                        {notice.body}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 2. Result Section */}
          {panelTab === 'results' && (
            <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#F0EBE3]">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917]">
                    Result Section — পরীক্ষার ফলাফল ({student.classLevel} শ্রেণি)
                  </h2>
                  <p className="text-xs text-[#78716C]">
                    আপনার প্রকাশিত নম্বর, গ্রেড ও শ্রেণিভিত্তিক মেধাতালিকা দেখুন এবং মার্কশিট প্রিন্ট
                    করুন।
                  </p>
                </div>

                <div className="inline-flex p-1 bg-[#F4F0E8] border border-[#E7E2DA] rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setResultScope('mine')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      resultScope === 'mine' ? 'bg-[#7A0D14] text-white' : 'text-[#44403C]'
                    }`}
                  >
                    আমার রেজাল্ট ({toBengaliDigits(ownResults.length)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultScope('class')}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      resultScope === 'class' ? 'bg-[#7A0D14] text-white' : 'text-[#44403C]'
                    }`}
                  >
                    {student.classLevel} শ্রেণির মেধাতালিকা (
                    {toBengaliDigits(rankedClassResults.length)})
                  </button>
                </div>
              </div>

              {activeResultsList.length === 0 ? (
                <div className="py-14 text-center space-y-2 bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl">
                  <Award className="w-7 h-7 text-[#B8862B] mx-auto" />
                  <p className="text-base font-semibold text-[#1C1917]">
                    এখনো কোনো পরীক্ষার রেজাল্ট পাবলিশ হয়নি
                  </p>
                  <p className="text-xs text-[#78716C]">
                    অ্যাডমিন প্যানেল থেকে আপনার শ্রেণির রেজাল্ট প্রকাশ করলে এখানে দেখা যাবে।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                        <th className="py-3 px-3">মেধাক্রম</th>
                        <th className="py-3 px-3">শিক্ষার্থী</th>
                        <th className="py-3 px-3">পরীক্ষা ও বিষয়</th>
                        <th className="py-3 px-3 text-right">প্রাপ্ত নম্বর</th>
                        <th className="py-3 px-3 text-right">গ্রেড / GPA</th>
                        <th className="py-3 px-3 text-right">মার্কশিট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                      {activeResultsList.map((res, idx) => (
                        <tr key={res.id} className="hover:bg-[#FAF8F5]">
                          <td className="py-3 px-3 font-bold font-mono-tabular text-[#7A0D14]">
                            #{toBengaliDigits(res.meritPosition)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  res.studentPhoto || createStudentAvatarSvg(res.studentName, idx)
                                }
                                alt={res.studentName}
                                className="w-9 h-9 rounded-lg object-cover border border-[#E7E2DA] shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-[#1C1917]">{res.studentName}</p>
                                <p className="text-xs font-mono-tabular text-[#78716C]">
                                  রোল: {res.rollNumber}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-[#1C1917]">{res.examName}</p>
                            <p className="text-xs text-[#78716C]">
                              {res.subject} · {res.publishedDate}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-[#1C1917]">
                            {toBengaliDigits(res.obtainedMarks)} / {toBengaliDigits(res.fullMarks)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-tabular">
                            <span
                              className={`font-bold ${
                                res.grade === 'F' ? 'text-[#B91C1C]' : 'text-[#15803D]'
                              }`}
                            >
                              {res.grade} ({res.gpa.toFixed(2)})
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedMarksheet(res)}
                              className="text-xs font-semibold text-[#7A0D14] hover:underline cursor-pointer"
                            >
                              দেখুন
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* 3. Payment Section */}
          {panelTab === 'payment' && (
            <div className="space-y-6">
              {/* Fee Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">মাসিক বেতন ({student.classLevel} শ্রেণি)</p>
                  <p className="text-2xl font-bold text-[#7A0D14] tabular-nums mt-1">
                    {formatBdt(feeSummary.monthlyFee)}
                  </p>
                </div>
                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">ভর্তি / সেশন ফি</p>
                  <p className="text-2xl font-bold text-[#1C1917] tabular-nums mt-1">
                    {formatBdt(feeSummary.admissionFee)}
                  </p>
                </div>
                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">মোট জমাকৃত পেমেন্ট</p>
                  <p className="text-2xl font-bold text-[#15803D] tabular-nums mt-1">
                    {toBengaliDigits(ownPayments.length)} টি
                  </p>
                </div>
              </div>

              {/* Submit Fee Payment Form */}
              <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <h2 className="text-lg font-bold text-[#1C1917]">অনলাইন ফি পেমেন্ট জমা দিন</h2>
                  <p className="text-xs text-[#78716C]">
                    নিচের মার্চেন্ট নম্বরে টাকা পাঠিয়ে আপনার প্রেরক নম্বর ও Transaction ID জমা দিন।
                  </p>
                </div>

                <form onSubmit={handlePaymentSubmit} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentType('monthly')}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        paymentType === 'monthly'
                          ? 'bg-[#7A0D14]/6 border-[#7A0D14]'
                          : 'bg-[#FAF8F5] border-[#E7E2DA]'
                      }`}
                    >
                      <p className="text-xs text-[#78716C]">মাসিক বেতন</p>
                      <p className="text-base font-bold text-[#1C1917] tabular-nums">
                        {formatBdt(feeSummary.monthlyFee)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('admission')}
                      className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        paymentType === 'admission'
                          ? 'bg-[#7A0D14]/6 border-[#7A0D14]'
                          : 'bg-[#FAF8F5] border-[#E7E2DA]'
                      }`}
                    >
                      <p className="text-xs text-[#78716C]">ভর্তি / সেশন ফি</p>
                      <p className="text-base font-bold text-[#1C1917] tabular-nums">
                        {formatBdt(feeSummary.admissionFee)}
                      </p>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentForm((prev) => ({ ...prev, method: m.id }))}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          paymentForm.method === m.id
                            ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                            : 'bg-[#FAF8F5] text-[#44403C] border-[#D6CFC5] hover:border-[#7A0D14]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-3.5 text-xs text-[#44403C]">
                    <span className="font-semibold text-[#1C1917]">{selectedMethodObj.label}</span>{' '}
                    মার্চেন্ট / অ্যাকাউন্ট নম্বর:{' '}
                    <span className="font-mono-tabular font-bold text-[#7A0D14]">
                      {selectedMethodObj.merchant}
                    </span>{' '}
                    · পরিশোধযোগ্য:{' '}
                    <span className="font-bold text-[#1C1917] tabular-nums">
                      {formatBdt(
                        paymentType === 'monthly'
                          ? feeSummary.monthlyFee
                          : feeSummary.admissionFee,
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="stu-pay-sender"
                        className="block text-xs font-semibold text-[#1C1917]"
                      >
                        প্রেরক মোবাইল নম্বর / অ্যাকাউন্ট *
                      </label>
                      <input
                        id="stu-pay-sender"
                        type="text"
                        value={paymentForm.senderNumber}
                        onChange={(e) => {
                          setPaymentForm((prev) => ({ ...prev, senderNumber: e.target.value }));
                          setPaymentErrors((prev) => ({ ...prev, senderNumber: '' }));
                        }}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm font-mono-tabular"
                      />
                      {paymentErrors.senderNumber && (
                        <p role="alert" className="text-xs text-[#B91C1C]">
                          {paymentErrors.senderNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="stu-pay-trx"
                        className="block text-xs font-semibold text-[#1C1917]"
                      >
                        Transaction ID (TrxID) *
                      </label>
                      <input
                        id="stu-pay-trx"
                        type="text"
                        value={paymentForm.transactionId}
                        onChange={(e) => {
                          setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }));
                          setPaymentErrors((prev) => ({ ...prev, transactionId: '' }));
                        }}
                        placeholder="যেমন: BK89A12C45"
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm font-mono-tabular uppercase"
                      />
                      {paymentErrors.transactionId && (
                        <p role="alert" className="text-xs text-[#B91C1C]">
                          {paymentErrors.transactionId}
                        </p>
                      )}
                    </div>
                  </div>

                  {paymentSubmitError && (
                    <div
                      role="alert"
                      className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium rounded-xl px-4 py-3"
                    >
                      {paymentSubmitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{submittingPayment ? 'জমা হচ্ছে...' : 'পেমেন্ট তথ্য জমা দিন'}</span>
                  </button>
                </form>
              </section>

              {/* Payment History Ledger */}
              <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#E7E2DA]">
                  <h3 className="text-base font-bold text-[#1C1917]">আমার পেমেন্ট ইতিহাস</h3>
                </div>
                {ownPayments.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#78716C]">
                    এখনো কোনো পেমেন্ট জমা দেওয়া হয়নি।
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                          <th className="py-3 px-4">মাধ্যম ও TrxID</th>
                          <th className="py-3 px-4">প্রেরক নম্বর</th>
                          <th className="py-3 px-4 text-right">পরিমাণ</th>
                          <th className="py-3 px-4 text-right">অবস্থা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE3]">
                        {ownPayments.map((pay) => (
                          <tr key={pay.id}>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#1C1917]">{pay.method}</p>
                              <p className="text-xs font-mono-tabular text-[#78716C]">
                                {pay.transactionId}
                              </p>
                            </td>
                            <td className="py-3 px-4 font-mono-tabular text-[#44403C]">
                              {pay.senderNumber}
                            </td>
                            <td className="py-3 px-4 text-right font-bold tabular-nums text-[#1C1917]">
                              {formatBdt(pay.amount)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`text-xs font-semibold ${
                                  pay.status === 'verified'
                                    ? 'text-[#15803D]'
                                    : pay.status === 'refunded'
                                      ? 'text-[#B91C1C]'
                                      : 'text-[#B45309]'
                                }`}
                              >
                                {pay.status === 'verified'
                                  ? 'যাচাইকৃত'
                                  : pay.status === 'refunded'
                                    ? 'রিফান্ড / বাতিল'
                                    : 'যাচাই অপেক্ষমান'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Printable Marksheet Modal */}
      {selectedMarksheet && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-marksheet-title"
        >
          <div className="bg-white border border-[#E7E2DA] rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 my-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
              <div>
                <p className="text-xs font-semibold text-[#B8862B]">{siteSettings.siteName}</p>
                <h3 id="student-marksheet-title" className="text-xl font-bold text-[#1C1917]">
                  একাডেমিক মার্কশিট
                </h3>
                <p className="text-xs text-[#78716C]">{selectedMarksheet.examName}</p>
              </div>
              <button
                type="button"
                aria-label="বন্ধ করুন"
                onClick={() => setSelectedMarksheet(null)}
                className="p-2 text-[#78716C] hover:text-[#1C1917] rounded-lg no-print cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={
                  selectedMarksheet.studentPhoto ||
                  createStudentAvatarSvg(selectedMarksheet.studentName, 0)
                }
                alt={selectedMarksheet.studentName}
                className="w-16 h-16 rounded-xl object-cover border border-[#D6CFC5]"
              />
              <div>
                <p className="text-base font-bold text-[#1C1917]">{selectedMarksheet.studentName}</p>
                <p className="text-xs text-[#57534E]">
                  {selectedMarksheet.classLevel} শ্রেণি ({selectedMarksheet.group}) · রোল:{' '}
                  <span className="font-mono-tabular font-semibold">
                    {selectedMarksheet.rollNumber}
                  </span>
                </p>
                <p className="text-xs text-[#7A0D14] font-semibold">
                  মেধাক্রম: #{toBengaliDigits(selectedMarksheet.meritPosition)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 text-sm">
              <div>
                <dt className="text-xs text-[#78716C]">বিষয়</dt>
                <dd className="font-semibold text-[#1C1917]">{selectedMarksheet.subject}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#78716C]">প্রাপ্ত নম্বর</dt>
                <dd className="font-bold font-mono-tabular text-[#1C1917]">
                  {toBengaliDigits(selectedMarksheet.obtainedMarks)} /{' '}
                  {toBengaliDigits(selectedMarksheet.fullMarks)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#78716C]">গ্রেড ও জিপিএ</dt>
                <dd className="font-bold font-mono-tabular text-[#15803D]">
                  {selectedMarksheet.grade} (GPA {selectedMarksheet.gpa.toFixed(2)})
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#78716C]">প্রকাশের তারিখ</dt>
                <dd className="font-medium text-[#1C1917]">{selectedMarksheet.publishedDate}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-end gap-3 pt-1 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0D14] text-white text-xs font-semibold rounded-lg hover:bg-[#5E090F] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>মার্কশিট প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMarksheet(null)}
                className="px-4 py-2 bg-[#FAF8F5] text-[#1C1917] text-xs font-semibold rounded-lg border border-[#D6CFC5] cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
