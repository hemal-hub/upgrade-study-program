import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_BANNER_URL,
  DEFAULT_LOGO_URL,
} from '../../data/seedData';
import type {
  CustomSection,
  CustomSectionCtaTarget,
  SectionVisibility,
  SiteSettings,
} from '../../types';
import {
  validateCustomSectionInput,
  validateSiteSettingsInput,
} from '../../utils/academicLogic';
import { compressImageFile } from '../../utils/imageUtils';

const VISIBILITY_CONTROLS: Array<{
  key: keyof SectionVisibility;
  label: string;
  desc: string;
}> = [
  {
    key: 'heroBanner',
    label: 'হিরো ব্যানার ও পরিচিতি সেকশন',
    desc: 'হোম পেইজের শীর্ষ ব্যানার, শিরোনাম ও ভর্তি বাটন',
  },
  {
    key: 'programs',
    label: 'শ্রেণিভিত্তিক একাডেমিক প্রোগ্রাম (৬ষ্ঠ–একাদশ)',
    desc: 'সকল শ্রেণির প্রোগ্রাম, বিষয় ও ভর্তি ফি কার্ডসমূহ',
  },
  {
    key: 'noticesAndRoutine',
    label: 'নোটিশ বোর্ড ও ক্লাস রুটিন প্রিভিউ',
    desc: 'হোম পেইজের সর্বশেষ নোটিশ ও রুটিন সেকশন',
  },
  {
    key: 'resultsSpotlight',
    label: 'পরীক্ষার রেজাল্ট বোর্ড স্পটলাইট',
    desc: 'প্রকাশিত পরীক্ষার ফলাফল ও মেধাক্রম প্রিভিউ',
  },
  {
    key: 'features',
    label: 'পাঠদান পদ্ধতি ও মূল বৈশিষ্ট্য',
    desc: 'কেন আমাদের প্রতিষ্ঠান সেরা তার বিবরণ',
  },
  {
    key: 'faculty',
    label: 'অভিজ্ঞ শিক্ষকমণ্ডলী সেকশন',
    desc: 'অধ্যক্ষ ও জ্যেষ্ঠ শিক্ষকদের তালিকা',
  },
  {
    key: 'customSections',
    label: 'যুক্ত করা নতুন কাস্টম সেকশনসমূহ',
    desc: 'অ্যাডমিন প্যানেল থেকে যুক্ত করা অতিরিক্ত সেকশন',
  },
];

const CTA_TARGET_OPTIONS: Array<{ value: CustomSectionCtaTarget; label: string }> = [
  { value: 'none', label: 'কোনো বাটন থাকবে না' },
  { value: 'admission', label: 'অনলাইন ভর্তি পেইজে যাবে' },
  { value: 'classes', label: 'ক্লাস ও রুটিন পেইজে যাবে' },
  { value: 'notices', label: 'নোটিশ বোর্ড পেইজে যাবে' },
  { value: 'results', label: 'রেজাল্ট পেইজে যাবে' },
];

export function AdminCmsTab() {
  const { siteSettings, updateSiteSettings } = useApp();

  const [draft, setDraft] = useState<SiteSettings>(siteSettings);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);

  // New Custom Section Form State
  const [newSection, setNewSection] = useState<Omit<CustomSection, 'id'>>({
    title: '',
    subtitle: '',
    body: '',
    imageUrl: '',
    ctaLabel: '',
    ctaTarget: 'none',
    visible: true,
  });
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(siteSettings);
  }, [siteSettings]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.8,
        maxDataUrlChars: 180000,
        preserveTransparency: true,
      });
      setDraft((prev) => ({ ...prev, logoUrl: dataUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'লোগো আপলোড ব্যর্থ হয়েছে।');
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 520,
        quality: 0.72,
        maxDataUrlChars: 260000,
      });
      setDraft((prev) => ({ ...prev, bannerUrl: dataUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'ব্যানার আপলোড ব্যর্থ হয়েছে।');
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadCustomSectionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 450,
        quality: 0.7,
        maxDataUrlChars: 140000,
      });
      setNewSection((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'সেকশন ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      e.target.value = '';
    }
  };

  const handleToggleSectionVisibility = (key: keyof SectionVisibility) => {
    setDraft((prev) => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [key]: !prev.sectionVisibility[key],
      },
    }));
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCustomSectionInput(newSection);
    setSectionErrors(validation.errors);
    if (!validation.valid) return;

    const created: CustomSection = {
      ...newSection,
      id: `sec_${Date.now()}`,
      title: newSection.title.trim(),
      subtitle: newSection.subtitle.trim(),
      body: newSection.body.trim(),
      imageUrl: newSection.imageUrl.trim(),
      ctaLabel: newSection.ctaLabel.trim(),
    };

    setDraft((prev) => ({
      ...prev,
      sectionVisibility: { ...prev.sectionVisibility, customSections: true },
      customSections: [...prev.customSections, created],
    }));

    setNewSection({
      title: '',
      subtitle: '',
      body: '',
      imageUrl: '',
      ctaLabel: '',
      ctaTarget: 'none',
      visible: true,
    });
    setSectionErrors({});
  };

  const handleToggleCustomSection = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      customSections: prev.customSections.map((sec) =>
        sec.id === id ? { ...sec, visible: !sec.visible } : sec,
      ),
    }));
  };

  const handleDeleteCustomSection = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      customSections: prev.customSections.filter((sec) => sec.id !== id),
    }));
  };

  const handleSaveAllSettings = async () => {
    const validation = validateSiteSettingsInput(draft);
    setSaveErrors(validation.errors);
    if (!validation.valid) return;

    setSaving(true);
    try {
      await updateSiteSettings(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Save Bar */}
      <div className="bg-white border border-[#E7E2DA] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1C1917]">
            ওয়েবসাইট কনটেন্ট ও ডিজাইন নিয়ন্ত্রণ (CMS)
          </h2>
          <p className="text-xs text-[#78716C]">
            পাবলিক ওয়েবসাইটের লোগো, ব্যানার, লেখা, যোগাযোগ, সেকশন হাইড/শো এবং নতুন সেকশন এখান
            থেকে সরাসরি পরিবর্তন করুন।
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveAllSettings()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সব পরিবর্তন সংরক্ষণ ও পাবলিশ করুন'}</span>
        </button>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium rounded-xl px-4 py-3"
        >
          {uploadError}
        </div>
      )}

      {/* 1. Logo & Banner Manager */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-[#F0EBE3]">
          <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#7A0D14]" />
            <span>১. লোগো ও হোম ব্যানার পরিবর্তন</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#1C1917]">প্রতিষ্ঠানের লোগো</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white border border-[#D6CFC5] flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={draft.logoUrl}
                  alt="লোগো প্রিভিউ"
                  className={`w-18 h-18 object-contain ${
                    draft.logoUrl === DEFAULT_LOGO_URL ? 'scale-[1.45]' : ''
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7A0D14] text-white text-xs font-semibold rounded-lg hover:bg-[#5E090F] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>নতুন লোগো আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleUploadLogo(e)}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, logoUrl: DEFAULT_LOGO_URL }))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#44403C] bg-white border border-[#D6CFC5] rounded-lg hover:border-[#7A0D14] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ডিফল্ট</span>
                  </button>
                </div>
                <input
                  type="text"
                  aria-label="লোগো ছবির লিংক"
                  value={draft.logoUrl.startsWith('data:') ? '' : draft.logoUrl}
                  onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                  placeholder="অথবা লোগোর সরাসরি URL দিন..."
                  className="w-full px-2.5 py-1.5 bg-white border border-[#D6CFC5] rounded-lg text-xs font-mono-tabular"
                />
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#1C1917]">হোম পেইজ ব্যানার ছবি</p>
            <div className="w-full h-24 rounded-lg bg-white border border-[#D6CFC5] overflow-hidden">
              <img
                src={draft.bannerUrl}
                alt="ব্যানার প্রিভিউ"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7A0D14] text-white text-xs font-semibold rounded-lg hover:bg-[#5E090F] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>নতুন ব্যানার আপলোড</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleUploadBanner(e)}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, bannerUrl: DEFAULT_BANNER_URL }))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#44403C] bg-white border border-[#D6CFC5] rounded-lg hover:border-[#7A0D14] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ডিফল্ট ব্যানার</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Section Visibility (Hide / Show) */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="pb-3 border-b border-[#F0EBE3]">
          <h3 className="text-base font-bold text-[#1C1917]">
            ২. পাবলিক পেইজের সেকশন দেখানো বা হাইড করা
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            যেকোনো সেকশন অস্থায়ীভাবে হাইড করে রাখতে পারেন এবং পরে আবার চালু করতে পারবেন।
          </p>
        </div>

        <div className="divide-y divide-[#F0EBE3]">
          {VISIBILITY_CONTROLS.map((ctrl) => {
            const visible = draft.sectionVisibility[ctrl.key];
            return (
              <div
                key={ctrl.key}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1C1917]">{ctrl.label}</p>
                  <p className="text-xs text-[#78716C]">{ctrl.desc}</p>
                </div>
                <button
                  type="button"
                  aria-pressed={visible}
                  onClick={() => handleToggleSectionVisibility(ctrl.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    visible
                      ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                      : 'bg-[#FAF8F5] text-[#78716C] border-[#D6CFC5]'
                  }`}
                >
                  {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{visible ? 'দৃশ্যমান' : 'হাইড করা'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Public Texts, Hero & Contact Info */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-[#F0EBE3]">
          <h3 className="text-base font-bold text-[#1C1917]">
            ৩. প্রতিষ্ঠানের নাম, হিরো লেখা ও যোগাযোগের তথ্য
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="cms-name" className="block text-xs font-semibold text-[#1C1917]">
              প্রতিষ্ঠানের নাম *
            </label>
            <input
              id="cms-name"
              type="text"
              value={draft.siteName}
              onChange={(e) => {
                setDraft({ ...draft, siteName: e.target.value });
                setSaveErrors((prev) => ({ ...prev, siteName: '' }));
              }}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
            {saveErrors.siteName && (
              <p role="alert" className="text-xs text-[#B91C1C]">
                {saveErrors.siteName}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-tagline" className="block text-xs font-semibold text-[#1C1917]">
              উপ-শিরোনাম (Tagline)
            </label>
            <input
              id="cms-tagline"
              type="text"
              value={draft.siteTagline}
              onChange={(e) => setDraft({ ...draft, siteTagline: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-kicker" className="block text-xs font-semibold text-[#1C1917]">
              হিরো ছোট শিরোনাম (Kicker)
            </label>
            <input
              id="cms-kicker"
              type="text"
              value={draft.heroKicker}
              onChange={(e) => setDraft({ ...draft, heroKicker: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-title" className="block text-xs font-semibold text-[#1C1917]">
              হিরো মূল শিরোনাম *
            </label>
            <input
              id="cms-title"
              type="text"
              value={draft.heroTitle}
              onChange={(e) => {
                setDraft({ ...draft, heroTitle: e.target.value });
                setSaveErrors((prev) => ({ ...prev, heroTitle: '' }));
              }}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
            {saveErrors.heroTitle && (
              <p role="alert" className="text-xs text-[#B91C1C]">
                {saveErrors.heroTitle}
              </p>
            )}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="cms-subtitle" className="block text-xs font-semibold text-[#1C1917]">
              হিরো বিস্তারিত বর্ণনা
            </label>
            <textarea
              id="cms-subtitle"
              rows={2}
              value={draft.heroSubtitle}
              onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-cta1" className="block text-xs font-semibold text-[#1C1917]">
              প্রথম বাটনের লেখা
            </label>
            <input
              id="cms-cta1"
              type="text"
              value={draft.primaryCtaText}
              onChange={(e) => setDraft({ ...draft, primaryCtaText: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-cta2" className="block text-xs font-semibold text-[#1C1917]">
              দ্বিতীয় বাটনের লেখা
            </label>
            <input
              id="cms-cta2"
              type="text"
              value={draft.secondaryCtaText}
              onChange={(e) => setDraft({ ...draft, secondaryCtaText: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-phone" className="block text-xs font-semibold text-[#1C1917]">
              যোগাযোগের মোবাইল নম্বর *
            </label>
            <input
              id="cms-phone"
              type="text"
              value={draft.contactPhone}
              onChange={(e) => {
                setDraft({ ...draft, contactPhone: e.target.value });
                setSaveErrors((prev) => ({ ...prev, contactPhone: '' }));
              }}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
            {saveErrors.contactPhone && (
              <p role="alert" className="text-xs text-[#B91C1C]">
                {saveErrors.contactPhone}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="cms-email" className="block text-xs font-semibold text-[#1C1917]">
              যোগাযোগের ইমেইল
            </label>
            <input
              id="cms-email"
              type="email"
              value={draft.contactEmail}
              onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm font-mono-tabular"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="cms-address" className="block text-xs font-semibold text-[#1C1917]">
              ক্যাম্পাসের ঠিকানা
            </label>
            <input
              id="cms-address"
              type="text"
              value={draft.contactAddress}
              onChange={(e) => setDraft({ ...draft, contactAddress: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="cms-footer" className="block text-xs font-semibold text-[#1C1917]">
              ফুটার সংক্ষিপ্ত পরিচিতি
            </label>
            <textarea
              id="cms-footer"
              rows={2}
              value={draft.footerDescription}
              onChange={(e) => setDraft({ ...draft, footerDescription: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
            />
          </div>
        </div>

        {/* 4 Proof Strip Counters */}
        <div className="space-y-2 pt-2 border-t border-[#F0EBE3]">
          <p className="text-xs font-bold text-[#1C1917]">পরিসংখ্যান স্ট্রিপ (৪টি হাইলাইট)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {draft.proofItems.map((item, index) => (
              <div
                key={index}
                className="bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl p-3 space-y-2"
              >
                <input
                  type="text"
                  aria-label={`পরিসংখ্যান মান ${index + 1}`}
                  value={item.value}
                  onChange={(e) => {
                    const next = draft.proofItems.map((p, i) =>
                      i === index ? { ...p, value: e.target.value } : p,
                    );
                    setDraft({ ...draft, proofItems: next });
                  }}
                  placeholder="যেমন: ৯৮%"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#D6CFC5] rounded-lg text-sm font-bold text-[#7A0D14]"
                />
                <input
                  type="text"
                  aria-label={`পরিসংখ্যান বিবরণ ${index + 1}`}
                  value={item.label}
                  onChange={(e) => {
                    const next = draft.proofItems.map((p, i) =>
                      i === index ? { ...p, label: e.target.value } : p,
                    );
                    setDraft({ ...draft, proofItems: next });
                  }}
                  placeholder="বিবরণ"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#D6CFC5] rounded-lg text-xs text-[#44403C]"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Add & Manage Custom Sections */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-[#F0EBE3]">
          <h3 className="text-base font-bold text-[#1C1917]">
            ৪. নতুন কাস্টম সেকশন যুক্ত ও পরিচালনা করুন
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            বৃত্তি ঘোষণা, বিশেষ ব্যাচ, অভিভাবক সমাবেশ বা যেকোনো নতুন সেকশন হোম পেইজে যুক্ত করুন
            অথবা প্রয়োজনে হাইড/মুছে ফেলুন।
          </p>
        </div>

        <form onSubmit={handleAddCustomSection} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="csec-title" className="block text-xs font-semibold text-[#1C1917]">
                নতুন সেকশনের শিরোনাম *
              </label>
              <input
                id="csec-title"
                type="text"
                value={newSection.title}
                onChange={(e) => {
                  setNewSection({ ...newSection, title: e.target.value });
                  setSectionErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="যেমন: মেধাবৃত্তি ও বিশেষ স্কলারশিপ প্রোগ্রাম"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
              />
              {sectionErrors.title && (
                <p role="alert" className="text-xs text-[#B91C1C]">
                  {sectionErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="csec-sub" className="block text-xs font-semibold text-[#1C1917]">
                উপ-শিরোনাম (ঐচ্ছিক)
              </label>
              <input
                id="csec-sub"
                type="text"
                value={newSection.subtitle}
                onChange={(e) => setNewSection({ ...newSection, subtitle: e.target.value })}
                placeholder="যেমন: বিশেষ ঘোষণা"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="csec-body" className="block text-xs font-semibold text-[#1C1917]">
                বিস্তারিত বিবরণ *
              </label>
              <textarea
                id="csec-body"
                rows={3}
                value={newSection.body}
                onChange={(e) => {
                  setNewSection({ ...newSection, body: e.target.value });
                  setSectionErrors((prev) => ({ ...prev, body: '' }));
                }}
                placeholder="সেকশনটির বিস্তারিত তথ্য এখানে লিখুন..."
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
              />
              {sectionErrors.body && (
                <p role="alert" className="text-xs text-[#B91C1C]">
                  {sectionErrors.body}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="csec-cta-label" className="block text-xs font-semibold text-[#1C1917]">
                বাটনের লেখা (ঐচ্ছিক)
              </label>
              <input
                id="csec-cta-label"
                type="text"
                value={newSection.ctaLabel}
                onChange={(e) => setNewSection({ ...newSection, ctaLabel: e.target.value })}
                placeholder="যেমন: এখনই আবেদন করুন"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="csec-cta-target" className="block text-xs font-semibold text-[#1C1917]">
                বাটন ক্লিক করলে কোথায় যাবে
              </label>
              <select
                id="csec-cta-target"
                value={newSection.ctaTarget}
                onChange={(e) =>
                  setNewSection({
                    ...newSection,
                    ctaTarget: e.target.value as CustomSectionCtaTarget,
                  })
                }
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-sm"
              >
                {CTA_TARGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] border border-[#D6CFC5] rounded-lg text-xs font-semibold text-[#44403C] hover:border-[#7A0D14] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>
                {newSection.imageUrl ? 'ছবি যুক্ত হয়েছে (পরিবর্তন করুন)' : 'সেকশনের ছবি যুক্ত করুন (ঐচ্ছিক)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleUploadCustomSectionImage(e)}
                className="sr-only"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1917] text-white text-xs font-semibold rounded-lg hover:bg-[#7A0D14] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>তালিকায় নতুন সেকশন যুক্ত করুন</span>
            </button>
          </div>
        </form>

        {/* Existing Custom Sections List */}
        {draft.customSections.length > 0 && (
          <div className="pt-4 border-t border-[#F0EBE3] space-y-2.5">
            <p className="text-xs font-bold text-[#1C1917]">যুক্ত করা কাস্টম সেকশনসমূহ:</p>
            <div className="divide-y divide-[#F0EBE3] border border-[#E7E2DA] rounded-xl overflow-hidden">
              {draft.customSections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#1C1917]">{sec.title}</p>
                    <p className="text-xs text-[#57534E] line-clamp-1">{sec.body}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCustomSection(sec.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                        sec.visible
                          ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                          : 'bg-white text-[#78716C] border-[#D6CFC5]'
                      }`}
                    >
                      {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{sec.visible ? 'দৃশ্যমান' : 'হাইড'}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${sec.title} সেকশন মুছুন`}
                      onClick={() => handleDeleteCustomSection(sec.id)}
                      className="p-1.5 text-[#78716C] hover:text-[#B91C1C] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[#F0EBE3]">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveAllSettings()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সব পরিবর্তন সংরক্ষণ ও পাবলিশ করুন'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
