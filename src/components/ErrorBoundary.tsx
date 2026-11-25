import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }

  componentDidCatch(error: Error) {
    console.error('USP Portal ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-6">
          <div className="max-w-md w-full bg-white border border-[#E7E2DA] rounded-xl p-8 text-center">
            <img
              src="/assets/aistudio/image_563094c6.svg"
              alt="আপগ্রেড স্টাডি প্রোগ্রাম লোগো"
              className="w-16 h-16 mx-auto mb-4 object-contain"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-bold text-[#1C1917] mb-2">
              সাময়িক কারিগরি ত্রুটি হয়েছে
            </h1>
            <p className="text-sm text-[#57534E] mb-6">
              অনুগ্রহ করে পেজটি রিলোড করুন অথবা পুনরায় চেষ্টা করুন।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-lg hover:bg-[#5E090F] transition-colors cursor-pointer"
            >
              পেজ রিলোড করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
