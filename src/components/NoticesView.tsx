import { useState } from 'react';
import { Bell, Pin, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import type { NoticeCategory, NoticeItem, NoticeTargetClass } from '../types';
import {
  CLASS_LEVELS,
  filterAndSortNotices,
  NOTICE_CATEGORIES,
  toBengaliDigits,
} from '../utils/academicLogic';

export function NoticesView() {
  const { notices } = useApp();
  const [category, setCategory] = useState<NoticeCategory | 'সকল'>('সকল');
  const [targetClass, setTargetClass] = useState<NoticeTargetClass | 'সকল'>('সকল');
  const [search, setSearch] = useState('');
  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);

  const visibleNotices = filterAndSortNotices(notices, {
    category,
    targetClass,
    search,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="space-y-2 max-w-3xl">
        <p className="text-sm font-semibold text-[#B8862B]">প্রাতিষ্ঠানিক ঘোষণা</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917]">নোটিশ বোর্ড</h1>
        <p className="text-[15px] text-[#57534E]">
          পরীক্ষার সময়সূচি, ভর্তি বিজ্ঞপ্তি, ছুটি এবং বিশেষ ক্লাসের সকল হালনাগাদ ঘোষণা এখানে
          সংরক্ষিত থাকে।
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="bg-white border border-[#E7E2DA] rounded-2xl p-14 text-center space-y-3">
          <span className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6 text-[#78716C]" />
          </span>
          <p className="text-lg font-bold text-[#1C1917]">এখনো কোন নোটিশ পাবলিশ হয়নি</p>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            প্রধান শিক্ষক বা অনুমোদিত শিক্ষক ড্যাশবোর্ড থেকে নতুন নোটিশ প্রকাশ করলে সেটি সাথে সাথেই
            এখানে প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <>
          {/* Filter & Search Toolbar */}
          <div className="bg-white border border-[#E7E2DA] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="নোটিশ ধরন">
              <button
                type="button"
                onClick={() => setCategory('সকল')}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === 'সকল'
                    ? 'bg-[#7A0D14] text-white'
                    : 'bg-[#FAF8F5] text-[#44403C] hover:bg-[#EFEAE2]'
                }`}
              >
                সকল ({toBengaliDigits(notices.length)})
              </button>
              {NOTICE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    category === cat
                      ? 'bg-[#7A0D14] text-white'
                      : 'bg-[#FAF8F5] text-[#44403C] hover:bg-[#EFEAE2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                aria-label="শ্রেণি অনুযায়ী নোটিশ ফিল্টার"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value as NoticeTargetClass | 'সকল')}
                className="bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              >
                <option value="সকল">সকল শ্রেণি</option>
                {CLASS_LEVELS.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} শ্রেণি
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  aria-label="নোটিশ খুঁজুন"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="নোটিশ খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:border-[#7A0D14]"
                />
              </div>
            </div>
          </div>

          {/* Notices List */}
          {visibleNotices.length === 0 ? (
            <div className="bg-white border border-[#E7E2DA] rounded-xl p-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-[#A8A29E] mx-auto" />
              <p className="text-base font-semibold text-[#1C1917]">
                এই ফিল্টারে কোনো নোটিশ খুঁজে পাওয়া যায়নি
              </p>
              <p className="text-sm text-[#57534E]">
                ফিল্টার পরিবর্তন করুন অথবা অন্য কীওয়ার্ড দিয়ে অনুসন্ধান করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleNotices.map((notice) => (
                <article
                  key={notice.id}
                  className="bg-white border border-[#E7E2DA] rounded-xl p-6 hover:border-[#C9932C] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-4xl">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#78716C]">
                        <span className="font-semibold text-[#7A0D14]">{notice.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{notice.targetClass}</span>
                        <span aria-hidden="true">·</span>
                        <span>{notice.publishedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>প্রকাশক: {notice.authorName}</span>
                        {notice.pinned && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#B8862B]">
                              <Pin className="w-3 h-3" /> পিন করা জরুরি নোটিশ
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#1C1917]">
                        {notice.title}
                      </h2>
                      <p className="text-sm sm:text-[15px] text-[#44403C] leading-relaxed">
                        {notice.body}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveNotice(notice)}
                      className="self-start px-4 py-2 text-sm font-semibold text-[#7A0D14] bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg hover:border-[#7A0D14] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      বিস্তারিত পড়ুন
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Full Notice Reader Dialog */}
      <AnimatePresence>
        {activeNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
            onClick={() => setActiveNotice(null)}
          >
            <motion.dialog
              open
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              aria-labelledby="notice-modal-title"
              className="relative max-w-2xl w-full bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 shadow-xl m-0"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#78716C]">
                    <span className="font-semibold text-[#7A0D14]">{activeNotice.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeNotice.targetClass}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeNotice.publishedDate}</span>
                  </div>
                  <h2 id="notice-modal-title" className="text-xl font-bold text-[#1C1917]">
                    {activeNotice.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNotice(null)}
                  aria-label="নোটিশ ডায়ালগ বন্ধ করুন"
                  className="p-2 rounded-lg text-[#57534E] hover:bg-[#F4F0E8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 text-[15px] text-[#292524] leading-relaxed whitespace-pre-line">
                {activeNotice.body}
              </div>

              <div className="pt-4 border-t border-[#E7E2DA] flex items-center justify-between text-sm text-[#57534E]">
                <span>আদেশক্রমে: {activeNotice.authorName}</span>
                <button
                  type="button"
                  onClick={() => setActiveNotice(null)}
                  className="px-4 py-2 bg-[#7A0D14] text-white font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
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
