import { useMemo, useState } from 'react';
import { Calendar, Eye, MapPin, Phone, Printer, Search, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AdmissionRecord, ClassLevel } from '../../types';
import {
  CLASS_LEVELS,
  formatBdt,
  groupStudentsByClass,
  toBengaliDigits,
} from '../../utils/academicLogic';
import { createStudentAvatarSvg } from '../../utils/imageUtils';

export function AdminStudentListTab() {
  const { admissions, siteSettings } = useApp();
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'সকল'>('সকল');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AdmissionRecord | null>(null);

  const groupedByClass = useMemo(() => groupStudentsByClass(admissions), [admissions]);

  const filteredStudents = useMemo(() => {
    const base = selectedClass === 'সকল' ? admissions : groupedByClass[selectedClass];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((adm) => {
      const haystack = [
        adm.studentName,
        adm.rollNumber,
        adm.fatherName,
        adm.motherName,
        adm.guardianName,
        adm.guardianPhone,
        adm.studentPhone,
        adm.presentAddress,
        adm.permanentAddress,
        adm.schoolName,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [admissions, groupedByClass, searchQuery, selectedClass]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1C1917]">
              Student List — শ্রেণিভিত্তিক ভর্তি হওয়া শিক্ষার্থীর পূর্ণাঙ্গ তালিকা
            </h2>
            <p className="text-xs text-[#78716C]">
              যেকোনো শ্রেণিতে ক্লিক করে সেই শ্রেণির সকল শিক্ষার্থীর ছবি, পিতা-মাতা, জন্ম তারিখ,
              মোবাইল নম্বর ও ঠিকানা দেখুন।
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Student List অনুসন্ধান"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, রোল, পিতা-মাতা বা ফোন..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
            />
          </div>
        </div>

        {/* Class Filter Tabs with Live Counts */}
        <div
          role="tablist"
          aria-label="শ্রেণি অনুযায়ী শিক্ষার্থী তালিকা"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedClass === 'সকল'}
            onClick={() => setSelectedClass('সকল')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer tabular-nums ${
              selectedClass === 'সকল'
                ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                : 'bg-[#FAF8F5] text-[#44403C] border-[#E7E2DA] hover:border-[#7A0D14]'
            }`}
          >
            সকল শ্রেণি ({toBengaliDigits(admissions.length)})
          </button>

          {CLASS_LEVELS.map((cls) => {
            const count = groupedByClass[cls].length;
            const active = selectedClass === cls;
            return (
              <button
                key={cls}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedClass(cls)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer tabular-nums ${
                  active
                    ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                    : 'bg-[#FAF8F5] text-[#44403C] border-[#E7E2DA] hover:border-[#7A0D14]'
                }`}
              >
                {cls} শ্রেণি ({toBengaliDigits(count)})
              </button>
            );
          })}
        </div>

        {/* Student Directory Cards Grid */}
        {filteredStudents.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-10 text-center space-y-1.5">
            <p className="text-sm font-semibold text-[#1C1917]">
              এই শ্রেণি বা অনুসন্ধানে কোনো শিক্ষার্থী পাওয়া যায়নি
            </p>
            <p className="text-xs text-[#78716C]">
              অন্য শ্রেণি নির্বাচন করুন অথবা অনুসন্ধান শব্দ পরিবর্তন করুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student, idx) => (
              <article
                key={student.id}
                className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 space-y-3.5 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={student.studentPhoto || createStudentAvatarSvg(student.studentName, idx)}
                    alt={student.studentName}
                    className="w-16 h-16 rounded-xl object-cover border border-[#D6CFC5] bg-white shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-mono-tabular font-semibold text-[#7A0D14]">
                        {student.rollNumber}
                      </p>
                      <span
                        className={`text-xs font-semibold ${
                          student.status === 'approved'
                            ? 'text-[#15803D]'
                            : student.status === 'rejected'
                              ? 'text-[#B91C1C]'
                              : 'text-[#B45309]'
                        }`}
                      >
                        {student.status === 'approved'
                          ? 'অনুমোদিত'
                          : student.status === 'rejected'
                            ? 'বাতিল'
                            : 'অপেক্ষমান'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1C1917] truncate">
                      {student.studentName}
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      {student.classLevel} শ্রেণি · {student.group} · {student.batchShift}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-2 border-t border-[#E7E2DA]">
                  <div>
                    <dt className="text-[#78716C]">পিতা ও মাতা</dt>
                    <dd className="text-[#1C1917] font-medium truncate">
                      {student.fatherName || '—'} / {student.motherName || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#78716C]">অভিভাবক ও জন্ম তারিখ</dt>
                    <dd className="text-[#1C1917] font-medium truncate">
                      {student.guardianName} ·{' '}
                      <span className="font-mono-tabular">{student.dateOfBirth || '—'}</span>
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#44403C]">
                    <Phone className="w-3.5 h-3.5 text-[#7A0D14] shrink-0" />
                    <span className="font-mono-tabular truncate">
                      {student.guardianPhone}
                      {student.studentPhone ? ` / ${student.studentPhone}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#44403C]">
                    <MapPin className="w-3.5 h-3.5 text-[#7A0D14] shrink-0" />
                    <span className="truncate">{student.presentAddress || '—'}</span>
                  </div>
                </dl>

                <div className="flex items-center justify-between pt-2 border-t border-[#E7E2DA]">
                  <span className="text-xs text-[#78716C] truncate">{student.schoolName}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A0D14] hover:underline shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>পূর্ণ প্রোফাইল</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Printable Full Student Profile Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-profile-modal-title"
        >
          <div className="bg-white border border-[#E7E2DA] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
              <div className="flex items-center gap-4">
                <img
                  src={
                    selectedStudent.studentPhoto ||
                    createStudentAvatarSvg(selectedStudent.studentName, 0)
                  }
                  alt={selectedStudent.studentName}
                  className="w-20 h-20 rounded-xl object-cover border border-[#D6CFC5] shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-[#B8862B]">{siteSettings.siteName}</p>
                  <h3
                    id="student-profile-modal-title"
                    className="text-xl font-bold text-[#1C1917] mt-0.5"
                  >
                    {selectedStudent.studentName}
                  </h3>
                  <p className="text-xs font-mono-tabular text-[#7A0D14] font-semibold mt-0.5">
                    রোল: {selectedStudent.rollNumber} · {selectedStudent.classLevel} শ্রেণি (
                    {selectedStudent.group})
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="বন্ধ করুন"
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-[#78716C] hover:text-[#1C1917] rounded-lg no-print cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C] flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>পিতার নাম</span>
                </dt>
                <dd className="font-semibold text-[#1C1917] mt-0.5">
                  {selectedStudent.fatherName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C] flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>মাতার নাম</span>
                </dt>
                <dd className="font-semibold text-[#1C1917] mt-0.5">
                  {selectedStudent.motherName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C]">অভিভাবকের নাম</dt>
                <dd className="font-semibold text-[#1C1917] mt-0.5">
                  {selectedStudent.guardianName}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>জন্ম তারিখ</span>
                </dt>
                <dd className="font-semibold font-mono-tabular text-[#1C1917] mt-0.5">
                  {selectedStudent.dateOfBirth || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C]">অভিভাবকের মোবাইল</dt>
                <dd className="font-semibold font-mono-tabular text-[#1C1917] mt-0.5">
                  {selectedStudent.guardianPhone}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C]">শিক্ষার্থীর মোবাইল</dt>
                <dd className="font-semibold font-mono-tabular text-[#1C1917] mt-0.5">
                  {selectedStudent.studentPhone || 'প্রদান করা হয়নি'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C]">বর্তমান স্কুল / কলেজ</dt>
                <dd className="font-semibold text-[#1C1917] mt-0.5">
                  {selectedStudent.schoolName}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3]">
                <dt className="text-xs text-[#78716C]">ব্যাচ শিফট ও মাসিক ফি</dt>
                <dd className="font-semibold text-[#1C1917] mt-0.5">
                  {selectedStudent.batchShift} ·{' '}
                  <span className="tabular-nums">{formatBdt(selectedStudent.monthlyFee)}</span>
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3] sm:col-span-2">
                <dt className="text-xs text-[#78716C]">বর্তমান ঠিকানা</dt>
                <dd className="font-medium text-[#1C1917] mt-0.5">
                  {selectedStudent.presentAddress || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-[#F0EBE3] sm:col-span-2">
                <dt className="text-xs text-[#78716C]">স্থায়ী ঠিকানা</dt>
                <dd className="font-medium text-[#1C1917] mt-0.5">
                  {selectedStudent.permanentAddress || '—'}
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-end gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0D14] text-white text-xs font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>প্রোফাইল প্রিন্ট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-[#FAF8F5] text-[#1C1917] text-xs font-semibold rounded-lg border border-[#D6CFC5] hover:border-[#7A0D14] transition-colors cursor-pointer"
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
