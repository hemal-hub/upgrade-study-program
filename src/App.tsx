import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowLeft, Shield, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ClassesRoutineView } from './components/ClassesRoutineView';
import { NoticesView } from './components/NoticesView';
import { StudentPortalView } from './components/StudentPortalView';
import { AdmissionPaymentView } from './components/AdmissionPaymentView';
import { DashboardView } from './components/DashboardView';
import { Footer } from './components/Footer';
import { DEFAULT_LOGO_URL } from './data/seedData';
import { isAdminRoute } from './utils/urlRouting';

function AdminPortalBar() {
  const { siteSettings, setActiveView } = useApp();
  const isDefaultLogo = siteSettings.logoUrl === DEFAULT_LOGO_URL;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E2DA] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={siteSettings.logoUrl || DEFAULT_LOGO_URL}
              alt={`${siteSettings.siteName} লোগো`}
              className={`w-10 h-10 object-contain ${isDefaultLogo ? 'scale-[1.55]' : ''}`}
              referrerPolicy="no-referrer"
            />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#7A0D14] truncate">{siteSettings.siteName}</p>
            <p className="text-xs text-[#57534E] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#B8862B] shrink-0" />
              <span>অ্যাডমিন পোর্টাল · /admin</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] text-[#1C1917] text-xs sm:text-sm font-semibold rounded-lg border border-[#D6CFC5] hover:border-[#7A0D14] hover:text-[#7A0D14] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>মূল ওয়েবসাইটে যান</span>
        </button>
      </div>
    </header>
  );
}

function PortalShell() {
  const { activeView, toast, dismissToast } = useApp();
  const onAdminRoute = isAdminRoute(activeView);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {onAdminRoute ? <AdminPortalBar /> : <Navbar />}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeView === 'home' && <HomeView />}
            {activeView === 'classes' && <ClassesRoutineView />}
            {activeView === 'notices' && <NoticesView />}
            {(activeView === 'student' || activeView === 'results') && <StudentPortalView />}
            {activeView === 'admission' && <AdmissionPaymentView />}
            {activeView === 'dashboard' && <DashboardView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!onAdminRoute && <Footer />}

      {/* Live Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 max-w-md bg-[#1C1917] text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-3 no-print"
          >
            <p className="text-sm leading-snug">{toast.text}</p>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="বার্তা বন্ধ করুন"
              className="p-1 text-white/75 hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppProvider>
          <PortalShell />
        </AppProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
