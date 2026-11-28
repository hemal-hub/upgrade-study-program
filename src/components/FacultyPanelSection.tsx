import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Quote,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import type { FacultyMember } from '../types';
import { toBengaliDigits } from '../utils/academicLogic';
import {
  getFacultyInitials,
  getTeacherRoutines,
  getTotalFacultyExperience,
  splitPrincipalAndTeachers,
} from '../utils/facultyUtils';

interface PortraitImageProps {
  src: string;
  alt: string;
  name: string;
  darkSurface?: boolean;
  className?: string;
}

function FacultyPortrait({
  src,
  alt,
  name,
  darkSurface = false,
  className = '',
}: PortraitImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-6 select-none ${
          darkSurface
            ? 'bg-gradient-to-br from-[#3E1016] to-[#1D0609] text-[#E8C67A]'
            : 'bg-gradient-to-br from-[#F4F0E8] to-[#E9E2D5] text-[#7A0D14]'
        }`}
      >
        <span className="text-4xl font-bold tracking-tight">{getFacultyInitials(name)}</span>
        <span
          className={`mt-2 text-xs font-medium text-center ${
            darkSurface ? 'text-[#E5D6CE]' : 'text-[#57534E]'
          }`}
        >
          {name}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function FacultyPanelSection() {
  const { facultyMembers, routines, setActiveView } = useApp();
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);

  const selectedFaculty = selectedFacultyId
    ? (facultyMembers.find((member) => member.id === selectedFacultyId) ?? null)
    : null;

  const { principal, teachers } = splitPrincipalAndTeachers(facultyMembers);
  const totalExperience = getTotalFacultyExperience(facultyMembers);

  useEffect(() => {
    if (!selectedFacultyId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedFacultyId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFacultyId]);

  const selectedRoutines = selectedFaculty
    ? getTeacherRoutines(selectedFaculty.name, routines)
    : [];

  const principalRoutines = principal ? getTeacherRoutines(principal.name, routines) : [];

  const handleOpenRoutinePage = () => {
    setSelectedFacultyId(null);
    setActiveView('classes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="faculty-panel" className="space-y-10">
      {/* Editorial Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E7E2DA]">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-sm font-semibold text-[#B8862B]">
            আমাদের শিক্ষকমণ্ডলী · একাডেমিক পর্ষদ
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] [text-wrap:balance]">
            অভিজ্ঞ ও বিষয়ভিত্তিক শিক্ষক প্যানেল
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-[#57534E] tabular-nums">
          <span className="font-semibold text-[#1C1917]">
            {toBengaliDigits(facultyMembers.length)} জন বিষয়ভিত্তিক শিক্ষক
          </span>
          <span aria-hidden="true">·</span>
          <span>{toBengaliDigits(totalExperience)}+ বছরের সম্মিলিত পাঠদান অভিজ্ঞতা</span>
        </div>
      </div>

      {/* Tier 1: Principal / Head Teacher Distinguished Editorial Monograph */}
      {principal && (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#2A0A0E] text-[#FAF8F5] rounded-2xl overflow-hidden border border-[#4D1920] shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Principal Portrait Column */}
            <div className="lg:col-span-5 relative min-h-[360px] sm:min-h-[430px] lg:min-h-[500px] bg-[#1C0609] overflow-hidden">
              <FacultyPortrait
                src={principal.photoUrl}
                alt={`${principal.name} — ${principal.roleTitle}`}
                name={principal.name}
                darkSurface
                className="w-full h-full object-cover object-top"
              />
              {/* Subtle Gold Architectural Frame Inset */}
              <div
                aria-hidden="true"
                className="absolute inset-4 rounded-xl border border-[#D9A74A]/30 pointer-events-none"
              />
              {/* Measured Bottom Contrast Scrim with Institutional Caption */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#190507]/90 via-[#190507]/45 to-transparent px-6 sm:px-7 pt-14 pb-6">
                <p className="text-xs font-medium text-[#E8C67A] tracking-wide">
                  প্রতিষ্ঠান প্রধান · একাডেমিক নেতৃত্ব
                </p>
                <p className="text-xs text-[#E7DBD3] mt-0.5">{principal.qualification}</p>
              </div>
            </div>

            {/* Principal Editorial Content Column */}
            <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-7">
              <div className="space-y-6">
                {/* Editorial Eyebrow with Gold Hairline Rule */}
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="w-8 h-px bg-[#D9A74A] shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold text-[#E8C67A]">
                    {principal.roleTitle}
                  </p>
                </div>

                {/* Principal Display Name & Discipline */}
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#FAF8F5] leading-tight [text-wrap:balance]">
                    {principal.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[#E5D6CE]">
                    <span className="font-semibold text-[#FAF8F5]">{principal.subject}</span>
                    <span aria-hidden="true" className="text-[#D9A74A]">
                      ·
                    </span>
                    <span>{principal.qualification}</span>
                  </div>
                </div>

                {/* Editorial Pull Quote (Top & Bottom Hairlines, No Thick Left Border) */}
                {principal.message && (
                  <blockquote className="py-5 border-y border-white/15 space-y-2">
                    <Quote className="w-5 h-5 text-[#D9A74A]" aria-hidden="true" />
                    <p className="text-base sm:text-[17px] text-[#FAF8F5]/95 leading-relaxed">
                      “{principal.message}”
                    </p>
                  </blockquote>
                )}

                {/* Concise Biography */}
                <p className="text-sm text-[#E5D6CE]/90 leading-relaxed max-w-2xl">
                  {principal.bio}
                </p>

                {/* Accession-Style 3-Column Hairline Metadata Grid */}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                  <div className="pt-3 border-t border-white/15 space-y-1">
                    <dt className="text-xs text-[#D9A74A]">পাঠদান অভিজ্ঞতা</dt>
                    <dd className="text-lg font-bold text-[#FAF8F5] tabular-nums">
                      {toBengaliDigits(principal.experienceYears)} বছর+
                    </dd>
                  </div>
                  <div className="pt-3 border-t border-white/15 space-y-1">
                    <dt className="text-xs text-[#D9A74A]">পাঠদান শ্রেণি</dt>
                    <dd className="text-sm font-semibold text-[#FAF8F5] leading-snug">
                      {principal.classesTaught}
                    </dd>
                  </div>
                  <div className="pt-3 border-t border-white/15 space-y-1">
                    <dt className="text-xs text-[#D9A74A]">সাক্ষাৎ ও পরামর্শ</dt>
                    <dd className="text-sm font-semibold text-[#FAF8F5] leading-snug">
                      {principal.consultationTime}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Principal Interactive Actions */}
              <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFacultyId(principal.id)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D9A74A] text-[#1C0609] text-sm font-bold rounded-xl hover:bg-[#E7BA63] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8C67A]"
                  >
                    <span>অধ্যক্ষের প্রোফাইল ও ক্লাস</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRoutinePage}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/8 text-[#FAF8F5] text-sm font-semibold rounded-xl border border-white/20 hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Calendar className="w-4 h-4 text-[#E8C67A]" />
                    <span>সাপ্তাহিক রুটিন</span>
                  </button>
                </div>

                {principalRoutines.length > 0 && (
                  <p className="text-xs text-[#E5D6CE] tabular-nums">
                    সপ্তাহে {toBengaliDigits(principalRoutines.length)}টি নির্ধারিত স্পেশাল ক্লাস
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.article>
      )}

      {/* Tier 2: Subject-Specialist Faculty Gallery */}
      {teachers.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-base sm:text-lg font-bold text-[#1C1917] whitespace-nowrap">
              বিষয়ভিত্তিক সিনিয়র শিক্ষক ও সমন্বয়কবৃন্দ
            </h3>
            <span aria-hidden="true" className="h-px flex-1 bg-[#E7E2DA]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
            {teachers.map((member, idx) => {
              const teacherRoutines = getTeacherRoutines(member.name, routines);
              const editorialIndex = toBengaliDigits(String(idx + 1).padStart(2, '0'));

              return (
                <motion.article
                  key={member.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.32,
                    delay: idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#B8862B] transition-colors"
                >
                  <div>
                    {/* Editorial Portrait Frame */}
                    <div className="relative aspect-[4/4.2] bg-[#F4F0E8] overflow-hidden">
                      <FacultyPortrait
                        src={member.photoUrl}
                        alt={`${member.name} — ${member.subject}`}
                        name={member.name}
                        className="w-full h-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pt-12 pb-4 flex items-end justify-between gap-2 text-white">
                        <div className="flex items-center gap-2 text-xs font-medium tabular-nums">
                          <span className="text-[#E8C67A] font-bold">{editorialIndex}</span>
                          <span aria-hidden="true" className="text-white/60">
                            ·
                          </span>
                          <span>{toBengaliDigits(member.experienceYears)} বছরের অভিজ্ঞতা</span>
                        </div>
                        {teacherRoutines.length > 0 && (
                          <span className="text-xs text-white/90 tabular-nums whitespace-nowrap">
                            {toBengaliDigits(teacherRoutines.length)}টি ক্লাস
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teacher Structured Info */}
                    <div className="p-6 space-y-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className="font-semibold text-[#7A0D14]">{member.roleTitle}</span>
                        <span aria-hidden="true" className="text-[#A8A29E]">
                          ·
                        </span>
                        <span className="font-medium text-[#57534E]">{member.subject}</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xl font-bold text-[#1C1917] leading-snug">
                          {member.name}
                        </h4>
                        <p className="text-xs sm:text-sm font-medium text-[#44403C]">
                          {member.qualification}
                        </p>
                      </div>

                      <p className="text-sm text-[#57534E] leading-relaxed line-clamp-2">
                        {member.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 border-t border-[#F0EBE3] bg-[#FCFBF8] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#78716C]">পাঠদান শ্রেণি</p>
                      <p className="text-xs font-semibold text-[#1C1917] truncate">
                        {member.classesTaught}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFacultyId(member.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#7A0D14] bg-white border border-[#E7E2DA] rounded-lg hover:border-[#7A0D14] hover:bg-[#7A0D14] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A0D14]"
                    >
                      <span>বিস্তারিত</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Teacher Profile & Live Class Schedule Modal */}
      <AnimatePresence>
        {selectedFaculty && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSelectedFacultyId(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-white rounded-2xl border border-[#E7E2DA] overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col"
            >
              {/* Modal Top Bar */}
              <div
                className={`px-6 py-4 flex items-center justify-between gap-4 border-b ${
                  selectedFaculty.isPrincipal
                    ? 'bg-[#2A0A0E] text-[#FAF8F5] border-[#4D1920]'
                    : 'bg-[#FAF8F5] text-[#1C1917] border-[#E7E2DA]'
                }`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      selectedFaculty.isPrincipal ? 'text-[#E8C67A]' : 'text-[#B8862B]'
                    }`}
                  >
                    {selectedFaculty.roleTitle}
                  </p>
                  <h3 id="faculty-modal-title" className="text-lg sm:text-xl font-bold truncate">
                    {selectedFaculty.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFacultyId(null)}
                  aria-label="প্রোফাইল বন্ধ করুন"
                  className={`p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    selectedFaculty.isPrincipal
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFEAE2]'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                  {/* Portrait Thumbnail */}
                  <div className="sm:col-span-4 aspect-[3/4] rounded-xl overflow-hidden border border-[#E7E2DA] bg-[#F4F0E8]">
                    <FacultyPortrait
                      src={selectedFaculty.photoUrl}
                      alt={selectedFaculty.name}
                      name={selectedFaculty.name}
                      darkSurface={selectedFaculty.isPrincipal}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* Bio & Credentials */}
                  <div className="sm:col-span-8 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-[#7A0D14]">
                        {selectedFaculty.subject}
                      </p>
                      <p className="text-sm text-[#44403C] flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#B8862B] shrink-0" />
                        <span>{selectedFaculty.qualification}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-[#57534E] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#78716C] shrink-0" />
                        <span>
                          অভিজ্ঞতা: {toBengaliDigits(selectedFaculty.experienceYears)} বছর ·
                          সাক্ষাৎ: {selectedFaculty.consultationTime}
                        </span>
                      </p>
                    </div>

                    <p className="text-sm text-[#44403C] leading-relaxed">{selectedFaculty.bio}</p>

                    {selectedFaculty.highlights.length > 0 && (
                      <div className="pt-3 border-t border-[#F0EBE3] space-y-2">
                        <p className="text-xs font-semibold text-[#78716C]">
                          পাঠদানের বিশেষত্ব ও অর্জন
                        </p>
                        <ul className="space-y-1.5 text-sm text-[#1C1917]">
                          {selectedFaculty.highlights.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span
                                aria-hidden="true"
                                className="text-xs font-bold text-[#B8862B] mt-0.5 tabular-nums"
                              >
                                {toBengaliDigits(String(idx + 1).padStart(2, '0'))}.
                              </span>
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Scheduled Classes for this Teacher */}
                <div className="pt-5 border-t border-[#E7E2DA] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#7A0D14]" />
                      <span>নির্ধারিত সাপ্তাহিক ক্লাসসমূহ</span>
                    </h4>
                    <span className="text-xs text-[#78716C]">{selectedFaculty.classesTaught}</span>
                  </div>

                  {selectedRoutines.length === 0 ? (
                    <p className="text-sm text-[#57534E] bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4">
                      এই শিক্ষকের জন্য বর্তমানে কোনো সাপ্তাহিক রুটিন যুক্ত নেই। পূর্ণাঙ্গ রুটিন পাতায়
                      সকল ক্লাসের সময়সূচি দেখুন।
                    </p>
                  ) : (
                    <div className="border border-[#E7E2DA] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-xs font-semibold text-[#78716C]">
                              <th className="py-2.5 px-4">শ্রেণি ও বার</th>
                              <th className="py-2.5 px-4">বিষয়</th>
                              <th className="py-2.5 px-4 text-right">সময় ও কক্ষ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0EBE3] text-sm">
                            {selectedRoutines.map((rt) => (
                              <tr key={rt.id} className="hover:bg-[#FAF8F5]/60">
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="font-semibold text-[#1C1917]">
                                    {rt.classLevel} শ্রেণি
                                  </span>
                                  <span className="text-xs text-[#78716C] block">{rt.day}</span>
                                </td>
                                <td className="py-2.5 px-4 text-[#1C1917]">{rt.subject}</td>
                                <td className="py-2.5 px-4 text-right whitespace-nowrap tabular-nums">
                                  <span className="font-medium text-[#1C1917]">{rt.timeSlot}</span>
                                  <span className="text-xs text-[#78716C] block">{rt.room}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E7E2DA] flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFacultyId(null)}
                  className="px-4 py-2 text-sm font-medium text-[#57534E] bg-white border border-[#D6CFC5] rounded-xl hover:text-[#1C1917] transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={handleOpenRoutinePage}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>পূর্ণাঙ্গ ক্লাস রুটিন দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
