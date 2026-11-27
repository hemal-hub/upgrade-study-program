import { useMemo, useState } from 'react';
import { Check, Phone, Search, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { StudentRegistration, StudentRegistrationStatus } from '../../types';
import { toBengaliDigits } from '../../utils/academicLogic';
import { createStudentAvatarSvg } from '../../utils/imageUtils';

export function AdminStudentApprovalTab() {
  const { studentRegistrations, approveStudentRegistration, rejectStudentRegistration } = useApp();
  const [statusFilter, setStatusFilter] = useState<StudentRegistrationStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const r of studentRegistrations) {
      if (r.status === 'pending') pending += 1;
      else if (r.status === 'approved') approved += 1;
      else rejected += 1;
    }
    return { pending, approved, rejected, total: studentRegistrations.length };
  }, [studentRegistrations]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return studentRegistrations.filter((reg) => {
      if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        reg.studentName,
        reg.username,
        reg.classLevel,
        reg.group,
        reg.gender,
        reg.fatherName,
        reg.motherName,
        reg.guardianPhone,
        reg.rollNumber,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery, statusFilter, studentRegistrations]);

  const handleApprove = async (reg: StudentRegistration) => {
    setBusyUid(reg.uid);
    try {
      await approveStudentRegistration(reg);
    } finally {
      setBusyUid(null);
    }
  };

  const handleReject = async (uid: string) => {
    setBusyUid(uid);
    try {
      await rejectStudentRegistration(uid);
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#7A0D14]" />
            <span>Student Login Approval — শিক্ষার্থী অ্যাকাউন্ট অনুমোদন</span>
          </h2>
          <p className="text-xs text-[#78716C]">
            নতুন শিক্ষার্থীর রেজিস্ট্রেশন অনুমোদন করলে তার সকল তথ্য ও ইউজারনেম স্বয়ংক্রিয়ভাবে{' '}
            <strong className="text-[#1C1917]">Student List</strong>-এ সংরক্ষিত হবে এবং সে
            ইউজারনেম ও পাসওয়ার্ড দিয়ে Student Panel-এ লগইন করতে পারবে।
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="শিক্ষার্থী আবেদন অনুসন্ধান"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, ইউজারনেম বা মোবাইল..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'pending' as const, label: `অপেক্ষমান (${toBengaliDigits(counts.pending)})` },
            { id: 'approved' as const, label: `অনুমোদিত (${toBengaliDigits(counts.approved)})` },
            { id: 'rejected' as const, label: `বাতিল (${toBengaliDigits(counts.rejected)})` },
            { id: 'all' as const, label: `সকল আবেদন (${toBengaliDigits(counts.total)})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer tabular-nums ${
              statusFilter === tab.id
                ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                : 'bg-[#FAF8F5] text-[#44403C] border-[#E7E2DA] hover:border-[#7A0D14]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-10 text-center space-y-1.5">
          <p className="text-sm font-semibold text-[#1C1917]">
            এই তালিকায় কোনো শিক্ষার্থী রেজিস্ট্রেশন আবেদন নেই
          </p>
          <p className="text-xs text-[#78716C]">
            শিক্ষার্থীরা হোম পেইজের Student Login → Register থেকে আবেদন করলে এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((reg, idx) => {
            const isBusy = busyUid === reg.uid;
            return (
              <article
                key={reg.uid}
                className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 space-y-3.5 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={reg.studentPhoto || createStudentAvatarSvg(reg.studentName, idx)}
                    alt={reg.studentName}
                    className="w-16 h-16 rounded-xl object-cover border border-[#D6CFC5] bg-white shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-mono-tabular font-semibold text-[#7A0D14]">
                        @{reg.username}
                      </p>
                      <span
                        className={`text-xs font-semibold ${
                          reg.status === 'approved'
                            ? 'text-[#15803D]'
                            : reg.status === 'rejected'
                              ? 'text-[#B91C1C]'
                              : 'text-[#B45309]'
                        }`}
                      >
                        {reg.status === 'approved'
                          ? 'অনুমোদিত'
                          : reg.status === 'rejected'
                            ? 'বাতিল'
                            : 'অপেক্ষমান'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917] truncate">
                      {reg.studentName} ({reg.gender})
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      {reg.classLevel} শ্রেণি · {reg.group}
                      {reg.rollNumber ? ` · রোল: ${reg.rollNumber}` : ''}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-[#E7E2DA]">
                  <div>
                    <dt className="text-[#78716C]">পিতার নাম</dt>
                    <dd className="text-[#1C1917] font-medium truncate">{reg.fatherName}</dd>
                  </div>
                  <div>
                    <dt className="text-[#78716C]">মাতার নাম</dt>
                    <dd className="text-[#1C1917] font-medium truncate">{reg.motherName}</dd>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#44403C]">
                    <Phone className="w-3.5 h-3.5 text-[#7A0D14] shrink-0" />
                    <span className="font-mono-tabular">{reg.guardianPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#44403C]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                    <span>পাসওয়ার্ড: •••••••• (এনক্রিপ্টেড)</span>
                  </div>
                </dl>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E2DA]">
                  {reg.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleApprove(reg)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#15803D] text-white text-xs font-semibold rounded-lg hover:bg-[#166534] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isBusy ? 'প্রক্রিয়াধীন...' : 'অনুমোদন দিন'}</span>
                    </button>
                  )}
                  {reg.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleReject(reg.uid)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#B91C1C] text-xs font-semibold rounded-lg border border-[#FECACA] hover:bg-[#FEF2F2] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>বাতিল করুন</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
