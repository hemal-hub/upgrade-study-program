import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, UserCog } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  validatePasswordChange,
  validateUsernameChange,
} from '../../utils/academicLogic';

export function AdminAccountSecurityTab() {
  const {
    user,
    isRootAdmin,
    hasPasswordProvider,
    siteSettings,
    updateAdminUsername,
    changeAccountPassword,
  } = useApp();

  // Username form state (Principal only)
  const [usernameDraft, setUsernameDraft] = useState(siteSettings.adminUsername || 'admin');
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Password form state (All verified staff)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordApiError, setPasswordApiError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setUsernameDraft(siteSettings.adminUsername || 'admin');
  }, [siteSettings.adminUsername]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUsernameChange(usernameDraft);
    if (!validation.valid) {
      setUsernameError(validation.errors.username ?? 'সঠিক ইউজারনেম দিন।');
      return;
    }

    setUsernameError('');
    setSavingUsername(true);
    try {
      const apiErr = await updateAdminUsername(usernameDraft.trim());
      if (apiErr) {
        setUsernameError(apiErr);
      }
    } finally {
      setSavingUsername(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordApiError('');
    const validation = validatePasswordChange(
      currentPassword,
      newPassword,
      confirmPassword,
      hasPasswordProvider,
    );
    setPasswordErrors(validation.errors);
    if (!validation.valid) return;

    setSavingPassword(true);
    try {
      const apiErr = await changeAccountPassword(currentPassword, newPassword);
      if (apiErr) {
        setPasswordApiError(apiErr);
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const providerLabels = (user?.providerData ?? []).map((p) =>
    p.providerId === 'google.com'
      ? 'Google অ্যাকাউন্ট'
      : p.providerId === 'password'
        ? 'ইউজারনেম / ইমেইল ও পাসওয়ার্ড'
        : p.providerId,
  );

  return (
    <div className="space-y-6">
      {/* Account Overview Banner */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EBE3]">
          <div>
            <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7A0D14]" />
              <span>লগইন, ইউজারনেম ও পাসওয়ার্ড ব্যবস্থাপনা</span>
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              যেকোনো সময় এখান থেকে আপনার অ্যাডমিন ইউজারনেম এবং পাসওয়ার্ড সেট বা পরিবর্তন করতে
              পারবেন।
            </p>
          </div>
          <span className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-3 py-1.5 w-fit">
            {isRootAdmin ? 'মূল অ্যাডমিন (প্রধান শিক্ষক)' : 'সহকারী অ্যাডমিন (নিজস্ব ইমেইল লগইন)'}
          </span>
        </div>

        <dl
          className={`grid grid-cols-1 ${isRootAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 text-sm`}
        >
          {isRootAdmin && (
            <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-3.5">
              <dt className="text-xs text-[#78716C]">বর্তমান মূল অ্যাডমিন ইউজারনেম</dt>
              <dd className="font-mono-tabular font-bold text-[#7A0D14] mt-1">
                {siteSettings.adminUsername || 'admin'}
              </dd>
            </div>
          )}
          <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-3.5">
            <dt className="text-xs text-[#78716C]">আপনার লগইন ইমেইল</dt>
            <dd className="font-mono-tabular font-semibold text-[#1C1917] mt-1 truncate">
              {user?.email || '—'}
            </dd>
          </div>
          <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl p-3.5">
            <dt className="text-xs text-[#78716C]">সক্রিয় লগইন মাধ্যম</dt>
            <dd className="text-xs font-semibold text-[#1C1917] mt-1">
              {providerLabels.length > 0 ? providerLabels.join(' · ') : 'Google অ্যাকাউন্ট'}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Change Admin Username (Root Admin Only) */}
        {isRootAdmin && (
          <form
            onSubmit={handleUsernameSubmit}
            noValidate
            className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5"
          >
            <div className="pb-3 border-b border-[#F0EBE3] space-y-1">
              <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <UserCog className="w-4 h-4 text-[#7A0D14]" />
                <span>অ্যাডমিন ইউজারনেম পরিবর্তন করুন</span>
              </h3>
              <p className="text-xs text-[#78716C]">
                ইমেইলের বদলে এই শর্ট ইউজারনেম ও পাসওয়ার্ড দিয়ে যেকোনো ডিভাইস থেকে ড্যাশবোর্ডে
                লগইন করতে পারবেন।
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sec-username" className="block text-xs font-semibold text-[#1C1917]">
                নতুন অ্যাডমিন ইউজারনেম *
              </label>
              <input
                id="sec-username"
                type="text"
                autoComplete="username"
                value={usernameDraft}
                onChange={(e) => {
                  setUsernameDraft(e.target.value);
                  setUsernameError('');
                }}
                placeholder="যেমন: usp_principal"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              <p className="text-xs text-[#78716C]">
                ৩–৩২ অক্ষর (ইংরেজি অক্ষর, সংখ্যা, _ অথবা -)। পরিবর্তনের সাথে সাথে পুরনো ইউজারনেম
                বন্ধ হয়ে যাবে।
              </p>
              {usernameError && (
                <p role="alert" className="text-xs font-medium text-[#B91C1C]">
                  {usernameError}
                </p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={savingUsername}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savingUsername ? 'সংরক্ষণ হচ্ছে...' : 'ইউজারনেম আপডেট করুন'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. Set / Change Password */}
        <form
          onSubmit={handlePasswordSubmit}
          noValidate
          className={`bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5 ${
            isRootAdmin ? '' : 'lg:col-span-2 max-w-xl'
          }`}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0EBE3]">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#7A0D14]" />
                <span>
                  {hasPasswordProvider
                    ? 'ড্যাশবোর্ড পাসওয়ার্ড পরিবর্তন করুন'
                    : 'নতুন ড্যাশবোর্ড পাসওয়ার্ড সেট করুন'}
                </span>
              </h3>
              <p className="text-xs text-[#78716C]">
                {hasPasswordProvider
                  ? 'নিরাপত্তার জন্য বর্তমান পাসওয়ার্ড যাচাই করে নতুন পাসওয়ার্ড সংরক্ষণ করা হবে।'
                  : 'আপনার অ্যাকাউন্টে পাসওয়ার্ড যুক্ত করলে Google ছাড়াও ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              aria-label={showPasswords ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
              className="p-2 text-[#57534E] hover:text-[#7A0D14] rounded-lg cursor-pointer shrink-0"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-4">
            {hasPasswordProvider && (
              <div className="space-y-1.5">
                <label
                  htmlFor="sec-current-pass"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  বর্তমান পাসওয়ার্ড *
                </label>
                <input
                  id="sec-current-pass"
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                    setPasswordApiError('');
                  }}
                  placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                />
                {passwordErrors.currentPassword && (
                  <p role="alert" className="text-xs text-[#B91C1C]">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="sec-new-pass" className="block text-xs font-semibold text-[#1C1917]">
                নতুন পাসওয়ার্ড * (কমপক্ষে ৮ অক্ষর)
              </label>
              <input
                id="sec-new-pass"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                  setPasswordApiError('');
                }}
                placeholder="একটি শক্তিশালী পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {passwordErrors.newPassword && (
                <p role="alert" className="text-xs text-[#B91C1C]">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sec-confirm-pass"
                className="block text-xs font-semibold text-[#1C1917]"
              >
                নতুন পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <input
                id="sec-confirm-pass"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  setPasswordApiError('');
                }}
                placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {passwordErrors.confirmPassword && (
                <p role="alert" className="text-xs text-[#B91C1C]">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {passwordApiError && (
            <p role="alert" className="text-xs font-medium text-[#B91C1C]">
              {passwordApiError}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {savingPassword
                  ? 'সংরক্ষণ হচ্ছে...'
                  : hasPasswordProvider
                    ? 'পাসওয়ার্ড পরিবর্তন করুন'
                    : 'পাসওয়ার্ড সেট করুন'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
