import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ClassLevel, ResultFormInput } from '../../types';
import {
  calculateBangladeshiGrade,
  CLASS_LEVELS,
  groupStudentsByClass,
  rankResultsWithMerit,
  toBengaliDigits,
  validateResultInput,
} from '../../utils/academicLogic';
import { createStudentAvatarSvg } from '../../utils/imageUtils';

interface StudentMarkDraft {
  obtainedMarks: string;
  remarks: string;
}

export function AdminResultsTab() {
  const { admissions, results, publishBatchResults, removeResult } = useApp();

  const [selectedClass, setSelectedClass] = useState<ClassLevel>('৯ম');
  const [examName, setExamName] = useState('মাসিক মডেল টেস্ট — ২০২৬');
  const [subject, setSubject] = useState('সকল বিষয় (মোট)');
  const [fullMarks, setFullMarks] = useState('100');
  const [drafts, setDrafts] = useState<Record<string, StudentMarkDraft>>({});
  const [formError, setFormError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const [publishedClassFilter, setPublishedClassFilter] = useState<ClassLevel | 'সকল'>('সকল');

  const groupedByClass = useMemo(() => groupStudentsByClass(admissions), [admissions]);
  const classStudents = groupedByClass[selectedClass];

  const numericFullMarks = Number(fullMarks);
  const safeFullMarks =
    Number.isFinite(numericFullMarks) && numericFullMarks >= 10 && numericFullMarks <= 1000
      ? numericFullMarks
      : 100;

  const updateStudentDraft = (studentId: string, patch: Partial<StudentMarkDraft>) => {
    setFormError('');
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        obtainedMarks: prev[studentId]?.obtainedMarks ?? '',
        remarks: prev[studentId]?.remarks ?? '',
        ...patch,
      },
    }));
  };

  const handlePublishClassResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const inputsToPublish: ResultFormInput[] = [];

    for (const student of classStudents) {
      const entry = drafts[student.id];
      if (!entry || entry.obtainedMarks.trim() === '') continue;

      const obtained = Number(entry.obtainedMarks);
      const item: ResultFormInput = {
        admissionId: student.id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        studentPhoto: student.studentPhoto || '',
        classLevel: student.classLevel,
        group: student.group,
        examName,
        subject,
        fullMarks: Number(fullMarks),
        obtainedMarks: obtained,
        remarks: entry.remarks,
      };

      const validation = validateResultInput(item);
      if (!validation.valid) {
        const firstErr = Object.values(validation.errors)[0];
        setFormError(`${student.studentName}: ${firstErr}`);
        return;
      }
      inputsToPublish.push(item);
    }

    if (inputsToPublish.length === 0) {
      setFormError('অন্তত একজন শিক্ষার্থীর প্রাপ্ত নম্বর লিখুন।');
      return;
    }

    setPublishing(true);
    try {
      await publishBatchResults(inputsToPublish);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const item of inputsToPublish) {
          delete next[item.admissionId];
        }
        return next;
      });
    } finally {
      setPublishing(false);
    }
  };

  const filteredPublishedResults = useMemo(() => {
    const filtered =
      publishedClassFilter === 'সকল'
        ? results
        : results.filter((r) => r.classLevel === publishedClassFilter);
    return rankResultsWithMerit(filtered);
  }, [publishedClassFilter, results]);

  return (
    <div className="space-y-6">
      {/* Class-wise Result Publisher */}
      <form
        onSubmit={handlePublishClassResults}
        noValidate
        className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-6"
      >
        <div className="pb-4 border-b border-[#F0EBE3] space-y-1">
          <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7A0D14]" />
            <span>শ্রেণিভিত্তিক রেজাল্ট প্রকাশ করুন</span>
          </h2>
          <p className="text-xs text-[#78716C]">
            নিচে শ্রেণি নির্বাচন করলে সেই শ্রেণির সকল ভর্তি হওয়া শিক্ষার্থীর ছবি ও নাম দেখা যাবে।
            প্রাপ্ত নম্বর বসিয়ে একসাথে পাবলিক রেজাল্ট বোর্ডে প্রকাশ করুন।
          </p>
        </div>

        {/* Class Selector Buttons */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#1C1917]">
            যেই শ্রেণির রেজাল্ট প্রকাশ করবেন তা নির্বাচন করুন:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5" role="tablist">
            {CLASS_LEVELS.map((cls) => {
              const count = groupedByClass[cls].length;
              const active = selectedClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedClass(cls);
                    setFormError('');
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                      : 'bg-[#FAF8F5] text-[#1C1917] border-[#E7E2DA] hover:border-[#7A0D14]'
                  }`}
                >
                  <p className="text-sm font-bold">{cls} শ্রেণি</p>
                  <p
                    className={`text-xs tabular-nums ${
                      active ? 'text-white/80' : 'text-[#78716C]'
                    }`}
                  >
                    {toBengaliDigits(count)} জন শিক্ষার্থী
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4">
          <div className="space-y-1">
            <label htmlFor="res-exam" className="block text-xs font-semibold text-[#1C1917]">
              পরীক্ষার নাম *
            </label>
            <input
              id="res-exam"
              type="text"
              value={examName}
              onChange={(e) => {
                setExamName(e.target.value);
                setFormError('');
              }}
              placeholder="যেমন: মাসিক মডেল টেস্ট — নভেম্বর ২০২৬"
              className="w-full px-3 py-2 bg-white border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="res-subject" className="block text-xs font-semibold text-[#1C1917]">
              বিষয় / ধরন *
            </label>
            <input
              id="res-subject"
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setFormError('');
              }}
              placeholder="যেমন: পদার্থবিজ্ঞান অথবা সকল বিষয়"
              className="w-full px-3 py-2 bg-white border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="res-full" className="block text-xs font-semibold text-[#1C1917]">
              পূর্ণমান *
            </label>
            <input
              id="res-full"
              type="number"
              min={10}
              max={1000}
              value={fullMarks}
              onChange={(e) => {
                setFullMarks(e.target.value);
                setFormError('');
              }}
              className="w-full px-3 py-2 bg-white border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
            />
          </div>
        </div>

        {/* Selected Class Student List with Photo + Name + Marks Entry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1917]">
              {selectedClass} শ্রেণির শিক্ষার্থীবৃন্দ ({toBengaliDigits(classStudents.length)} জন)
            </h3>
            <span className="text-xs text-[#78716C]">
              নম্বর বসালেই গ্রেড ও GPA স্বয়ংক্রিয়ভাবে হিসাব হবে
            </span>
          </div>

          {classStudents.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-8 text-center text-sm text-[#57534E]">
              {selectedClass} শ্রেণিতে এখনো কোনো শিক্ষার্থী ভর্তি হয়নি।
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE3] border border-[#E7E2DA] rounded-xl overflow-hidden">
              {classStudents.map((student, idx) => {
                const draft = drafts[student.id] ?? { obtainedMarks: '', remarks: '' };
                const hasScore = draft.obtainedMarks.trim() !== '';
                const parsedScore = Number(draft.obtainedMarks);
                const liveGrade =
                  hasScore && Number.isFinite(parsedScore)
                    ? calculateBangladeshiGrade(parsedScore, safeFullMarks)
                    : null;

                return (
                  <div
                    key={student.id}
                    className="p-4 bg-white hover:bg-[#FAF8F5] grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center"
                  >
                    {/* Photo + Name + Roll */}
                    <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                      <img
                        src={student.studentPhoto || createStudentAvatarSvg(student.studentName, idx)}
                        alt={student.studentName}
                        className="w-12 h-12 rounded-xl object-cover border border-[#D6CFC5] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#1C1917] truncate">
                          {student.studentName}
                        </p>
                        <p className="text-xs font-mono-tabular text-[#78716C] truncate">
                          {student.rollNumber} · {student.group}
                        </p>
                      </div>
                    </div>

                    {/* Obtained Marks */}
                    <div className="md:col-span-2">
                      <label className="sr-only" htmlFor={`marks-${student.id}`}>
                        {student.studentName} এর প্রাপ্ত নম্বর
                      </label>
                      <input
                        id={`marks-${student.id}`}
                        type="number"
                        min={0}
                        max={safeFullMarks}
                        step="0.5"
                        value={draft.obtainedMarks}
                        onChange={(e) =>
                          updateStudentDraft(student.id, { obtainedMarks: e.target.value })
                        }
                        placeholder={`নম্বর (/${safeFullMarks})`}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                      />
                    </div>

                    {/* Remarks */}
                    <div className="md:col-span-3">
                      <label className="sr-only" htmlFor={`rem-${student.id}`}>
                        মন্তব্য
                      </label>
                      <input
                        id={`rem-${student.id}`}
                        type="text"
                        value={draft.remarks}
                        onChange={(e) =>
                          updateStudentDraft(student.id, { remarks: e.target.value })
                        }
                        placeholder="মন্তব্য (যেমন: অসাধারণ ফলাফল)"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-xs text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                      />
                    </div>

                    {/* Live Grade Preview */}
                    <div className="md:col-span-2 text-left md:text-right tabular-nums">
                      {liveGrade ? (
                        <div>
                          <p
                            className={`text-sm font-bold ${
                              liveGrade.passed ? 'text-[#15803D]' : 'text-[#B91C1C]'
                            }`}
                          >
                            {liveGrade.grade} (GPA {toBengaliDigits(liveGrade.gpa.toFixed(2))})
                          </p>
                          <p className="text-xs text-[#78716C]">
                            {toBengaliDigits(liveGrade.percentage)}%
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#A8A29E]">নম্বর দিন</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm font-medium text-[#B91C1C]">
            {formError}
          </p>
        )}

        <div className="flex justify-end pt-2 border-t border-[#F0EBE3]">
          <button
            type="submit"
            disabled={publishing || classStudents.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {publishing
                ? 'রেজাল্ট প্রকাশ হচ্ছে...'
                : `${selectedClass} শ্রেণির রেজাল্ট প্রকাশ করুন`}
            </span>
          </button>
        </div>
      </form>

      {/* Published Results Ledger */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#E7E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1C1917]">
              প্রকাশিত রেজাল্ট তালিকা ({toBengaliDigits(filteredPublishedResults.length)})
            </h3>
            <p className="text-xs text-[#78716C]">
              প্রকাশিত ফলাফল ওয়েবসাইটের "রেজাল্ট" পাতায় শিক্ষার্থীরা দেখতে পাবে।
            </p>
          </div>
          <select
            aria-label="প্রকাশিত রেজাল্ট শ্রেণি ফিল্টার"
            value={publishedClassFilter}
            onChange={(e) => setPublishedClassFilter(e.target.value as ClassLevel | 'সকল')}
            className="bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg px-3 py-2 text-xs font-semibold text-[#1C1917]"
          >
            <option value="সকল">সকল শ্রেণি</option>
            {CLASS_LEVELS.map((cls) => (
              <option key={cls} value={cls}>
                {cls} শ্রেণি
              </option>
            ))}
          </select>
        </div>

        {filteredPublishedResults.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#57534E]">
            এখনো কোনো রেজাল্ট প্রকাশ করা হয়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                  <th className="py-3 px-4">শিক্ষার্থী</th>
                  <th className="py-3 px-4">শ্রেণি ও পরীক্ষা</th>
                  <th className="py-3 px-4 text-right">নম্বর</th>
                  <th className="py-3 px-4">গ্রেড ও GPA</th>
                  <th className="py-3 px-4 text-right">মুছুন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {filteredPublishedResults.map((res, idx) => (
                  <tr key={res.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={res.studentPhoto || createStudentAvatarSvg(res.studentName, idx)}
                          alt={res.studentName}
                          className="w-9 h-9 rounded-lg object-cover border border-[#E7E2DA] shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-[#1C1917]">{res.studentName}</p>
                          <p className="text-xs font-mono-tabular text-[#78716C]">
                            {res.rollNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#1C1917]">
                        {res.classLevel} শ্রেণি · {res.examName}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        {res.subject} · {res.publishedDate}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-[#1C1917] whitespace-nowrap">
                      {toBengaliDigits(res.obtainedMarks)} / {toBengaliDigits(res.fullMarks)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                      <span
                        className={`text-xs font-bold ${
                          res.grade === 'F' ? 'text-[#B91C1C]' : 'text-[#15803D]'
                        }`}
                      >
                        {res.grade} · GPA {toBengaliDigits(res.gpa.toFixed(2))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        aria-label={`${res.studentName} এর রেজাল্ট মুছুন`}
                        onClick={() => void removeResult(res.id)}
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
        )}
      </section>
    </div>
  );
}
