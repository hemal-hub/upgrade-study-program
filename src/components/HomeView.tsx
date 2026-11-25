import { ArrowRight, Calendar, ChevronRight, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CLASS_PROGRAMS, FACULTY_MEMBERS } from '../data/seedData';
import {
  filterAndSortNotices,
  filterAndSortRoutines,
  formatBdt,
  toBengaliDigits,
} from '../utils/academicLogic';

export function HomeView() {
  const {
    notices,
    routines,
    setActiveView,
    navigateToAdmissionForClass,
    navigateToClassesForLevel,
  } = useApp();

  const topNotices = filterAndSortNotices(notices, {}).slice(0, 3);
  const featuredRoutines = filterAndSortRoutines(routines, {}).slice(0, 5);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* Hero Banner Section */}
      <section className="bg-white border-b border-[#E7E2DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-10 sm:pb-14">
          {/* User's Official Brand Banner */}
          <motion.div
            initial={{ opacity: 0.92, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] shadow-sm"
          >
            <img
              src="/assets/aistudio/chatgpt-image-2026-11-25-131020-01_6b6334e2.png"
              alt="আপগ্রেড স্টাডি প্রোগ্রাম (USP) — ক্লাস ৬ষ্ঠ থেকে একাদশ শ্রেণির শিক্ষার্থীদের একাডেমিক ব্যানার"
              className="w-full h-auto max-h-[420px] object-cover object-center"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Hero Copy & Single Dominant Primary CTA + Secondary Action */}
          <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <motion.div
              initial={{ opacity: 0.95, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-8 space-y-4"
            >
              <p className="text-sm font-semibold text-[#B8862B] tracking-normal">
                ষষ্ঠ থেকে একাদশ শ্রেণি · ২০২৬-২৭ শিক্ষাবর্ষে ভর্তি চলছে
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#1C1917] leading-[1.18]">
                আধুনিক পাঠদান, নিয়মিত মূল্যায়ন এবং সহজ অনলাইন ভর্তি ব্যবস্থাপনা
              </h1>
              <p className="text-base sm:text-lg text-[#57534E] max-w-2xl leading-relaxed">
                আপগ্রেড স্টাডি প্রোগ্রাম (USP)-এ শিক্ষার্থীরা ঘরে বসেই অনলাইনে ভর্তি হতে,
                সাপ্তাহিক ক্লাস রুটিন ও নোটিশ দেখতে এবং বিকাশ, নগদ, রকেট বা কার্ডে নিরাপদে ফি
                পরিশোধ করতে পারবে।
              </p>
            </motion.div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:justify-end">
              <button
                type="button"
                onClick={() => setActiveView('admission')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#7A0D14] text-white text-[15px] font-semibold rounded-xl hover:bg-[#5E090F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A0D14]"
              >
                <span>অনলাইন ভর্তি আবেদন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveView('classes')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#1C1917] text-[15px] font-semibold rounded-xl border border-[#D6CFC5] hover:border-[#7A0D14] hover:text-[#7A0D14] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>ক্লাস ও রুটিন দেখুন</span>
              </button>
            </div>
          </div>

          {/* 4-Column Full-Width Institutional Proof Strip */}
          <div className="mt-10 pt-8 border-t border-[#E7E2DA] grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-[#7A0D14] tabular-nums">
                ৬ষ্ঠ – একাদশ
              </p>
              <p className="text-sm text-[#57534E]">
                সাধারণ, বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক বিভাগ
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-[#1C1917] tabular-nums">
                {toBengaliDigits(240)}+ শিক্ষার্থী
              </p>
              <p className="text-sm text-[#57534E]">
                ছোট ব্যাচ সাইজ ও ব্যক্তিগত তত্ত্বাবধান
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-[#1C1917] tabular-nums">
                সাপ্তাহিক পরীক্ষা
              </p>
              <p className="text-sm text-[#57534E]">
                অধ্যায়ভিত্তিক মডেল টেস্ট ও প্রগ্রেস রিপোর্ট
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-[#B8862B] tabular-nums">
                ডিজিটাল পেমেন্ট
              </p>
              <p className="text-sm text-[#57534E]">
                বিকাশ, নগদ, রকেট ও কার্ডে তাৎক্ষণিক রশিদ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Class 6–11 Academic Programs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#B8862B]">একাডেমিক প্রোগ্রামসমূহ</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
              ৬ষ্ঠ থেকে একাদশ শ্রেণির ব্যাচ ও ফি কাঠামো
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('classes')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7A0D14] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>সকল রুটিন ও বিষয় বিস্তারিত</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLASS_PROGRAMS.map((program, idx) => {
            const seatsLeft = Math.max(0, program.seatCapacity - program.enrolledSeats);
            return (
              <motion.article
                key={program.classLevel}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-[#E7E2DA] rounded-xl p-6 flex flex-col justify-between hover:border-[#C9932C] transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-bold text-[#1C1917]">
                      {program.classLevel} শ্রেণি
                    </h3>
                    <span className="text-xs font-mono-tabular text-[#78716C]">
                      {program.classCode}
                    </span>
                  </div>

                  <p className="text-sm text-[#57534E] leading-relaxed">
                    {program.subtitle}
                  </p>

                  {/* Clean unboxed metadata row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E] pt-1">
                    <span>সপ্তাহে {toBengaliDigits(program.weeklyClasses)} দিন ক্লাস</span>
                    <span aria-hidden="true">·</span>
                    <span>মাসে {toBengaliDigits(program.modelTestsPerMonth)}টি মডেল টেস্ট</span>
                    <span aria-hidden="true">·</span>
                    <span>আসন বাকি {toBengaliDigits(seatsLeft)}টি</span>
                  </div>

                  <div className="pt-3 border-t border-[#F0EBE3] flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-[#78716C]">মাসিক বেতন</p>
                      <p className="text-lg font-bold text-[#7A0D14] tabular-nums">
                        {formatBdt(program.monthlyFee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#78716C]">ভর্তি ফি</p>
                      <p className="text-sm font-semibold text-[#1C1917] tabular-nums">
                        {formatBdt(program.admissionFee)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F0EBE3] flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToAdmissionForClass(program.classLevel)}
                    className="flex-1 py-2.5 px-4 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    ভর্তি হোন
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToClassesForLevel(program.classLevel)}
                    className="py-2.5 px-4 bg-[#FAF8F5] text-[#1C1917] text-sm font-medium rounded-lg border border-[#E7E2DA] hover:border-[#7A0D14] hover:text-[#7A0D14] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    রুটিন
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Live Notices & Weekly Routine Split Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Latest Official Notices */}
          <div className="lg:col-span-6 bg-white border border-[#E7E2DA] rounded-xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
                <div>
                  <p className="text-xs font-semibold text-[#B8862B]">প্রধান শিক্ষকের ঘোষণা</p>
                  <h2 className="text-xl font-bold text-[#1C1917] mt-0.5">সাম্প্রতিক নোটিশ বোর্ড</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('notices')}
                  className="text-sm font-semibold text-[#7A0D14] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  সব নোটিশ দেখুন
                </button>
              </div>

              <div className="divide-y divide-[#F0EBE3] mt-2">
                {topNotices.map((notice) => (
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
                    <h3 className="text-[16px] font-semibold text-[#1C1917] leading-snug">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-[#57534E] line-clamp-2 leading-relaxed">
                      {notice.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Class Routine Snapshot */}
          <div className="lg:col-span-6 bg-white border border-[#E7E2DA] rounded-xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
                <div>
                  <p className="text-xs font-semibold text-[#B8862B]">সাপ্তাহিক সময়সূচি</p>
                  <h2 className="text-xl font-bold text-[#1C1917] mt-0.5">চলমান ক্লাস রুটিন</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('classes')}
                  className="text-sm font-semibold text-[#7A0D14] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  পূর্ণাঙ্গ রুটিন
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E2DA] text-xs font-semibold text-[#78716C]">
                      <th className="py-2.5 pr-3">শ্রেণি ও বার</th>
                      <th className="py-2.5 px-3">বিষয়</th>
                      <th className="py-2.5 pl-3 text-right">সময় ও কক্ষ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE3] text-sm">
                    {featuredRoutines.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 pr-3 whitespace-nowrap">
                          <p className="font-semibold text-[#1C1917]">{item.classLevel} শ্রেণি</p>
                          <p className="text-xs text-[#78716C]">{item.day}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-[#1C1917]">{item.subject}</p>
                          <p className="text-xs text-[#78716C]">{item.teacherName}</p>
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap tabular-nums">
                          <p className="text-[#1C1917] font-medium">{item.timeSlot}</p>
                          <p className="text-xs text-[#78716C]">{item.room}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty & Digital Management Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="bg-[#F4F0E8] border border-[#E7E2DA] rounded-2xl p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-sm font-semibold text-[#B8862B]">ডিজিটাল শিক্ষা ব্যবস্থাপনা</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                শিক্ষার্থী, অভিভাবক ও শিক্ষকদের জন্য একক সমন্বিত পোর্টাল
              </h2>
              <p className="text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
                ভর্তি থেকে শুরু করে ক্লাস রুটিন, নোটিশ এবং ফি পরিশোধের প্রতিটি ধাপ সুরক্ষিত
                ক্লাউড ডাটাবেজে সংরক্ষিত থাকে।
              </p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-5 space-y-2">
                <CreditCard className="w-5 h-5 text-[#7A0D14]" />
                <h3 className="text-base font-bold text-[#1C1917]">সহজ অনলাইন পেমেন্ট গেটওয়ে</h3>
                <p className="text-sm text-[#57534E]">
                  বিকাশ, নগদ, রকেট বা ডেবিট/ক্রেডিট কার্ডের মাধ্যমে ভর্তি ফি পরিশোধ ও ডিজিটাল
                  মানি রিসিট।
                </p>
              </div>
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-5 space-y-2">
                <Calendar className="w-5 h-5 text-[#7A0D14]" />
                <h3 className="text-base font-bold text-[#1C1917]">লাইভ রুটিন ও নোটিশ প্রকাশ</h3>
                <p className="text-sm text-[#57534E]">
                  প্রধান শিক্ষক ড্যাশবোর্ড থেকে রুটিন ও জরুরি নোটিশ প্রকাশ করলেই তাৎক্ষণিক
                  ওয়েবসাইটে প্রদর্শিত হয়।
                </p>
              </div>
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-5 space-y-2">
                <Users className="w-5 h-5 text-[#7A0D14]" />
                <h3 className="text-base font-bold text-[#1C1917]">শিক্ষার্থী পোর্টাল ও রোল যাচাই</h3>
                <p className="text-sm text-[#57534E]">
                  রোল নম্বর বা অভিভাবকের মোবাইল নম্বর দিয়ে ক্লাসের তথ্য, ব্যাচ শিফট ও পেমেন্ট
                  অবস্থা দেখা যায়।
                </p>
              </div>
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-5 space-y-2">
                <ShieldCheck className="w-5 h-5 text-[#7A0D14]" />
                <h3 className="text-base font-bold text-[#1C1917]">নিরাপদ ক্লাউড ডাটাবেজ</h3>
                <p className="text-sm text-[#57534E]">
                  সকল শিক্ষার্থীর ভর্তি তথ্য, পেমেন্ট লেজার এবং একাডেমিক রেকর্ড Firebase
                  ডাটাবেজে সংরক্ষিত।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Senior Faculty Strip */}
        <div>
          <div className="mb-6 space-y-1">
            <p className="text-sm font-semibold text-[#B8862B]">আমাদের শিক্ষকমণ্ডলী</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
              অভিজ্ঞ ও বিষয়ভিত্তিক শিক্ষক প্যানেল
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FACULTY_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-[#E7E2DA] rounded-xl p-5 space-y-2"
              >
                <p className="text-xs font-semibold text-[#7A0D14]">{member.roleTitle}</p>
                <h3 className="text-base font-bold text-[#1C1917]">{member.name}</h3>
                <p className="text-sm font-medium text-[#44403C]">{member.subject}</p>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  {member.qualification} · {toBengaliDigits(member.experienceYears)} বছরের অভিজ্ঞতা
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
