import { MapPin, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Footer() {
  const { setActiveView } = useApp();

  const goTo = (view: 'home' | 'classes' | 'notices' | 'admission' | 'dashboard') => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#E7E2DA] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#F0EBE3]">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/image_563094c6.svg"
                  alt="আপগ্রেড স্টাডি প্রোগ্রাম লোগো"
                  className="w-12 h-12 object-contain scale-[1.55]"
                  referrerPolicy="no-referrer"
                />
              </span>
              <div>
                <p className="text-lg font-bold text-[#7A0D14]">আপগ্রেড স্টাডি প্রোগ্রাম (USP)</p>
                <p className="text-xs text-[#78716C]">ক্লাস ৬ষ্ঠ – একাদশ শ্রেণির একাডেমিক কেয়ার</p>
              </div>
            </div>
            <p className="text-sm text-[#57534E] leading-relaxed max-w-md">
              সুশৃঙ্খল পাঠদান, সাপ্তাহিক মূল্যায়ন পরীক্ষা এবং আধুনিক অনলাইন ভর্তি ও ব্যবস্থাপনা
              সুবিধাসহ শিক্ষার্থীদের উজ্জ্বল ভবিষ্যৎ গঠনে প্রতিশ্রুতিবদ্ধ।
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
                <span>বাড়ি ১৪, রোড ০৩, একাডেমিক রোড, ঢাকা-১২০৫</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#7A0D14] shrink-0" />
                <span className="font-mono-tabular">01700-000000 (সকাল ৮টা – রাত ৮টা)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#7A0D14] shrink-0" />
                <span>admission@usp-academy.edu.bd</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#78716C]">
          <p>© ২০২৬ আপগ্রেড স্টাডি প্রোগ্রাম (USP)। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>৬ষ্ঠ – একাদশ শ্রেণির অনলাইন ভর্তি ও একাডেমিক ব্যবস্থাপনা সিস্টেম</p>
        </div>
      </div>
    </footer>
  );
}
