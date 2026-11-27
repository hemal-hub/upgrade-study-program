import { MapPin, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_LOGO_URL } from '../data/seedData';
import type { AppView } from '../types';

export function Footer() {
  const { setActiveView, siteSettings } = useApp();
  const isDefaultLogo = siteSettings.logoUrl === DEFAULT_LOGO_URL;

  const goTo = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#E7E2DA] mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#F0EBE3]">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={siteSettings.logoUrl || DEFAULT_LOGO_URL}
                  alt={`${siteSettings.siteName} লোগো`}
                  className={`w-12 h-12 object-contain ${isDefaultLogo ? 'scale-[1.55]' : ''}`}
                  referrerPolicy="no-referrer"
                />
              </span>
              <div>
                <p className="text-lg font-bold text-[#7A0D14]">{siteSettings.siteName}</p>
                <p className="text-xs text-[#78716C]">{siteSettings.siteTagline}</p>
              </div>
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed max-w-md">
              {siteSettings.footerDescription}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h2 className="text-sm font-bold text-[#1C1917]">দ্রুত লিংক</h2>
            <ul className="space-y-2 text-sm text-[#57534E]">
              <li>
                <button
                  type="button"
                  onClick={() => goTo('classes')}
                  className="hover:text-[#7A0D14] transition-colors cursor-pointer"
                >
                  ক্লাস ও সাপ্তাহিক রুটিন
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo('notices')}
                  className="hover:text-[#7A0D14] transition-colors cursor-pointer"
                >
                  অফিসিয়াল নোটিশ বোর্ড
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo('student')}
                  className="hover:text-[#7A0D14] transition-colors cursor-pointer"
                >
                  Student Login (নোটিশ, রেজাল্ট ও পেমেন্ট)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo('admission')}
                  className="hover:text-[#7A0D14] transition-colors cursor-pointer"
                >
                  অনলাইন ভর্তি ও পেমেন্ট
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => goTo('dashboard')}
                  className="hover:text-[#7A0D14] transition-colors cursor-pointer"
                >
                  শিক্ষক ও প্রধান শিক্ষক ড্যাশবোর্ড
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h2 className="text-sm font-bold text-[#1C1917]">ক্যাম্পাস ও যোগাযোগ</h2>
            <ul className="space-y-2.5 text-sm text-[#57534E]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#7A0D14] mt-0.5 shrink-0" />
                <span>{siteSettings.contactAddress}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#7A0D14] shrink-0" />
                <span className="font-mono-tabular">{siteSettings.contactPhone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#7A0D14] shrink-0" />
                <span>{siteSettings.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#78716C]">
          <p>{siteSettings.copyrightText}</p>
          <p>৬ষ্ঠ – একাদশ শ্রেণির অনলাইন ভর্তি ও একাডেমিক ব্যবস্থাপনা সিস্টেম</p>
        </div>
      </div>
    </footer>
  );
}
