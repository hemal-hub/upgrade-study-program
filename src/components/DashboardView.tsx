import { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  Calendar,
  Check,
  Copy,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldAlert,
  Sliders,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminCmsTab } from './admin/AdminCmsTab';
import { AdminResultsTab } from './admin/AdminResultsTab';
import { AdminStudentListTab } from './admin/AdminStudentListTab';
import { createStudentAvatarSvg } from '../utils/imageUtils';
import type {
  AcademicGroup,
  ClassLevel,
  DayOfWeek,
  NoticeCategory,
  NoticeFormInput,
  NoticeTargetClass,
  RoutineFormInput,
  StaffFormInput,
  TransactionStatus,
} from '../types';
import {
  CLASS_LEVELS,
  computeDashboardMetrics,
  DAYS_OF_WEEK,
  filterAndSortNotices,
  filterAndSortRoutines,
  formatBdt,
  getAllowedGroupsForClass,
  NOTICE_CATEGORIES,
  toBengaliDigits,
  validateNoticeInput,
  validateRoutineInput,
  validateStaffInput,
} from '../utils/academicLogic';

type DashboardTab =
  | 'overview'
  | 'studentList'
  | 'students'
  | 'payments'
  | 'results'
  | 'routines'
  | 'notices'
  | 'cms'
  | 'staff';

const BASE_SIDEBAR_ITEMS: Array<{ id: DashboardTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'সংক্ষিপ্ত চিত্র', icon: LayoutDashboard },
  { id: 'studentList', label: 'Student List', icon: GraduationCap },
  { id: 'students', label: 'ভর্তি অনুমোদন', icon: Users },
  { id: 'payments', label: 'পেমেন্ট লেজার', icon: CreditCard },
  { id: 'results', label: 'রেজাল্ট প্রকাশ', icon: Award },
  { id: 'routines', label: 'রুটিন প্রকাশ', icon: Calendar },
  { id: 'notices', label: 'নোটিশ প্রকাশ', icon: Bell },
  { id: 'cms', label: 'ওয়েবসাইট কনটেন্ট (CMS)', icon: Sliders },
];

export function DashboardView() {
  const {
    user,
    authReady,
    userRole,
    hasStaffAccess,
    isPrincipalAccess,
    signInWithGoogle,
    signOutUser,
    setActiveView,
    admissions,
    payments,
    routines,
    notices,
    staffMembers,
    publishNotice,
    removeNotice,
    publishRoutine,
    removeRoutine,
    updateAdmissionStatus,
    updatePaymentStatus,
    addStaffMember,
    removeStaffMember,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<ClassLevel | 'সকল'>('সকল');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<TransactionStatus | 'সকল'>('সকল');

  // Routine publisher form state
  const [routineForm, setRoutineForm] = useState<RoutineFormInput>({
    classLevel: '৯ম',
    group: 'বিজ্ঞান',
    day: 'শনিবার',
    timeSlot: '',
    subject: '',
    teacherName: '',
    room: '',
  });
  const [routineErrors, setRoutineErrors] = useState<Record<string, string>>({});
  const [savingRoutine, setSavingRoutine] = useState(false);

  // Notice publisher form state
  const [noticeForm, setNoticeForm] = useState<NoticeFormInput>({
    title: '',
    body: '',
    category: 'সাধারণ',
    targetClass: 'সকল শ্রেণি',
    pinned: false,
  });
  const [noticeErrors, setNoticeErrors] = useState<Record<string, string>>({});
  const [savingNotice, setSavingNotice] = useState(false);

  // Principal Staff Management form state
  const [staffForm, setStaffForm] = useState<StaffFormInput>({
    uid: '',
    name: '',
    role: 'teacher',
    subject: '',
  });
  const [staffErrors, setStaffErrors] = useState<Record<string, string>>({});
  const [savingStaff, setSavingStaff] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const sidebarItems = useMemo(
    () =>
      isPrincipalAccess
        ? [
            ...BASE_SIDEBAR_ITEMS,
            { id: 'staff' as DashboardTab, label: 'শিক্ষক ব্যবস্থাপনা', icon: UserPlus },
          ]
        : BASE_SIDEBAR_ITEMS,
    [isPrincipalAccess],
  );

  const metrics = useMemo(
    () => computeDashboardMetrics(admissions, payments, notices, routines),
    [admissions, payments, notices, routines],
  );

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return admissions.filter((adm) => {
      if (studentClassFilter !== 'সকল' && adm.classLevel !== studentClassFilter) return false;
      if (!q) return true;
      return (
        adm.studentName.toLowerCase().includes(q) ||
        adm.rollNumber.toLowerCase().includes(q) ||
        adm.guardianPhone.includes(q)
      );
    });
  }, [admissions, studentSearch, studentClassFilter]);

  const filteredPayments = useMemo(() => {
    if (paymentStatusFilter === 'সকল') return payments;
    return payments.filter((p) => p.status === paymentStatusFilter);
  }, [payments, paymentStatusFilter]);

  const sortedRoutines = useMemo(() => filterAndSortRoutines(routines, {}), [routines]);
  const sortedNotices = useMemo(() => filterAndSortNotices(notices, {}), [notices]);

  const routineAllowedGroups = getAllowedGroupsForClass(routineForm.classLevel);

  const handleRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRoutineInput(routineForm);
    setRoutineErrors(validation.errors);
    if (!validation.valid) return;

    setSavingRoutine(true);
    try {
      await publishRoutine(routineForm);
      setRoutineForm((prev) => ({
        ...prev,
        timeSlot: '',
        subject: '',
        teacherName: '',
        room: '',
      }));
    } finally {
      setSavingRoutine(false);
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNoticeInput(noticeForm);
    setNoticeErrors(validation.errors);
    if (!validation.valid) return;

    setSavingNotice(true);
    try {
      await publishNotice(noticeForm);
      setNoticeForm({
        title: '',
        body: '',
        category: 'সাধারণ',
        targetClass: 'সকল শ্রেণি',
        pinned: false,
      });
    } finally {
      setSavingNotice(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStaffInput(staffForm);
    setStaffErrors(validation.errors);
    if (!validation.valid) return;

    setSavingStaff(true);
    try {
      await addStaffMember(staffForm);
      setStaffForm({ uid: '', name: '', role: 'teacher', subject: '' });
    } finally {
      setSavingStaff(false);
    }
  };

  const handleCopyUid = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  const maxClassCount = Math.max(1, ...metrics.classBreakdown.map((c) => c.count));

  // Gate 1: Auth loading state
  if (!authReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-white border border-[#E7E2DA] rounded-2xl p-10 space-y-3">
          <p className="text-base font-semibold text-[#1C1917]">অ্যাকাউন্ট যাচাই করা হচ্ছে...</p>
          <p className="text-sm text-[#57534E]">অনুগ্রহ করে একটু অপেক্ষা করুন।</p>
        </div>
      </div>
    );
  }

  // Gate 2: Logged-out lock screen (zero student data or controls exposed)
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <section className="bg-white border border-[#E7E2DA] rounded-2xl p-8 sm:p-10 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <span className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#7A0D14]" />
            </span>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#B8862B]">সংরক্ষিত প্রশাসনিক এলাকা</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                শিক্ষক ও প্রধান শিক্ষক লগইন
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
            শিক্ষার্থীদের ব্যক্তিগত তথ্য দেখা, অনলাইন ভর্তি অনুমোদন, পেমেন্ট যাচাই এবং নতুন ক্লাস
            রুটিন বা নোটিশ প্রকাশের জন্য অনুমোদিত প্রধান শিক্ষক অথবা শিক্ষক অ্যাকাউন্ট দিয়ে লগইন
            করতে হবে।
          </p>

          <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-4 text-left text-xs text-[#57534E] space-y-1.5">
            <p className="font-semibold text-[#1C1917]">লগইন করলে যে সুবিধাগুলো আনলক হবে:</p>
            <p>• Student List (শ্রেণিভিত্তিক ছবিসহ পূর্ণাঙ্গ তথ্য), ভর্তি অনুমোদন ও পেমেন্ট লেজার</p>
            <p>• শ্রেণিভিত্তিক পরীক্ষার রেজাল্ট, ক্লাস রুটিন ও নোটিশ প্রকাশ</p>
            <p>• ওয়েবসাইটের লোগো, ব্যানার, লেখা পরিবর্তন, নতুন সেকশন যুক্ত ও হাইড করার সুবিধা</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Google দিয়ে লগইন করুন</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admission')}
              className="px-5 py-3 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
            >
              শিক্ষার্থী পোর্টালে যান
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Gate 3: Signed in as Student / Unauthorized Google Account
  if (!hasStaffAccess) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <section className="bg-white border border-[#E7E2DA] rounded-2xl p-8 sm:p-10 text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <span className="w-16 h-16 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-[#B91C1C]" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#B91C1C]">প্রবেশাধিকার সংরক্ষিত</p>
              <h1 className="text-2xl font-bold text-[#1C1917]">
                আপনার অ্যাকাউন্টে শিক্ষক অনুমোদন নেই
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#57534E] leading-relaxed">
            আপনি <span className="font-semibold text-[#1C1917]">{user.email}</span> (শিক্ষার্থী
            অ্যাকাউন্ট) হিসেবে লগইন আছেন। ড্যাশবোর্ড ব্যবহারের জন্য প্রধান শিক্ষকের কাছ থেকে
            শিক্ষক অনুমোদন নিতে হবে।
          </p>

          <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-[#1C1917]">
              আপনি যদি শিক্ষক হন, আপনার নিচের ইউজার আইডি (UID) প্রধান শিক্ষককে দিন:
            </p>
            <div className="flex items-center justify-between gap-2 bg-white border border-[#D6CFC5] rounded-lg px-3 py-2">
              <code className="text-xs font-mono-tabular text-[#1C1917] truncate">{user.uid}</code>
              <button
                type="button"
                onClick={() => void handleCopyUid(user.uid)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A0D14] hover:underline shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUid ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveView('admission')}
              className="px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer"
            >
              অনলাইন ভর্তি ও শিক্ষার্থী পোর্টাল
            </button>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>অন্য অ্যাকাউন্টে লগইন / লগআউট</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Workspace Header */}
      <div className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#B8862B]">
            {isPrincipalAccess
              ? 'প্রধান শিক্ষক প্রশাসনিক প্যানেল (পূর্ণ নিয়ন্ত্রণ)'
              : 'শিক্ষক ব্যবস্থাপনা প্যানেল'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
            একাডেমিক ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-[#57534E]">
            {user.displayName || user.email} · {userRole === 'principal' ? 'প্রধান শিক্ষক' : 'শিক্ষক'} · Firebase ডাটাবেজ সংযুক্ত
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-lg border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white border border-[#E7E2DA] rounded-2xl p-3">
          <nav aria-label="ড্যাশবোর্ড মেনু" className="flex lg:flex-col gap-1 overflow-x-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                  }}
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

        {/* Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4-Column KPI Grid */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">মোট নিবন্ধিত শিক্ষার্থী</p>
                  <p className="text-2xl font-bold text-[#1C1917] tabular-nums mt-1">
                    {toBengaliDigits(metrics.totalStudents)}
                  </p>
                  <p className="text-xs text-[#15803D] mt-1">
                    অনুমোদিত: {toBengaliDigits(metrics.approvedStudents)} · অপেক্ষমান:{' '}
                    {toBengaliDigits(metrics.pendingStudents)}
                  </p>
                </div>

                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">যাচাইকৃত মোট আদায়</p>
                  <p className="text-2xl font-bold text-[#7A0D14] tabular-nums mt-1">
                    {formatBdt(metrics.verifiedRevenue)}
                  </p>
                  <p className="text-xs text-[#B45309] mt-1 tabular-nums">
                    অপেক্ষমান: {formatBdt(metrics.pendingRevenue)}
                  </p>
                </div>

                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">চলমান ক্লাস রুটিন</p>
                  <p className="text-2xl font-bold text-[#1C1917] tabular-nums mt-1">
                    {toBengaliDigits(metrics.totalRoutines)}
                  </p>
                  <p className="text-xs text-[#57534E] mt-1">৬ষ্ঠ – একাদশ শ্রেণি</p>
                </div>

                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#78716C]">প্রকাশিত নোটিশ</p>
                  <p className="text-2xl font-bold text-[#1C1917] tabular-nums mt-1">
                    {toBengaliDigits(metrics.totalNotices)}
                  </p>
                  <p className="text-xs text-[#57534E] mt-1">লাইভ নোটিশ বোর্ড</p>
                </div>
              </div>

              {/* Class-wise Enrollment Distribution */}
              <section className="bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1C1917]">
                    শ্রেণিভিত্তিক শিক্ষার্থী বণ্টন
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('students')}
                    className="text-sm font-semibold text-[#7A0D14] hover:underline cursor-pointer"
                  >
                    পূর্ণ তালিকা দেখুন
                  </button>
                </div>

                <div className="space-y-3">
                  {metrics.classBreakdown.map((row) => {
                    const widthPct = Math.round((row.count / maxClassCount) * 100);
                    return (
                      <div key={row.classLevel} className="grid grid-cols-12 items-center gap-3 text-sm">
                        <span className="col-span-3 sm:col-span-2 font-semibold text-[#1C1917]">
                          {row.classLevel} শ্রেণি
                        </span>
                        <div className="col-span-7 sm:col-span-8 h-3 bg-[#F4F0E8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#7A0D14] rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(row.count > 0 ? 10 : 0, widthPct)}%` }}
                          />
                        </div>
                        <span className="col-span-2 text-right font-mono-tabular text-[#44403C]">
                          {toBengaliDigits(row.count)} জন
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Quick Principal Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('studentList')}
                  className="bg-white border border-[#E7E2DA] rounded-xl p-5 text-left hover:border-[#7A0D14] transition-colors cursor-pointer"
                >
                  <p className="text-sm font-bold text-[#7A0D14]">Student List দেখুন</p>
                  <p className="text-xs text-[#57534E] mt-1">
                    শ্রেণিভিত্তিক সকল শিক্ষার্থীর ছবি, পিতা-মাতা, জন্ম তারিখ ও ঠিকানা দেখুন।
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className="bg-white border border-[#E7E2DA] rounded-xl p-5 text-left hover:border-[#7A0D14] transition-colors cursor-pointer"
                >
                  <p className="text-sm font-bold text-[#7A0D14]">শ্রেণিভিত্তিক রেজাল্ট প্রকাশ</p>
                  <p className="text-xs text-[#57534E] mt-1">
                    শ্রেণি নির্বাচন করে ছবিসহ সকল শিক্ষার্থীর পরীক্ষার নম্বর ও গ্রেড প্রকাশ করুন।
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cms')}
                  className="bg-white border border-[#E7E2DA] rounded-xl p-5 text-left hover:border-[#7A0D14] transition-colors cursor-pointer"
                >
                  <p className="text-sm font-bold text-[#7A0D14]">ওয়েবসাইট কনটেন্ট (CMS)</p>
                  <p className="text-xs text-[#57534E] mt-1">
                    লোগো, ব্যানার, লেখা পরিবর্তন করুন এবং নতুন সেকশন যুক্ত বা হাইড করুন।
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'studentList' && <AdminStudentListTab />}

          {activeTab === 'results' && <AdminResultsTab />}

          {activeTab === 'cms' && <AdminCmsTab />}

          {activeTab === 'students' && (
            <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#E7E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917]">শিক্ষার্থী ও অনলাইন ভর্তি তালিকা</h2>
                  <p className="text-xs text-[#78716C]">
                    মোট {toBengaliDigits(filteredStudents.length)} জন শিক্ষার্থী
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    aria-label="শ্রেণি অনুযায়ী শিক্ষার্থী ফিল্টার"
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value as ClassLevel | 'সকল')}
                    className="bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg px-3 py-2 text-sm text-[#1C1917]"
                  >
                    <option value="সকল">সকল শ্রেণি</option>
                    {CLASS_LEVELS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} শ্রেণি
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      aria-label="শিক্ষার্থী খুঁজুন"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="নাম, রোল বা মোবাইল..."
                      className="pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] w-full sm:w-56"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                      <th className="py-3 px-4">রোল ও শিক্ষার্থী</th>
                      <th className="py-3 px-4">শ্রেণি ও শিফট</th>
                      <th className="py-3 px-4">অভিভাবক</th>
                      <th className="py-3 px-4">অবস্থা</th>
                      <th className="py-3 px-4 text-right">ব্যবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE3]">
                    {filteredStudents.map((adm, idx) => (
                      <tr key={adm.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={adm.studentPhoto || createStudentAvatarSvg(adm.studentName, idx)}
                              alt={adm.studentName}
                              className="w-9 h-9 rounded-lg object-cover border border-[#E7E2DA] shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-[#1C1917]">{adm.studentName}</p>
                              <p className="text-xs font-mono-tabular text-[#78716C]">
                                {adm.rollNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-medium text-[#1C1917]">
                            {adm.classLevel} · {adm.group}
                          </p>
                          <p className="text-xs text-[#78716C]">{adm.batchShift}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-[#1C1917]">{adm.guardianName}</p>
                          <p className="text-xs font-mono-tabular text-[#78716C]">
                            {adm.guardianPhone}
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              adm.status === 'approved'
                                ? 'text-[#15803D]'
                                : adm.status === 'rejected'
                                  ? 'text-[#B91C1C]'
                                  : 'text-[#B45309]'
                            }`}
                          >
                            {adm.status === 'approved'
                              ? 'অনুমোদিত'
                              : adm.status === 'rejected'
                                ? 'বাতিল'
                                : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {adm.status !== 'approved' && (
                              <button
                                type="button"
                                aria-label={`${adm.studentName} ভর্তি অনুমোদন করুন`}
                                onClick={() => void updateAdmissionStatus(adm.id, 'approved', 'verified')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#15803D] text-white rounded-md hover:bg-[#166534] transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>অনুমোদন</span>
                              </button>
                            )}
                            {adm.status !== 'rejected' && (
                              <button
                                type="button"
                                aria-label={`${adm.studentName} ভর্তি বাতিল করুন`}
                                onClick={() => void updateAdmissionStatus(adm.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#B91C1C] bg-[#FAF8F5] border border-[#E7E2DA] rounded-md hover:border-[#B91C1C] transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>বাতিল</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'payments' && (
            <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#E7E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1917]">অনলাইন পেমেন্ট লেজার</h2>
                  <p className="text-xs text-[#78716C] tabular-nums">
                    যাচাইকৃত আদায়: {formatBdt(metrics.verifiedRevenue)} · অপেক্ষমান:{' '}
                    {formatBdt(metrics.pendingRevenue)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5" role="group" aria-label="পেমেন্ট স্ট্যাটাস ফিল্টার">
                  {(
                    [
                      { id: 'সকল', label: 'সকল' },
                      { id: 'pending', label: 'অপেক্ষমান' },
                      { id: 'verified', label: 'যাচাইকৃত' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentStatusFilter(opt.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        paymentStatusFilter === opt.id
                          ? 'bg-[#7A0D14] text-white'
                          : 'bg-[#FAF8F5] text-[#44403C] hover:bg-[#EFEAE2]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                      <th className="py-3 px-4">শিক্ষার্থী ও রোল</th>
                      <th className="py-3 px-4">মাধ্যম ও TrxID</th>
                      <th className="py-3 px-4 text-right">পরিমাণ</th>
                      <th className="py-3 px-4">অবস্থা</th>
                      <th className="py-3 px-4 text-right">ব্যবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE3]">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#1C1917]">{pay.studentName}</p>
                          <p className="text-xs font-mono-tabular text-[#78716C]">
                            {pay.rollNumber} · {pay.classLevel} শ্রেণি
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-semibold text-[#1C1917]">{pay.method}</p>
                          <p className="text-xs font-mono-tabular text-[#78716C]">
                            {pay.transactionId} ({pay.senderNumber})
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#7A0D14] tabular-nums whitespace-nowrap">
                          {formatBdt(pay.amount)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
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
                                ? 'রিফান্ড'
                                : 'অপেক্ষমান'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {pay.status === 'pending' ? (
                            <button
                              type="button"
                              aria-label={`${pay.transactionId} পেমেন্ট যাচাই করুন`}
                              onClick={() =>
                                void updatePaymentStatus(pay.id, pay.admissionId, 'verified')
                              }
                              className="px-3 py-1.5 text-xs font-semibold bg-[#15803D] text-white rounded-md hover:bg-[#166534] transition-colors cursor-pointer"
                            >
                              যাচাই করুন
                            </button>
                          ) : (
                            <span className="text-xs text-[#78716C]">সম্পন্ন</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'routines' && (
            <div className="space-y-6">
              {/* Principal Routine Publisher Form */}
              <form
                onSubmit={handleRoutineSubmit}
                noValidate
                className="bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-5"
              >
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <h2 className="text-lg font-bold text-[#1C1917]">
                    নতুন ক্লাস রুটিন পোস্ট করুন (প্রধান শিক্ষক)
                  </h2>
                  <p className="text-xs text-[#78716C]">
                    প্রকাশিত রুটিন সাথে সাথে শিক্ষার্থীদের "ক্লাস ও রুটিন" পাতায় দেখা যাবে।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="rt-class" className="block text-xs font-semibold text-[#1C1917]">
                      শ্রেণি
                    </label>
                    <select
                      id="rt-class"
                      value={routineForm.classLevel}
                      onChange={(e) => {
                        const cls = e.target.value as ClassLevel;
                        const groups = getAllowedGroupsForClass(cls);
                        setRoutineForm((prev) => ({
                          ...prev,
                          classLevel: cls,
                          group: groups.includes(prev.group) ? prev.group : groups[0],
                        }));
                      }}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    >
                      {CLASS_LEVELS.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls} শ্রেণি
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="rt-group" className="block text-xs font-semibold text-[#1C1917]">
                      বিভাগ
                    </label>
                    <select
                      id="rt-group"
                      value={routineForm.group}
                      onChange={(e) =>
                        setRoutineForm({ ...routineForm, group: e.target.value as AcademicGroup })
                      }
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    >
                      {routineAllowedGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="rt-day" className="block text-xs font-semibold text-[#1C1917]">
                      বার
                    </label>
                    <select
                      id="rt-day"
                      value={routineForm.day}
                      onChange={(e) =>
                        setRoutineForm({ ...routineForm, day: e.target.value as DayOfWeek })
                      }
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="rt-time" className="block text-xs font-semibold text-[#1C1917]">
                      সময়সীমা *
                    </label>
                    <input
                      id="rt-time"
                      type="text"
                      value={routineForm.timeSlot}
                      onChange={(e) => {
                        setRoutineForm({ ...routineForm, timeSlot: e.target.value });
                        setRoutineErrors((prev) => ({ ...prev, timeSlot: '' }));
                      }}
                      placeholder="বিকাল ৪:৩০ - ৫:৩০"
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {routineErrors.timeSlot && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {routineErrors.timeSlot}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="rt-subject" className="block text-xs font-semibold text-[#1C1917]">
                      বিষয় *
                    </label>
                    <input
                      id="rt-subject"
                      type="text"
                      value={routineForm.subject}
                      onChange={(e) => {
                        setRoutineForm({ ...routineForm, subject: e.target.value });
                        setRoutineErrors((prev) => ({ ...prev, subject: '' }));
                      }}
                      placeholder="জীববিজ্ঞান (কোষ বিভাজন)"
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {routineErrors.subject && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {routineErrors.subject}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="rt-teacher" className="block text-xs font-semibold text-[#1C1917]">
                      শিক্ষকের নাম *
                    </label>
                    <input
                      id="rt-teacher"
                      type="text"
                      value={routineForm.teacherName}
                      onChange={(e) => {
                        setRoutineForm({ ...routineForm, teacherName: e.target.value });
                        setRoutineErrors((prev) => ({ ...prev, teacherName: '' }));
                      }}
                      placeholder="ফারহানা আক্তার"
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {routineErrors.teacherName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {routineErrors.teacherName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label htmlFor="rt-room" className="block text-xs font-semibold text-[#1C1917]">
                      কক্ষ নম্বর *
                    </label>
                    <input
                      id="rt-room"
                      type="text"
                      value={routineForm.room}
                      onChange={(e) => {
                        setRoutineForm({ ...routineForm, room: e.target.value });
                        setRoutineErrors((prev) => ({ ...prev, room: '' }));
                      }}
                      placeholder="কক্ষ-২০৪"
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {routineErrors.room && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {routineErrors.room}
                      </p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={savingRoutine}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{savingRoutine ? 'সংরক্ষণ হচ্ছে...' : 'রুটিন প্রকাশ করুন'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Existing Routines Management List */}
              <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#E7E2DA]">
                  <h3 className="text-base font-bold text-[#1C1917]">
                    প্রকাশিত রুটিন তালিকা ({toBengaliDigits(sortedRoutines.length)})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                        <th className="py-3 px-4">শ্রেণি ও বার</th>
                        <th className="py-3 px-4">সময়</th>
                        <th className="py-3 px-4">বিষয় ও শিক্ষক</th>
                        <th className="py-3 px-4 text-right">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                      {sortedRoutines.map((rt) => (
                        <tr key={rt.id} className="hover:bg-[#FAF8F5]">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-semibold text-[#1C1917]">
                              {rt.classLevel} · {rt.group}
                            </p>
                            <p className="text-xs text-[#7A0D14]">{rt.day}</p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                            <p className="text-[#1C1917]">{rt.timeSlot}</p>
                            <p className="text-xs font-mono-tabular text-[#78716C]">{rt.room}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#1C1917]">{rt.subject}</p>
                            <p className="text-xs text-[#78716C]">{rt.teacherName}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              aria-label={`${rt.subject} রুটিন মুছুন`}
                              onClick={() => void removeRoutine(rt.id)}
                              className="p-2 text-[#78716C] hover:text-[#B91C1C] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-6">
              {/* Principal Notice Publisher Form */}
              <form
                onSubmit={handleNoticeSubmit}
                noValidate
                className="bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-5"
              >
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <h2 className="text-lg font-bold text-[#1C1917]">
                    নতুন নোটিশ প্রকাশ করুন (প্রধান শিক্ষক)
                  </h2>
                  <p className="text-xs text-[#78716C]">
                    প্রকাশিত নোটিশ তাৎক্ষণিকভাবে ওয়েবসাইটের নোটিশ বোর্ডে যুক্ত হবে।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="nt-title" className="block text-xs font-semibold text-[#1C1917]">
                      নোটিশের শিরোনাম *
                    </label>
                    <input
                      id="nt-title"
                      type="text"
                      value={noticeForm.title}
                      onChange={(e) => {
                        setNoticeForm({ ...noticeForm, title: e.target.value });
                        setNoticeErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      placeholder="যেমন: শীতকালীন অবকাশ ও বিশেষ মডেল টেস্টের সময়সূচি"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {noticeErrors.title && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {noticeErrors.title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="nt-cat" className="block text-xs font-semibold text-[#1C1917]">
                      নোটিশের ধরন
                    </label>
                    <select
                      id="nt-cat"
                      value={noticeForm.category}
                      onChange={(e) =>
                        setNoticeForm({ ...noticeForm, category: e.target.value as NoticeCategory })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    >
                      {NOTICE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="nt-target" className="block text-xs font-semibold text-[#1C1917]">
                      প্রযোজ্য শ্রেণি
                    </label>
                    <select
                      id="nt-target"
                      value={noticeForm.targetClass}
                      onChange={(e) =>
                        setNoticeForm({
                          ...noticeForm,
                          targetClass: e.target.value as NoticeTargetClass,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    >
                      <option value="সকল শ্রেণি">সকল শ্রেণি</option>
                      {CLASS_LEVELS.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls} শ্রেণি
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor="nt-body" className="block text-xs font-semibold text-[#1C1917]">
                      নোটিশের বিস্তারিত বিবরণ *
                    </label>
                    <textarea
                      id="nt-body"
                      rows={4}
                      value={noticeForm.body}
                      onChange={(e) => {
                        setNoticeForm({ ...noticeForm, body: e.target.value });
                        setNoticeErrors((prev) => ({ ...prev, body: '' }));
                      }}
                      placeholder="শিক্ষার্থী ও অভিভাবকদের উদ্দেশ্যে বিস্তারিত নির্দেশনা লিখুন..."
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {noticeErrors.body && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {noticeErrors.body}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <label className="inline-flex items-center gap-2 text-sm text-[#44403C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeForm.pinned}
                      onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
                      className="w-4 h-4 accent-[#7A0D14]"
                    />
                    <span>জরুরি নোটিশ হিসেবে শীর্ষে পিন করুন</span>
                  </label>

                  <button
                    type="submit"
                    disabled={savingNotice}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{savingNotice ? 'প্রকাশ হচ্ছে...' : 'নোটিশ প্রকাশ করুন'}</span>
                  </button>
                </div>
              </form>

              {/* Published Notices Management List */}
              <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#E7E2DA]">
                  <h3 className="text-base font-bold text-[#1C1917]">
                    প্রকাশিত নোটিশসমূহ ({toBengaliDigits(sortedNotices.length)})
                  </h3>
                </div>
                {sortedNotices.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-[#57534E]">
                    এখনো কোন নোটিশ পাবলিশ হয়নি
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0EBE3]">
                    {sortedNotices.map((nt) => (
                      <div
                        key={nt.id}
                        className="p-5 flex items-start justify-between gap-4 hover:bg-[#FAF8F5]"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#78716C]">
                            <span className="font-semibold text-[#7A0D14]">{nt.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{nt.targetClass}</span>
                            <span aria-hidden="true">·</span>
                            <span>{nt.publishedDate}</span>
                            {nt.pinned && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-[#B8862B]">পিন করা</span>
                              </>
                            )}
                          </div>
                          <p className="font-semibold text-[#1C1917]">{nt.title}</p>
                          <p className="text-xs text-[#57534E] line-clamp-2">{nt.body}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`${nt.title} নোটিশ মুছুন`}
                          onClick={() => void removeNotice(nt.id)}
                          className="p-2 text-[#78716C] hover:text-[#B91C1C] transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'staff' && isPrincipalAccess && (
            <div className="space-y-6">
              {/* Add Authorized Teacher / Principal Form */}
              <form
                onSubmit={handleStaffSubmit}
                noValidate
                className="bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-5"
              >
                <div className="pb-3 border-b border-[#F0EBE3] space-y-1">
                  <h2 className="text-lg font-bold text-[#1C1917]">
                    নতুন শিক্ষক অনুমোদন দিন (শুধুমাত্র প্রধান শিক্ষক)
                  </h2>
                  <p className="text-xs text-[#78716C] leading-relaxed">
                    অন্য শিক্ষককে ড্যাশবোর্ডে প্রবেশাধিকার দিতে প্রথমে তাঁকে তাঁর Google অ্যাকাউন্ট
                    দিয়ে ড্যাশবোর্ডে একবার লগইন করতে বলুন। সেখানে দেখানো ইউজার আইডি (UID) এখানে বসিয়ে
                    সংরক্ষণ করলেই তিনি শিক্ষক হিসেবে ড্যাশবোর্ড ব্যবহার করতে পারবেন।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="st-uid" className="block text-xs font-semibold text-[#1C1917]">
                      শিক্ষকের ইউজার আইডি (Firebase UID) *
                    </label>
                    <input
                      id="st-uid"
                      type="text"
                      value={staffForm.uid}
                      onChange={(e) => {
                        setStaffForm({ ...staffForm, uid: e.target.value });
                        setStaffErrors((prev) => ({ ...prev, uid: '' }));
                      }}
                      placeholder="যেমন: k8x9Lm2pQ4..."
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular"
                    />
                    {staffErrors.uid && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {staffErrors.uid}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="st-name" className="block text-xs font-semibold text-[#1C1917]">
                      শিক্ষকের পূর্ণ নাম *
                    </label>
                    <input
                      id="st-name"
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => {
                        setStaffForm({ ...staffForm, name: e.target.value });
                        setStaffErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="যেমন: মো. তানভীর আহমেদ"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {staffErrors.name && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {staffErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="st-role" className="block text-xs font-semibold text-[#1C1917]">
                      দায়িত্ব (রোল)
                    </label>
                    <select
                      id="st-role"
                      value={staffForm.role}
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          role: e.target.value as 'teacher' | 'principal',
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    >
                      <option value="teacher">শিক্ষক (ভর্তি, পেমেন্ট, রুটিন ও নোটিশ)</option>
                      <option value="principal">প্রধান শিক্ষক (পূর্ণ প্রশাসনিক নিয়ন্ত্রণ)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="st-subject" className="block text-xs font-semibold text-[#1C1917]">
                      বিষয় / বিভাগ *
                    </label>
                    <input
                      id="st-subject"
                      type="text"
                      value={staffForm.subject}
                      onChange={(e) => {
                        setStaffForm({ ...staffForm, subject: e.target.value });
                        setStaffErrors((prev) => ({ ...prev, subject: '' }));
                      }}
                      placeholder="যেমন: পদার্থবিজ্ঞান ও গণিত"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
                    />
                    {staffErrors.subject && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {staffErrors.subject}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{savingStaff ? 'সংরক্ষণ হচ্ছে...' : 'শিক্ষক যুক্ত করুন'}</span>
                  </button>
                </div>
              </form>

              {/* Authorized Staff List */}
              <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#E7E2DA]">
                  <h3 className="text-base font-bold text-[#1C1917]">
                    অনুমোদিত শিক্ষক ও প্রধান শিক্ষক তালিকা ({toBengaliDigits(staffMembers.length + 1)})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                        <th className="py-3 px-4">নাম ও আইডি</th>
                        <th className="py-3 px-4">বিষয়</th>
                        <th className="py-3 px-4">দায়িত্ব</th>
                        <th className="py-3 px-4 text-right">ব্যবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE3]">
                      <tr className="bg-[#FAF8F5]/60">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#1C1917]">প্রধান শিক্ষক (মূল অ্যাডমিন)</p>
                          <p className="text-xs font-mono-tabular text-[#78716C]">
                            dark24dark24dark@gmail.com
                          </p>
                        </td>
                        <td className="py-3 px-4 text-[#44403C]">সকল বিভাগ ও প্রশাসন</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-[#7A0D14]">প্রধান শিক্ষক</span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-[#78716C] whitespace-nowrap">
                          সুরক্ষিত
                        </td>
                      </tr>
                      {staffMembers.map((member) => (
                        <tr key={member.uid} className="hover:bg-[#FAF8F5]">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#1C1917]">{member.name}</p>
                            <p className="text-xs font-mono-tabular text-[#78716C]">{member.uid}</p>
                          </td>
                          <td className="py-3 px-4 text-[#44403C]">{member.subject}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-xs font-semibold ${
                                member.role === 'principal' ? 'text-[#7A0D14]' : 'text-[#15803D]'
                              }`}
                            >
                              {member.role === 'principal' ? 'প্রধান শিক্ষক' : 'শিক্ষক'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              aria-label={`${member.name} অনুমোদন বাতিল করুন`}
                              onClick={() => void removeStaffMember(member.uid)}
                              className="p-2 text-[#78716C] hover:text-[#B91C1C] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
