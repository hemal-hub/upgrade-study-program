import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CLASS_PROGRAMS } from '../data/seedData';
import type { AcademicGroup, ClassLevel, DayOfWeek } from '../types';
import {
  CLASS_LEVELS,
  DAYS_OF_WEEK,
  filterAndSortRoutines,
  formatBdt,
  getAllowedGroupsForClass,
  toBengaliDigits,
} from '../utils/academicLogic';

export function ClassesRoutineView() {
  const { routines, preselectedClass, navigateToAdmissionForClass } = useApp();

  const [selectedClass, setSelectedClass] = useState<ClassLevel>(preselectedClass);
  const [selectedGroup, setSelectedGroup] = useState<AcademicGroup | 'সকল'>('সকল');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'সকল'>('সকল');

  useEffect(() => {
    setSelectedClass(preselectedClass);
    setSelectedGroup('সকল');
  }, [preselectedClass]);

  const currentProgram =
    CLASS_PROGRAMS.find((p) => p.classLevel === selectedClass) ?? CLASS_PROGRAMS[0];
  const allowedGroups = getAllowedGroupsForClass(selectedClass);

  const filteredRoutines = filterAndSortRoutines(routines, {
    classLevel: selectedClass,
    group: selectedGroup,
    day: selectedDay,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Page Header */}
      <div className="space-y-2 max-w-3xl">
        <p className="text-sm font-semibold text-[#B8862B]">একাডেমিক তথ্য ও সময়সূচি</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917]">
          ক্লাস ও সাপ্তাহিক রুটিন (৬ষ্ঠ – একাদশ শ্রেণি)
        </h1>
        <p className="text-[15px] text-[#57534E]">
          আপনার শ্রেণি নির্বাচন করে পাঠ্যবিষয়, মাসিক বেতন, ব্যাচের আসন সংখ্যা এবং প্রধান শিক্ষক
          কর্তৃক প্রকাশিত হালনাগাদ ক্লাস রুটিন দেখুন।
        </p>
      </div>

      {/* Class Selector Segmented Bar */}
      <div
        role="tablist"
        aria-label="শ্রেণি নির্বাচন"
        className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F4F0E8] border border-[#E7E2DA] rounded-xl w-fit"
      >
        {CLASS_LEVELS.map((cls) => {
          const active = selectedClass === cls;
          return (
            <button
              key={cls}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSelectedClass(cls);
                setSelectedGroup('সকল');
              }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#7A0D14] text-white shadow-sm'
                  : 'text-[#44403C] hover:text-[#1C1917] hover:bg-white/70'
              }`}
            >
              {cls} শ্রেণি
            </button>
          );
        })}
      </div>

      {/* Selected Class Detail Card */}
      <motion.section
        key={selectedClass}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#78716C]">
                <span className="font-mono-tabular font-semibold text-[#7A0D14]">
                  {currentProgram.classCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>ব্যাচ সমন্বয়ক: {currentProgram.leadTeacher}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1C1917]">
                {currentProgram.classLevel} শ্রেণি — {currentProgram.subtitle}
              </h2>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1C1917] mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#7A0D14]" />
                <span>পাঠদানকৃত মূল বিষয়সমূহ</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#44403C]">
                {currentProgram.coreSubjects.map((subject) => (
                  <li
                    key={subject}
                    className="py-2 px-3.5 bg-[#FAF8F5] border border-[#EFEAE2] rounded-lg"
                  >
                    {subject}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E7E2DA]">
              <div>
                <p className="text-xs text-[#78716C]">মাসিক বেতন</p>
                <p className="text-2xl font-bold text-[#7A0D14] tabular-nums mt-0.5">
                  {formatBdt(currentProgram.monthlyFee)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#78716C]">এককালীন ভর্তি ফি</p>
                <p className="text-2xl font-bold text-[#1C1917] tabular-nums mt-0.5">
                  {formatBdt(currentProgram.admissionFee)}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-[#44403C]">
              <div className="flex items-center justify-between">
                <span>সাপ্তাহিক ক্লাস</span>
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {toBengaliDigits(currentProgram.weeklyClasses)} দিন
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>মাসিক মডেল টেস্ট</span>
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {toBengaliDigits(currentProgram.modelTestsPerMonth)}টি পরীক্ষা
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>আসন সংখ্যা</span>
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {toBengaliDigits(currentProgram.enrolledSeats)} /{' '}
                  {toBengaliDigits(currentProgram.seatCapacity)} ভর্তি সম্পন্ন
                </span>
              </div>
              {allowedGroups.length > 1 && (
                <p className="text-xs text-[#78716C] pt-1">
                  বিজ্ঞান বিভাগের ল্যাব ও প্র্যাকটিক্যাল শিটের জন্য মাসিক ৳৪০০ অতিরিক্ত প্রযোজ্য।
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigateToAdmissionForClass(selectedClass)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
            >
              <span>{selectedClass} শ্রেণিতে অনলাইন ভর্তি হোন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Weekly Routine Table Section */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1C1917] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7A0D14]" />
              <span>{selectedClass} শ্রেণির সাপ্তাহিক ক্লাস রুটিন</span>
            </h2>
            <p className="text-sm text-[#57534E]">
              মোট {toBengaliDigits(filteredRoutines.length)}টি নির্ধারিত ক্লাস সেশন
            </p>
          </div>

          {/* Group & Day Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {allowedGroups.length > 1 && (
              <label className="flex items-center gap-2 text-sm text-[#44403C]">
                <span className="whitespace-nowrap">বিভাগ:</span>
                <select
                  aria-label="বিভাগ ফিল্টার"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value as AcademicGroup | 'সকল')}
                  className="bg-white border border-[#D6CFC5] rounded-lg px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                >
                  <option value="সকল">সকল বিভাগ</option>
                  {allowedGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-[#44403C]">
              <span className="whitespace-nowrap">বার:</span>
              <select
                aria-label="বার ফিল্টার"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek | 'সকল')}
                className="bg-white border border-[#D6CFC5] rounded-lg px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              >
                <option value="সকল">সকল বার</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="bg-white border border-[#E7E2DA] rounded-xl overflow-hidden">
          {filteredRoutines.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Clock className="w-8 h-8 text-[#A8A29E] mx-auto" />
              <p className="text-base font-semibold text-[#1C1917]">
                এই ফিল্টারে কোনো ক্লাস রুটিন পাওয়া যায়নি
              </p>
              <p className="text-sm text-[#57534E]">
                অন্য বার বা বিভাগ নির্বাচন করুন অথবা প্রধান শিক্ষক ড্যাশবোর্ড থেকে নতুন রুটিন
                যুক্ত করুন।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#57534E]">
                    <th className="py-3.5 px-5">বার</th>
                    <th className="py-3.5 px-5">সময়</th>
                    <th className="py-3.5 px-5">বিষয়</th>
                    <th className="py-3.5 px-5">বিভাগ</th>
                    <th className="py-3.5 px-5">শিক্ষক</th>
                    <th className="py-3.5 px-5 text-right">কক্ষ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3] text-sm">
                  {filteredRoutines.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-[#7A0D14] whitespace-nowrap">
                        {entry.day}
                      </td>
                      <td className="py-3.5 px-5 text-[#1C1917] font-medium whitespace-nowrap tabular-nums">
                        {entry.timeSlot}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#1C1917]">
                        {entry.subject}
                      </td>
                      <td className="py-3.5 px-5 text-[#57534E] whitespace-nowrap">
                        {entry.group}
                      </td>
                      <td className="py-3.5 px-5 text-[#44403C] whitespace-nowrap">
                        {entry.teacherName}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-tabular text-[#57534E] whitespace-nowrap">
                        {entry.room}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
