import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { DEFAULT_LOGO_URL } from '../data/seedData';
import type { AppView } from '../types';

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'home', label: 'হোম' },
  { id: 'classes', label: 'ক্লাস ও রুটিন' },
  { id: 'notices', label: 'নোটিশ' },
  { id: 'results', label: 'রেজাল্ট' },
  { id: 'dashboard', label: 'ড্যাশবোর্ড' },
];

export function Navbar() {
  const { activeView, setActiveView, siteSettings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDefaultLogo = siteSettings.logoUrl === DEFAULT_LOGO_URL;

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E2DA] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand lockup (single line, no extra descriptors) */}
        <button
          type="button"
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A0D14] rounded-md"
        >
          <span className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={siteSettings.logoUrl || DEFAULT_LOGO_URL}
              alt={`${siteSettings.siteName} লোগো`}
              className={`w-11 h-11 object-contain ${isDefaultLogo ? 'scale-[1.55]' : ''}`}
              referrerPolicy="no-referrer"
            />
          </span>
          <span className="text-lg font-bold tracking-tight text-[#7A0D14] whitespace-nowrap max-w-[210px] sm:max-w-[260px] truncate">
            {siteSettings.siteName}
          </span>
        </button>

        {/* Zone 2: Clean single-line text nav links (5 concise items) */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-[15px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A0D14] ${
                  isActive
                    ? 'text-[#7A0D14] font-semibold'
                    : 'text-[#44403C] hover:text-[#7A0D14]'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-[#7A0D14]"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action + mobile drawer trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavigate('admission')}
            className={`hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A0D14] ${
              activeView === 'admission'
                ? 'bg-[#5E090F] text-white'
                : 'bg-[#7A0D14] text-white hover:bg-[#5E090F]'
            }`}
          >
            ভর্তি হোন
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E7E2DA] text-[#1C1917] hover:bg-[#F4F0E8] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            aria-label="মোবাইল নেভিগেশন"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-[#E7E2DA] bg-white px-4 py-4 space-y-1 shadow-sm"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-[15px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#7A0D14]/8 text-[#7A0D14] font-semibold'
                      : 'text-[#1C1917] hover:bg-[#F4F0E8]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleNavigate('admission')}
                className="w-full py-3 px-4 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
              >
                অনলাইনে ভর্তি আবেদন করুন
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
