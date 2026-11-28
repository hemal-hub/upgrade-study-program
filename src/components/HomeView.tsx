import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  LogIn,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CLASS_PROGRAMS, DEFAULT_BANNER_URL } from '../data/seedData';
import type { AppView } from '../types';
import {
  filterAndSortNotices,
  filterAndSortRoutines,
  formatBdt,
  toBengaliDigits,
} from '../utils/academicLogic';
import { CampusMapSection } from './CampusMapSection';
import { FacultyPanelSection } from './FacultyPanelSection';

export function HomeView() {
  const {
    siteSettings,
    notices,
    routines,
    setActiveView,
    navigateToAdmissionForClass,
    navigateToClassesForLevel,
  } = useApp();

  const vis = siteSettings.sectionVisibility;
  const topNotices = filterAndSortNotices(notices, {}).slice(0, 3);
  const featuredRoutines = filterAndSortRoutines(routines, {}).slice(0, 5);
  const visibleCustomSections = siteSettings.customSections.filter((s) => s.visible);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      {/* Hero Banner Section */}
      {vis.heroBanner && (
        <section className="bg-white border-b border-[#E7E2DA]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-10 sm:pb-14">
            {/* Official Brand Banner (Admin CMS Editable) */}
            <motion.div
              initial={{ opacity: 0.92, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] shadow-sm"
            >
              <img
                src={siteSettings.bannerUrl || DEFAULT_BANNER_URL}
                alt={`${siteSettings.siteName} — একাডেমিক ব্যানার`}
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
                  {siteSettings.heroKicker}
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#1C1917] leading-[1.18]">
                  {siteSettings.heroTitle}
                </h1>
                <p className="text-base sm:text-lg text-[#57534E] max-w-2xl leading-relaxed">
                  {siteSettings.heroSubtitle}
                </p>
              </motion.div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setActiveView('admission')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#7A0D14] text-white text-[15px] font-semibold rounded-xl hover:bg-[#5E090F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A0D14]"
                >
                  <span>{siteSettings.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('student')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-[#7A0D14] text-[15px] font-semibold rounded-xl border border-[#7A0D14] hover:bg-[#7A0D14] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A0D14]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Student Login</span>
                </button>
              </div>
            </div>

            {/* 4-Column Full-Width Institutional Proof Strip */}
            {siteSettings.proofItems.length > 0 && (
              <div className="mt-10 pt-8 border-t border-[#E7E2DA] grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {siteSettings.proofItems.map((item, idx) => (
                  <div key={`${item.value}-${idx}`} className="space-y-1">
                    <p
                      className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                        idx === 0
                          ? 'text-[#7A0D14]'
                          : idx === 3
                            ? 'text-[#B8862B]'
                            : 'text-[#1C1917]'
                      }`}
                    >
                      {item.value}
                    </p>
                    <p className="text-sm text-[#57534E]">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Custom Admin-Created Public Sections */}
      {vis.customSections && visibleCustomSections.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {visibleCustomSections.map((sec) => (
            <section
              key={sec.id}
              className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 lg:p-10"
            >
              <div
                className={`grid grid-cols-1 ${
                  sec.imageUrl ? 'lg:grid-cols-12 gap-8 items-center' : ''
                }`}
              >
                <div className={sec.imageUrl ? 'lg:col-span-7 space-y-3' : 'space-y-3 max-w-4xl'}>
                  {sec.subtitle && (
                    <p className="text-sm font-semibold text-[#B8862B]">{sec.subtitle}</p>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">{sec.title}</h2>
                  <p className="text-sm sm:text-base text-[#57534E] leading-relaxed whitespace-pre-line">
                    {sec.body}
                  </p>
                  {sec.ctaLabel && sec.ctaTarget !== 'none' && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView(sec.ctaTarget as AppView);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer"
                      >
                        <span>{sec.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {sec.imageUrl && (
                  <div className="lg:col-span-5 overflow-hidden rounded-xl border border-[#E7E2DA] bg-[#FAF8F5]">
                    <img
                      src={sec.imageUrl}
                      alt={sec.title}
                      className="w-full h-56 sm:h-64 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Class 6–11 Academic Programs Section */}
      {vis.programs && (
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
      )}

      {/* Live Notices & Weekly Routine Split Section */}
      {vis.noticesAndRoutine && (
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

                {topNotices.length === 0 ? (
                  <div className="py-14 text-center space-y-2.5">
                    <Bell className="w-7 h-7 text-[#A8A29E] mx-auto" />
                    <p className="text-base font-semibold text-[#1C1917]">
                      এখনো কোন নোটিশ পাবলিশ হয়নি
                    </p>
                    <p className="text-xs text-[#78716C]">
                      নতুন নোটিশ প্রকাশ হলে তাৎক্ষণিকভাবে এখানে দেখা যাবে।
                    </p>
                  </div>
                ) : (
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
                )}
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
      )}

      {/* Faculty & Digital Management Highlights */}
      {(vis.features || vis.faculty) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {vis.features && (
            <div className="bg-[#F4F0E8] border border-[#E7E2DA] rounded-2xl p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-3">
                  <p className="text-sm font-semibold text-[#B8862B]">ডিজিটাল শিক্ষা ব্যবস্থাপনা</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    শিক্ষার্থী, অভিভাবক ও শিক্ষকদের জন্য একক সমন্বিত পোর্টাল
                  </h2>
                  <p className="text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
                    ভর্তি থেকে শুরু করে ক্লাস রুটিন, নোটিশ, পরীক্ষার রেজাল্ট এবং ফি পরিশোধের প্রতিটি
                    ধাপ সুরক্ষিত ক্লাউড ডাটাবেজে সংরক্ষিত থাকে।
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
                    <h3 className="text-base font-bold text-[#1C1917]">Student Panel (লগইন পোর্টাল)</h3>
                    <p className="text-sm text-[#57534E]">
                      নিবন্ধিত শিক্ষার্থীরা ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করে নোটিশ বোর্ড,
                      পরীক্ষার রেজাল্ট ও অনলাইন পেমেন্ট পরিচালনা করতে পারে।
                    </p>
                  </div>
                  <div className="bg-white border border-[#E7E2DA] rounded-xl p-5 space-y-2">
                    <ShieldCheck className="w-5 h-5 text-[#7A0D14]" />
                    <h3 className="text-base font-bold text-[#1C1917]">নিরাপদ ক্লাউড ডাটাবেজ</h3>
                    <p className="text-sm text-[#57534E]">
                      সকল শিক্ষার্থীর ভর্তি তথ্য, ছবি, পেমেন্ট লেজার ও ফলাফল Firebase ডাটাবেজে
                      সংরক্ষিত।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Distinguished Faculty Panel (Principal Monograph + Subject-Specialist Gallery) */}
          {vis.faculty && <FacultyPanelSection />}
        </section>
      )}

      {/* Interactive Google Maps Campus Location & Directions */}
      <CampusMapSection />
    </div>
  );
}
