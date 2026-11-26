import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ClassesRoutineView } from './components/ClassesRoutineView';
import { NoticesView } from './components/NoticesView';
import { ResultsView } from './components/ResultsView';
import { AdmissionPaymentView } from './components/AdmissionPaymentView';
import { DashboardView } from './components/DashboardView';
import { Footer } from './components/Footer';

function PortalShell() {
  const { activeView, toast, dismissToast } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />

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
            {activeView === 'results' && <ResultsView />}
            {activeView === 'admission' && <AdmissionPaymentView />}
            {activeView === 'dashboard' && <DashboardView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

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
