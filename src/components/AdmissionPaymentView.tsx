import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Printer,
  Search,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import type {
  AcademicGroup,
  AdmissionFormInput,
  AdmissionRecord,
  BatchShift,
  ClassLevel,
  PaymentFormInput,
  PaymentMethod,
  PaymentRecord,
} from '../types';
import {
  BATCH_SHIFTS,
  calculateFeeBreakdown,
  CLASS_LEVELS,
  filterAndSortRoutines,
  findStudentAdmission,
  formatBdt,
  getAllowedGroupsForClass,
  toBengaliDigits,
  validateAdmissionInput,
  validatePaymentInput,
} from '../utils/academicLogic';

type AdmissionTab = 'apply' | 'portal';
type WizardStep = 1 | 2 | 3;

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  subtitle: string;
  accountHint: string;
}> = [
  {
    id: 'bKash',
    label: 'বিকাশ (bKash)',
    subtitle: 'মার্চেন্ট পেমেন্ট: 01700-112233',
    accountHint: 'বিকাশ নম্বর (01XXXXXXXXX)',
  },
  {
    id: 'Nagad',
    label: 'নগদ (Nagad)',
    subtitle: 'মার্চেন্ট পেমেন্ট: 01800-112233',
    accountHint: 'নগদ নম্বর (01XXXXXXXXX)',
  },
  {
    id: 'Rocket',
    label: 'রকেট (Rocket)',
    subtitle: 'মার্চেন্ট পেমেন্ট: 01900-1122339',
    accountHint: 'রকেট নম্বর (01XXXXXXXXX)',
  },
  {
    id: 'Card',
    label: 'ডেবিট / ক্রেডিট কার্ড',
    subtitle: 'Visa / Mastercard / NexusPay',
    accountHint: 'কার্ডের শেষ ৪ সংখ্যা (যেমন: 4532)',
  },
];

export function AdmissionPaymentView() {
  const {
    preselectedClass,
    admissions,
    payments,
    routines,
    user,
    signInWithGoogle,
    submitAdmissionWithPayment,
    navigateToClassesForLevel,
  } = useApp();

  const [tab, setTab] = useState<AdmissionTab>('apply');
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AdmissionFormInput>({
    studentName: '',
    guardianName: '',
    guardianPhone: '',
    schoolName: '',
    classLevel: preselectedClass,
    group: getAllowedGroupsForClass(preselectedClass)[0],
    batchShift: BATCH_SHIFTS[1],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [paymentData, setPaymentData] = useState<PaymentFormInput>({
    method: 'bKash',
    senderNumber: '',
    transactionId: '',
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const [completedReceipt, setCompletedReceipt] = useState<{
    admission: AdmissionRecord;
    payment: PaymentRecord;
  } | null>(null);

  // Student portal lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<AdmissionRecord | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  useEffect(() => {
    const allowed = getAllowedGroupsForClass(preselectedClass);
    setFormData((prev) => ({
      ...prev,
      classLevel: preselectedClass,
      group: allowed.includes(prev.group) ? prev.group : allowed[0],
    }));
  }, [preselectedClass]);

  const allowedGroups = getAllowedGroupsForClass(formData.classLevel);
  const feeSummary = calculateFeeBreakdown(formData.classLevel, formData.group);
  const activePaymentMethod =
    PAYMENT_METHODS.find((m) => m.id === paymentData.method) ?? PAYMENT_METHODS[0];

  const handleClassChange = (nextClass: ClassLevel) => {
    const nextGroups = getAllowedGroupsForClass(nextClass);
    setFormData((prev) => ({
      ...prev,
      classLevel: nextClass,
      group: nextGroups.includes(prev.group) ? prev.group : nextGroups[0],
    }));
    setFormErrors((prev) => ({ ...prev, group: '' }));
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateAdmissionInput(formData);
    setFormErrors(result.errors);
    if (!result.valid) return;

    setPaymentData((prev) => ({
      ...prev,
      senderNumber: prev.senderNumber || formData.guardianPhone.trim(),
    }));
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePaymentInput(paymentData);
    setPaymentErrors(validation.errors);
    if (!validation.valid) return;

    setIsSubmitting(true);
    try {
      const receipt = await submitAdmissionWithPayment(formData, paymentData);
      setCompletedReceipt(receipt);
      setLookupResult(receipt.admission);
      setLookupQuery(receipt.admission.rollNumber);
      setLookupSearched(true);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetWizard = () => {
    setFormData({
      studentName: '',
      guardianName: '',
      guardianPhone: '',
      schoolName: '',
      classLevel: preselectedClass,
      group: getAllowedGroupsForClass(preselectedClass)[0],
      batchShift: BATCH_SHIFTS[1],
    });
    setPaymentData({ method: 'bKash', senderNumber: '', transactionId: '' });
    setFormErrors({});
    setPaymentErrors({});
    setCompletedReceipt(null);
    setStep(1);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findStudentAdmission(admissions, lookupQuery);
    setLookupResult(found ?? null);
    setLookupSearched(true);
  };

  const lookupPayments = lookupResult
    ? payments.filter((p) => p.admissionId === lookupResult.id || p.rollNumber === lookupResult.rollNumber)
    : [];

  const lookupRoutines = lookupResult
    ? filterAndSortRoutines(routines, {
        classLevel: lookupResult.classLevel,
        group: lookupResult.group,
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Page Header & Mode Switch */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 no-print">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-semibold text-[#B8862B]">ভর্তি ও শিক্ষার্থী সেবা</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917]">
            অনলাইন ভর্তি, পেমেন্ট গেটওয়ে ও শিক্ষার্থী পোর্টাল
          </h1>
          <p className="text-[15px] text-[#57534E]">
            তিনটি সহজ ধাপে ভর্তি আবেদন সম্পন্ন করে তাৎক্ষণিক ডিজিটাল রোল নম্বর ও মানি রিসিট
            সংগ্রহ করুন।
          </p>
        </div>

        <div
          role="tablist"
          aria-label="ভর্তি এবং শিক্ষার্থী পোর্টাল"
          className="inline-flex items-center p-1 bg-[#F4F0E8] border border-[#E7E2DA] rounded-xl w-fit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'apply'}
            onClick={() => setTab('apply')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'apply'
                ? 'bg-[#7A0D14] text-white shadow-sm'
                : 'text-[#44403C] hover:text-[#1C1917]'
            }`}
          >
            নতুন ভর্তি আবেদন
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'portal'}
            onClick={() => setTab('portal')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'portal'
                ? 'bg-[#7A0D14] text-white shadow-sm'
                : 'text-[#44403C] hover:text-[#1C1917]'
            }`}
          >
            শিক্ষার্থী পোর্টাল ও ক্লাস তথ্য
          </button>
        </div>
      </div>

      {/* Cloud Sync Optional Notice */}
      {!user && tab === 'apply' && (
        <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <p className="text-sm text-[#44403C]">
            স্থায়ী ক্লাউড ডাটাবেজে আপনার ভর্তি ও পেমেন্ট রেকর্ড সংরক্ষণ করতে চাইলে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="px-4 py-2 text-sm font-semibold text-[#7A0D14] bg-white border border-[#D6CFC5] rounded-lg hover:border-[#7A0D14] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Google দিয়ে লগইন করুন
          </button>
        </div>
      )}

      {tab === 'apply' ? (
        <div className="space-y-8">
          {/* 3-Step Progress Indicator */}
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print" aria-label="ভর্তির ধাপসমূহ">
            {[
              { num: 1, title: '০১. শিক্ষার্থীর তথ্য', desc: 'শ্রেণি, বিভাগ ও ব্যাচ নির্বাচন' },
              { num: 2, title: '০২. অনলাইন পেমেন্ট', desc: 'বিকাশ, নগদ, রকেট বা কার্ড' },
              { num: 3, title: '০৩. ডিজিটাল রশিদ', desc: 'রোল নম্বর ও ভর্তি নিশ্চিতকরণ' },
            ].map((item) => {
              const isCurrent = step === item.num;
              const isDone = step > item.num;
              return (
                <li
                  key={item.num}
                  className={`rounded-xl border px-5 py-4 transition-colors ${
                    isCurrent
                      ? 'bg-white border-[#7A0D14]'
                      : isDone
                        ? 'bg-[#F4F0E8] border-[#C9932C]'
                        : 'bg-white/70 border-[#E7E2DA]'
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-[#7A0D14]'
                        : isDone
                          ? 'text-[#15803D]'
                          : 'text-[#78716C]'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-[#57534E] mt-0.5">{item.desc}</p>
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Admission Form */}
              <form
                onSubmit={handleProceedToPayment}
                noValidate
                className="lg:col-span-8 bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 space-y-6"
              >
                <h2 className="text-xl font-bold text-[#1C1917] pb-3 border-b border-[#F0EBE3]">
                  শিক্ষার্থী ও অভিভাবকের তথ্য
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="studentName" className="block text-sm font-semibold text-[#1C1917]">
                      শিক্ষার্থীর পূর্ণ নাম *
                    </label>
                    <input
                      id="studentName"
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => {
                        setFormData({ ...formData, studentName: e.target.value });
                        setFormErrors((prev) => ({ ...prev, studentName: '' }));
                      }}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {formErrors.studentName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {formErrors.studentName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="guardianName" className="block text-sm font-semibold text-[#1C1917]">
                      অভিভাবকের নাম *
                    </label>
                    <input
                      id="guardianName"
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => {
                        setFormData({ ...formData, guardianName: e.target.value });
                        setFormErrors((prev) => ({ ...prev, guardianName: '' }));
                      }}
                      placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {formErrors.guardianName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {formErrors.guardianName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="guardianPhone" className="block text-sm font-semibold text-[#1C1917]">
                      অভিভাবকের মোবাইল নম্বর *
                    </label>
                    <input
                      id="guardianPhone"
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => {
                        setFormData({ ...formData, guardianPhone: e.target.value });
                        setFormErrors((prev) => ({ ...prev, guardianPhone: '' }));
                      }}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {formErrors.guardianPhone && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {formErrors.guardianPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="schoolName" className="block text-sm font-semibold text-[#1C1917]">
                      বর্তমান স্কুল / কলেজের নাম *
                    </label>
                    <input
                      id="schoolName"
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => {
                        setFormData({ ...formData, schoolName: e.target.value });
                        setFormErrors((prev) => ({ ...prev, schoolName: '' }));
                      }}
                      placeholder="যেমন: আইডিয়াল স্কুল অ্যান্ড কলেজ"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {formErrors.schoolName && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {formErrors.schoolName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="classLevel" className="block text-sm font-semibold text-[#1C1917]">
                      ভর্তিচ্ছু শ্রেণি *
                    </label>
                    <select
                      id="classLevel"
                      value={formData.classLevel}
                      onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    >
                      {CLASS_LEVELS.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls} শ্রেণি
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="academicGroup" className="block text-sm font-semibold text-[#1C1917]">
                      বিভাগ *
                    </label>
                    <select
                      id="academicGroup"
                      value={formData.group}
                      onChange={(e) =>
                        setFormData({ ...formData, group: e.target.value as AcademicGroup })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    >
                      {allowedGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {formErrors.group && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {formErrors.group}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-[#1C1917]">
                    পছন্দের ব্যাচ শিফট নির্বাচন করুন *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BATCH_SHIFTS.map((shift) => {
                      const active = formData.batchShift === shift;
                      return (
                        <button
                          key={shift}
                          type="button"
                          onClick={() => setFormData({ ...formData, batchShift: shift as BatchShift })}
                          className={`px-3.5 py-3 text-sm font-medium rounded-xl border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#7A0D14]/6 border-[#7A0D14] text-[#7A0D14] font-semibold'
                              : 'bg-[#FAF8F5] border-[#E7E2DA] text-[#44403C] hover:border-[#C9932C]'
                          }`}
                        >
                          {shift}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EBE3] flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer"
                  >
                    <span>পেমেন্ট ধাপে এগিয়ে যান</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Live Fee Summary Sidebar */}
              <aside className="lg:col-span-4 bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-[#F0EBE3]">
                  <span className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src="/assets/aistudio/image_563094c6.svg"
                      alt="USP লোগো"
                      className="w-11 h-11 object-contain scale-[1.55]"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#1C1917]">ভর্তি ফি হিসাব</h3>
                    <p className="text-xs text-[#78716C]">
                      {formData.classLevel} শ্রেণি · {formData.group}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-[#44403C]">
                    <span>এককালীন ভর্তি ও রেজিস্ট্রেশন ফি</span>
                    <span className="font-semibold text-[#1C1917] tabular-nums">
                      {formatBdt(feeSummary.admissionFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#44403C]">
                    <span>প্রথম মাসের টিউশন ফি</span>
                    <span className="font-semibold text-[#1C1917] tabular-nums">
                      {formatBdt(feeSummary.monthlyFee)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#E7E2DA] flex items-center justify-between">
                    <span className="font-bold text-[#1C1917]">সর্বমোট প্রদেয়</span>
                    <span className="text-2xl font-bold text-[#7A0D14] tabular-nums">
                      {formatBdt(feeSummary.totalPayableNow)}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-4 space-y-1.5 text-xs text-[#57534E]">
                  <p className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                    <span>নিরাপদ ডিজিটাল পেমেন্ট গেটওয়ে</span>
                  </p>
                  <p>
                    বিকাশ, নগদ, রকেট ও কার্ড পেমেন্ট সমর্থিত। পেমেন্ট সম্পন্ন হলেই ইউএসপি রোল
                    নম্বর ও প্রিন্টযোগ্য রশিদ পাবেন।
                  </p>
                </div>
              </aside>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <form
                onSubmit={handleCompletePayment}
                noValidate
                className="lg:col-span-8 bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#F0EBE3]">
                  <h2 className="text-xl font-bold text-[#1C1917]">পেমেন্ট গেটওয়ে নির্বাচন করুন</h2>
                  <span className="text-lg font-bold text-[#7A0D14] tabular-nums">
                    {formatBdt(feeSummary.totalPayableNow)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" role="radiogroup" aria-label="পেমেন্ট মাধ্যম">
                  {PAYMENT_METHODS.map((pm) => {
                    const active = paymentData.method === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setPaymentData((prev) => ({ ...prev, method: pm.id }));
                          setPaymentErrors({});
                        }}
                        className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#7A0D14]/6 border-[#7A0D14]'
                            : 'bg-[#FAF8F5] border-[#E7E2DA] hover:border-[#C9932C]'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-[#1C1917] text-sm">
                          {pm.id === 'Card' ? (
                            <CreditCard className="w-4 h-4 text-[#7A0D14]" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-[#7A0D14]" />
                          )}
                          <span>{pm.label}</span>
                        </div>
                        <p className="text-xs text-[#57534E] mt-1 font-mono-tabular">
                          {pm.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 text-sm text-[#44403C] space-y-1">
                  <p className="font-semibold text-[#1C1917]">
                    পেমেন্ট নির্দেশনা ({activePaymentMethod.label}):
                  </p>
                  <p>
                    {paymentData.method === 'Card'
                      ? `SSLCommerz নিরাপদ গেটওয়েতে ${formatBdt(feeSummary.totalPayableNow)} পরিশোধ করে কার্ডের শেষ ৪ সংখ্যা ও অনুমোদন কোড (TrxID) নিচে প্রদান করুন।`
                      : `আপনার ${activePaymentMethod.label} অ্যাপ থেকে "${activePaymentMethod.subtitle}" নম্বরে ${formatBdt(feeSummary.totalPayableNow)} পেমেন্ট করে প্রেরক নম্বর ও ট্রানজেকশন আইডি (TrxID) নিচে লিখুন।`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="senderNumber" className="block text-sm font-semibold text-[#1C1917]">
                      {activePaymentMethod.accountHint} *
                    </label>
                    <input
                      id="senderNumber"
                      type="text"
                      value={paymentData.senderNumber}
                      onChange={(e) => {
                        setPaymentData({ ...paymentData, senderNumber: e.target.value });
                        setPaymentErrors((prev) => ({ ...prev, senderNumber: '' }));
                      }}
                      placeholder={paymentData.method === 'Card' ? '4532' : '017XXXXXXXX'}
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {paymentErrors.senderNumber && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {paymentErrors.senderNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="transactionId" className="block text-sm font-semibold text-[#1C1917]">
                        ট্রানজেকশন আইডি (TrxID) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = paymentData.method.slice(0, 3).toUpperCase();
                          const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
                          setPaymentData((prev) => ({ ...prev, transactionId: `${prefix}${rand}26` }));
                          setPaymentErrors((prev) => ({ ...prev, transactionId: '' }));
                        }}
                        className="text-xs font-medium text-[#7A0D14] hover:underline cursor-pointer"
                      >
                        ডেমো TrxID বসান
                      </button>
                    </div>
                    <input
                      id="transactionId"
                      type="text"
                      value={paymentData.transactionId}
                      onChange={(e) => {
                        setPaymentData({ ...paymentData, transactionId: e.target.value });
                        setPaymentErrors((prev) => ({ ...prev, transactionId: '' }));
                      }}
                      placeholder="যেমন: BKS9A72K41"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular uppercase text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                    />
                    {paymentErrors.transactionId && (
                      <p role="alert" className="text-xs text-[#B91C1C]">
                        {paymentErrors.transactionId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0EBE3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>পূর্ববর্তী ধাপ</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <span>
                      {isSubmitting ? 'পেমেন্ট প্রক্রিয়াকরণ হচ্ছে...' : 'পেমেন্ট নিশ্চিত ও ভর্তি সম্পন্ন করুন'}
                    </span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <aside className="lg:col-span-4 bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-[#1C1917] pb-3 border-b border-[#F0EBE3]">
                  আবেদনকারীর সারসংক্ষেপ
                </h3>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">শিক্ষার্থী</dt>
                    <dd className="font-semibold text-[#1C1917] text-right">{formData.studentName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">শ্রেণি ও বিভাগ</dt>
                    <dd className="font-semibold text-[#1C1917] text-right">
                      {formData.classLevel} · {formData.group}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">ব্যাচ শিফট</dt>
                    <dd className="text-[#44403C] text-right">{formData.batchShift}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">মোবাইল</dt>
                    <dd className="font-mono-tabular text-[#1C1917]">{formData.guardianPhone}</dd>
                  </div>
                  <div className="pt-3 border-t border-[#E7E2DA] flex justify-between gap-2">
                    <dt className="font-bold text-[#1C1917]">প্রদেয় ফি</dt>
                    <dd className="font-bold text-[#7A0D14] tabular-nums">
                      {formatBdt(feeSummary.totalPayableNow)}
                    </dd>
                  </div>
                </dl>
              </aside>
            </motion.div>
          )}

          {step === 3 && completedReceipt && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl mx-auto bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-10 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E2DA]">
                <div className="flex items-center gap-3.5">
                  <span className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src="/assets/aistudio/image_563094c6.svg"
                      alt="আপগ্রেড স্টাডি প্রোগ্রাম লোগো"
                      className="w-16 h-16 object-contain scale-[1.55]"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#15803D] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>অনলাইন ভর্তি ও পেমেন্ট গৃহীত হয়েছে</span>
                    </p>
                    <h2 className="text-2xl font-bold text-[#1C1917] mt-0.5">
                      আপগ্রেড স্টাডি প্রোগ্রাম — ভর্তি রশিদ
                    </h2>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-[#78716C]">শিক্ষার্থী রোল নম্বর</p>
                  <p className="text-lg font-bold font-mono-tabular text-[#7A0D14]">
                    {completedReceipt.admission.rollNumber}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <dt className="text-xs text-[#78716C]">শিক্ষার্থীর নাম</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {completedReceipt.admission.studentName}
                  </dd>
                </div>
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <dt className="text-xs text-[#78716C]">অভিভাবকের নাম ও মোবাইল</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {completedReceipt.admission.guardianName} ·{' '}
                    <span className="font-mono-tabular">
                      {completedReceipt.admission.guardianPhone}
                    </span>
                  </dd>
                </div>
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <dt className="text-xs text-[#78716C]">শ্রেণি ও বিভাগ</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {completedReceipt.admission.classLevel} শ্রেণি ({completedReceipt.admission.group})
                  </dd>
                </div>
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <dt className="text-xs text-[#78716C]">ব্যাচ শিফট</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {completedReceipt.admission.batchShift}
                  </dd>
                </div>
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <dt className="text-xs text-[#78716C]">পেমেন্ট মাধ্যম ও TrxID</dt>
                  <dd className="font-semibold font-mono-tabular text-[#1C1917] mt-0.5">
                    {completedReceipt.payment.method} · {completedReceipt.payment.transactionId}
                  </dd>
                </div>
                <div className="pb-3 border-b border-[#F0EBE3]">
                  <dt className="text-xs text-[#78716C]">পরিশোধিত পরিমাণ</dt>
                  <dd className="font-bold text-[#7A0D14] tabular-nums mt-0.5">
                    {formatBdt(completedReceipt.payment.amount)}
                  </dd>
                </div>
              </dl>

              <div className="pt-2 flex flex-wrap items-center gap-3 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>রশিদ প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateToClassesForLevel(completedReceipt.admission.classLevel)}
                  className="px-5 py-2.5 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-lg border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
                >
                  ক্লাস রুটিন দেখুন
                </button>
                <button
                  type="button"
                  onClick={handleResetWizard}
                  className="px-5 py-2.5 text-sm font-semibold text-[#57534E] hover:text-[#7A0D14] transition-colors cursor-pointer"
                >
                  আরেকজন শিক্ষার্থী ভর্তি করুন
                </button>
              </div>
            </motion.section>
          )}
        </div>
      ) : (
        /* Student Portal & Enrolled Class Info Lookup */
        <div className="space-y-8">
          <form
            onSubmit={handleLookupSubmit}
            className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 space-y-4"
          >
            <h2 className="text-xl font-bold text-[#1C1917]">
              রোল নম্বর বা অভিভাবকের মোবাইল দিয়ে ক্লাসের তথ্য দেখুন
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="রোল নম্বর অথবা মোবাইল নম্বর"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="যেমন: USP-09-2026-0001 অথবা 01711223344"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                তথ্য খুঁজুন
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
              <span>নমুনা রোল:</span>
              {admissions.slice(0, 3).map((adm) => (
                <button
                  key={adm.id}
                  type="button"
                  onClick={() => {
                    setLookupQuery(adm.rollNumber);
                    setLookupResult(adm);
                    setLookupSearched(true);
                  }}
                  className="font-mono-tabular text-[#7A0D14] hover:underline cursor-pointer"
                >
                  {adm.rollNumber}
                </button>
              ))}
            </div>
          </form>

          {lookupSearched && !lookupResult && (
            <div className="bg-white border border-[#E7E2DA] rounded-xl p-8 text-center space-y-2">
              <p className="text-base font-semibold text-[#1C1917]">
                এই রোল বা মোবাইল নম্বরে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি
              </p>
              <p className="text-sm text-[#57534E]">
                সঠিক ইউএসপি রোল নম্বর (যেমন: USP-09-2026-0001) অথবা ভর্তি ফরমে দেওয়া মোবাইল নম্বর দিয়ে চেষ্টা করুন।
              </p>
            </div>
          )}

          {lookupResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-5 bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-5">
                <div className="pb-4 border-b border-[#F0EBE3]">
                  <p className="text-xs font-mono-tabular font-semibold text-[#7A0D14]">
                    {lookupResult.rollNumber}
                  </p>
                  <h3 className="text-xl font-bold text-[#1C1917] mt-0.5">
                    {lookupResult.studentName}
                  </h3>
                  <p className="text-sm text-[#57534E]">{lookupResult.schoolName}</p>
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">শ্রেণি ও বিভাগ</dt>
                    <dd className="font-semibold text-[#1C1917]">
                      {lookupResult.classLevel} শ্রেণি · {lookupResult.group}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">ব্যাচ সময়</dt>
                    <dd className="font-medium text-[#1C1917]">{lookupResult.batchShift}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">ভর্তি অবস্থা</dt>
                    <dd
                      className={`font-semibold ${
                        lookupResult.status === 'approved'
                          ? 'text-[#15803D]'
                          : lookupResult.status === 'rejected'
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                      }`}
                    >
                      {lookupResult.status === 'approved'
                        ? 'অনুমোদিত'
                        : lookupResult.status === 'rejected'
                          ? 'বাতিল'
                          : 'যাচাই প্রক্রিয়াধীন'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716C]">মাসিক বেতন</dt>
                    <dd className="font-semibold text-[#1C1917] tabular-nums">
                      {formatBdt(lookupResult.monthlyFee)}
                    </dd>
                  </div>
                </dl>

                {lookupPayments.length > 0 && (
                  <div className="pt-4 border-t border-[#F0EBE3] space-y-2.5">
                    <h4 className="text-sm font-bold text-[#1C1917]">পেমেন্ট ইতিহাস</h4>
                    {lookupPayments.map((pay) => (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between text-xs bg-[#FAF8F5] border border-[#EFEAE2] rounded-lg px-3.5 py-2.5"
                      >
                        <div>
                          <p className="font-mono-tabular font-semibold text-[#1C1917]">
                            {pay.method} · {pay.transactionId}
                          </p>
                          <p className="text-[#78716C]">
                            অবস্থা:{' '}
                            {pay.status === 'verified'
                              ? 'যাচাইকৃত'
                              : pay.status === 'refunded'
                                ? 'রিফান্ড'
                                : 'অপেক্ষমান'}
                          </p>
                        </div>
                        <span className="font-bold text-[#7A0D14] tabular-nums">
                          {formatBdt(pay.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="lg:col-span-7 bg-white border border-[#E7E2DA] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE3]">
                  <h3 className="text-lg font-bold text-[#1C1917]">
                    আপনার নির্ধারিত ক্লাস রুটিন ({lookupResult.classLevel} শ্রেণি)
                  </h3>
                  <span className="text-xs text-[#78716C]">
                    মোট {toBengaliDigits(lookupRoutines.length)}টি ক্লাস
                  </span>
                </div>

                {lookupRoutines.length === 0 ? (
                  <p className="text-sm text-[#57534E] py-6 text-center">
                    এই শ্রেণি ও বিভাগের রুটিন শীঘ্রই প্রধান শিক্ষক কর্তৃক যুক্ত করা হবে।
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#E7E2DA] text-xs font-semibold text-[#78716C]">
                          <th className="py-2.5 pr-3">বার</th>
                          <th className="py-2.5 px-3">সময়</th>
                          <th className="py-2.5 px-3">বিষয় ও শিক্ষক</th>
                          <th className="py-2.5 pl-3 text-right">কক্ষ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE3]">
                        {lookupRoutines.map((r) => (
                          <tr key={r.id}>
                            <td className="py-3 pr-3 font-semibold text-[#7A0D14] whitespace-nowrap">
                              {r.day}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap tabular-nums">{r.timeSlot}</td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-[#1C1917]">{r.subject}</p>
                              <p className="text-xs text-[#78716C]">{r.teacherName}</p>
                            </td>
                            <td className="py-3 pl-3 text-right font-mono-tabular text-[#57534E] whitespace-nowrap">
                              {r.room}
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
      )}
    </div>
  );
}
