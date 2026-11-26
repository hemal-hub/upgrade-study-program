import { useMemo, useState } from 'react';
import { Award, Printer, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { DEFAULT_LOGO_URL } from '../data/seedData';
import type { ClassLevel, RankedStudentResult } from '../types';
import {
  CLASS_LEVELS,
  rankResultsWithMerit,
  toBengaliDigits,
} from '../utils/academicLogic';
import { createStudentAvatarSvg } from '../utils/imageUtils';

export function ResultsView() {
  const { results, siteSettings } = useApp();
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'সকল'>('সকল');
  const [selectedExam, setSelectedExam] = useState<string>('সকল');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMarksheet, setActiveMarksheet] = useState<RankedStudentResult | null>(null);

  const isDefaultLogo = siteSettings.logoUrl === DEFAULT_LOGO_URL;

  const examOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of results) {
      if (selectedClass === 'সকল' || r.classLevel === selectedClass) {
        set.add(r.examName);
      }
    }
    return Array.from(set);
  }, [results, selectedClass]);

  const rankedResults = useMemo(() => {
    const filtered = results.filter((r) => {
      if (selectedClass !== 'সকল' && r.classLevel !== selectedClass) return false;
      if (selectedExam !== 'সকল' && r.examName !== selectedExam) return false;
      return true;
    });
    const ranked = rankResultsWithMerit(filtered);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.examName.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q),
    );
  }, [results, selectedClass, selectedExam, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="space-y-2 max-w-3xl no-print">
        <p className="text-sm font-semibold text-[#B8862B]">একাডেমিক মূল্যায়ন ও মেধাতালিকা</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917]">পরীক্ষার রেজাল্ট</h1>
        <p className="text-[15px] text-[#57534E]">
          ৬ষ্ঠ থেকে একাদশ শ্রেণির সাপ্তাহিক ও মাসিক মডেল টেস্টের প্রকাশিত ফলাফল, গ্রেড ও
          মেধাক্রম এখান থেকে দেখুন এবং মার্কশিট প্রিন্ট করুন।
        </p>
      </div>

      {/* Class Selector Tabs */}
      <div className="bg-white border border-[#E7E2DA] rounded-2xl p-4 sm:p-5 space-y-4 no-print">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="শ্রেণি অনুযায়ী রেজাল্ট ফিল্টার"
        >
          <button
            type="button"
            onClick={() => {
              setSelectedClass('সকল');
              setSelectedExam('সকল');
            }}
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedClass === 'সকল'
                ? 'bg-[#7A0D14] text-white'
                : 'bg-[#FAF8F5] text-[#44403C] hover:bg-[#EFEAE2]'
            }`}
          >
            সকল শ্রেণি ({toBengaliDigits(results.length)})
          </button>
          {CLASS_LEVELS.map((cls) => {
            const count = results.filter((r) => r.classLevel === cls).length;
            const active = selectedClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => {
                  setSelectedClass(cls);
                  setSelectedExam('সকল');
                }}
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#7A0D14] text-white'
                    : 'bg-[#FAF8F5] text-[#44403C] hover:bg-[#EFEAE2]'
                }`}
              >
                {cls} শ্রেণি ({toBengaliDigits(count)})
              </button>
            );
          })}
        </div>

        {results.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-[#F0EBE3]">
            <select
              aria-label="পরীক্ষা নির্বাচন করুন"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg px-3.5 py-2.5 text-sm text-[#1C1917] sm:w-72"
            >
              <option value="সকল">সকল পরীক্ষা</option>
              {examOptions.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="রোল নম্বর বা নাম দিয়ে রেজাল্ট খুঁজুন"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শিক্ষার্থীর নাম বা রোল নম্বর (যেমন: USP-09-2026-0001)..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Content */}
      {results.length === 0 ? (
        <div className="bg-white border border-[#E7E2DA] rounded-2xl p-14 text-center space-y-3">
          <span className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6 text-[#78716C]" />
          </span>
          <p className="text-lg font-bold text-[#1C1917]">এখনো কোনো রেজাল্ট পাবলিশ হয়নি</p>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            প্রধান শিক্ষক বা শিক্ষক ড্যাশবোর্ড থেকে শ্রেণিভিত্তিক পরীক্ষার ফলাফল প্রকাশ করলেই
            শিক্ষার্থীরা ছবি ও মেধাক্রমসহ এখানে রেজাল্ট দেখতে পারবে।
          </p>
        </div>
      ) : rankedResults.length === 0 ? (
        <div className="bg-white border border-[#E7E2DA] rounded-2xl p-12 text-center space-y-2">
          <p className="text-base font-semibold text-[#1C1917]">
            নির্বাচিত শ্রেণি বা অনুসন্ধানে কোনো রেজাল্ট পাওয়া যায়নি
          </p>
          <p className="text-sm text-[#57534E]">
            অন্য শ্রেণি বা পরীক্ষার নাম নির্বাচন করে চেষ্টা করুন।
          </p>
        </div>
      ) : (
        <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                  <th className="py-3.5 px-4">মেধাক্রম</th>
                  <th className="py-3.5 px-4">শিক্ষার্থী (ছবিসহ)</th>
                  <th className="py-3.5 px-4">শ্রেণি ও পরীক্ষা</th>
                  <th className="py-3.5 px-4 text-right">প্রাপ্ত নম্বর</th>
                  <th className="py-3.5 px-4 text-right">গ্রেড ও জিপিএ</th>
                  <th className="py-3.5 px-4 text-right">মার্কশিট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                {rankedResults.map((res, idx) => (
                  <tr key={res.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#7A0D14] tabular-nums whitespace-nowrap">
                      #{toBengaliDigits(res.meritPosition)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={res.studentPhoto || createStudentAvatarSvg(res.studentName, idx)}
                          alt={res.studentName}
                          className="w-11 h-11 rounded-lg object-cover border border-[#E7E2DA] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1C1917]">{res.studentName}</p>
                          <p className="text-xs font-mono-tabular text-[#78716C]">
                            {res.rollNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#1C1917]">
                        {res.classLevel} শ্রেণি ({res.group}) · {res.examName}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        {res.subject} · {res.publishedDate}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#1C1917] tabular-nums whitespace-nowrap">
                      {toBengaliDigits(res.obtainedMarks)} / {toBengaliDigits(res.fullMarks)}
                      <p className="text-xs font-normal text-[#78716C]">
                        {toBengaliDigits(res.percentage)}%
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          res.grade === 'F' ? 'text-[#B91C1C]' : 'text-[#15803D]'
                        }`}
                      >
                        {res.grade}
                      </span>
                      <p className="text-xs font-mono-tabular text-[#57534E]">
                        GPA {toBengaliDigits(res.gpa.toFixed(2))}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveMarksheet(res)}
                        className="px-3.5 py-2 text-xs font-semibold text-[#7A0D14] bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:border-[#7A0D14] transition-colors cursor-pointer"
                      >
                        মার্কশিট দেখুন
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Printable Individual Marksheet Dialog */}
      <AnimatePresence>
        {activeMarksheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
            onClick={() => setActiveMarksheet(null)}
          >
            <motion.dialog
              open
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              aria-labelledby="marksheet-modal-title"
              className="relative max-w-xl w-full bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 shadow-xl m-0 space-y-6"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={siteSettings.logoUrl || DEFAULT_LOGO_URL}
                      alt={siteSettings.siteName}
                      className={`w-12 h-12 object-contain ${isDefaultLogo ? 'scale-[1.55]' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#B8862B]">{siteSettings.siteName}</p>
                    <h2 id="marksheet-modal-title" className="text-lg font-bold text-[#1C1917]">
                      একাডেমিক ফলাফল পত্র (মার্কশিট)
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMarksheet(null)}
                  aria-label="মার্কশিট বন্ধ করুন"
                  className="p-2 rounded-lg text-[#57534E] hover:bg-[#F4F0E8] cursor-pointer no-print"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={
                    activeMarksheet.studentPhoto ||
                    createStudentAvatarSvg(activeMarksheet.studentName, 0)
                  }
                  alt={activeMarksheet.studentName}
                  className="w-20 h-20 rounded-xl object-cover border border-[#E7E2DA] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <p className="text-xs font-mono-tabular font-semibold text-[#7A0D14]">
                    {activeMarksheet.rollNumber}
                  </p>
                  <h3 className="text-xl font-bold text-[#1C1917]">
                    {activeMarksheet.studentName}
                  </h3>
                  <p className="text-sm text-[#57534E]">
                    {activeMarksheet.classLevel} শ্রেণি ({activeMarksheet.group})
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-4">
                <div>
                  <dt className="text-xs text-[#78716C]">পরীক্ষার নাম</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {activeMarksheet.examName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#78716C]">বিষয়</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {activeMarksheet.subject}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#78716C]">প্রাপ্ত নম্বর / পূর্ণমান</dt>
                  <dd className="font-bold text-[#7A0D14] tabular-nums mt-0.5">
                    {toBengaliDigits(activeMarksheet.obtainedMarks)} /{' '}
                    {toBengaliDigits(activeMarksheet.fullMarks)} (
                    {toBengaliDigits(activeMarksheet.percentage)}%)
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#78716C]">গ্রেড ও জিপিএ</dt>
                  <dd
                    className={`font-bold mt-0.5 ${
                      activeMarksheet.grade === 'F' ? 'text-[#B91C1C]' : 'text-[#15803D]'
                    }`}
                  >
                    {activeMarksheet.grade} · GPA {toBengaliDigits(activeMarksheet.gpa.toFixed(2))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#78716C]">মেধাক্রম</dt>
                  <dd className="font-semibold text-[#1C1917] tabular-nums mt-0.5">
                    #{toBengaliDigits(activeMarksheet.meritPosition)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#78716C]">প্রকাশের তারিখ</dt>
                  <dd className="font-semibold text-[#1C1917] mt-0.5">
                    {activeMarksheet.publishedDate}
                  </dd>
                </div>
              </dl>

              {activeMarksheet.remarks && (
                <p className="text-sm text-[#44403C]">
                  <span className="font-semibold text-[#1C1917]">শিক্ষকের মন্তব্য: </span>
                  {activeMarksheet.remarks}
                </p>
              )}

              <div className="pt-4 border-t border-[#E7E2DA] flex items-center justify-end gap-3 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMarksheet(null)}
                  className="px-4 py-2 bg-[#FAF8F5] text-[#1C1917] text-sm font-semibold rounded-lg border border-[#D6CFC5] cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
