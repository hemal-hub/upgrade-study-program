import { useRef, useState } from 'react';
import {
  Award,
  Check,
  Crown,
  Edit3,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { FacultyFormInput, FacultyMember } from '../../types';
import { toBengaliDigits } from '../../utils/academicLogic';
import {
  facultyToFormInput,
  getFacultyInitials,
  validateFacultyInput,
} from '../../utils/facultyUtils';
import { compressImageFile } from '../../utils/imageUtils';

const EMPTY_FORM: FacultyFormInput = {
  name: '',
  roleTitle: 'সিনিয়র শিক্ষক',
  subject: '',
  qualification: '',
  experienceYears: 5,
  photoUrl: '',
  isPrincipal: false,
  classesTaught: '৯ম, ১০ম ও একাদশ শ্রেণি',
  specialization: '',
  bio: '',
  message: '',
  highlightsText: '',
  consultationTime: 'শনি – বুধ, বিকাল ৪:৩০ – ৬:০০',
};

export function AdminFacultyTab() {
  const { facultyMembers, saveFacultyMember, setPrincipalFaculty, removeFacultyMember } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FacultyFormInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const formCardRef = useRef<HTMLDivElement | null>(null);

  const handleFieldChange = <K extends keyof FacultyFormInput>(
    key: K,
    value: FacultyFormInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (submitError) setSubmitError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 640,
        maxHeight: 800,
        quality: 0.76,
        maxDataUrlChars: 165000,
      });
      handleFieldChange('photoUrl', dataUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'ছবি প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি দিন।',
      );
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleStartEdit = (member: FacultyMember) => {
    setEditingId(member.id);
    setForm(facultyToFormInput(member));
    setFieldErrors({});
    setSubmitError('');
    setUploadError('');
    setConfirmDeleteId(null);
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSubmitError('');
    setUploadError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const validation = validateFacultyInput(form);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const err = await saveFacultyMember(form, editingId ?? undefined);
      if (err) {
        setSubmitError(err);
      } else {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrincipal = async (memberId: string) => {
    setBusyId(memberId);
    try {
      await setPrincipalFaculty(memberId);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async (memberId: string) => {
    setBusyId(memberId);
    try {
      await removeFacultyMember(memberId);
      if (editingId === memberId) {
        handleCancelEdit();
      }
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#B8862B]">শিক্ষক প্যানেল ব্যবস্থাপনা</p>
          <h2 className="text-xl font-bold text-[#1C1917] mt-0.5">
            অভিজ্ঞ ও বিষয়ভিত্তিক শিক্ষক প্যানেল
          </h2>
          <p className="text-xs sm:text-sm text-[#57534E] mt-1">
            এখান থেকে প্রধান শিক্ষক ও বিষয়ভিত্তিক শিক্ষকদের ছবি, নাম, যোগ্যতা, বাণী এবং তথ্য পরিবর্তন বা
            নতুন শিক্ষক যুক্ত করলে সাথে সাথে হোম পেইজে আপডেট হয়ে যাবে।
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-[#78716C]">বর্তমান মোট শিক্ষক</p>
          <p className="text-2xl font-bold text-[#7A0D14] tabular-nums">
            {toBengaliDigits(facultyMembers.length)} জন
          </p>
        </div>
      </div>

      {/* Add / Edit Faculty Form */}
      <section
        ref={formCardRef}
        className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden"
      >
        <div
          className={`px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            editingId
              ? 'bg-[#2A0A0E] text-[#FAF8F5] border-[#4D1920]'
              : 'bg-[#FAF8F5] text-[#1C1917] border-[#E7E2DA]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {editingId ? (
              <Edit3 className="w-4 h-4 text-[#E8C67A]" />
            ) : (
              <Plus className="w-4 h-4 text-[#7A0D14]" />
            )}
            <h3 className="text-base font-bold">
              {editingId ? `শিক্ষকের তথ্য সম্পাদনা: ${form.name || 'প্রোফাইল'}` : 'নতুন শিক্ষক যুক্ত করুন'}
            </h3>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>সম্পাদনা বাতিল</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* Portrait Upload + Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA]">
            <div className="lg:col-span-3 flex flex-col items-center">
              <div className="w-36 aspect-[3/4] rounded-xl overflow-hidden border border-[#D6CFC5] bg-white flex items-center justify-center shadow-xs">
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt={form.name || 'শিক্ষকের ছবি প্রিভিউ'}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#78716C] p-4 text-center">
                    <ImageIcon className="w-7 h-7 mb-2 text-[#B8862B]" />
                    <span className="text-xs font-medium">ছবির প্রিভিউ</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-[#78716C] mt-2 text-center">
                পোর্ট্রেট সাইজ (৩:৪ অনুপাত) সবচেয়ে ভালো দেখায়
              </span>
            </div>

            <div className="lg:col-span-9 space-y-3.5">
              <div>
                <p className="text-sm font-bold text-[#1C1917]">শিক্ষকের ছবি আপলোড বা পরিবর্তন করুন</p>
                <p className="text-xs text-[#57534E] mt-0.5">
                  ডিভাইস থেকে সরাসরি JPG/PNG/WebP ছবি আপলোড করলে তা স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে
                  সংরক্ষিত হবে।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A0D14] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingPhoto ? 'ছবি অপ্টিমাইজ হচ্ছে...' : 'ছবি আপলোড করুন'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="sr-only"
                  />
                </label>

                {form.photoUrl && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('photoUrl', '')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#57534E] bg-white border border-[#D6CFC5] rounded-xl hover:text-[#7A0D14] hover:border-[#7A0D14] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ছবি সরান</span>
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor="faculty-photo-url"
                  className="block text-xs font-semibold text-[#44403C] mb-1"
                >
                  অথবা ছবির সরাসরি লিংক (URL)
                </label>
                <input
                  id="faculty-photo-url"
                  type="text"
                  value={form.photoUrl.startsWith('data:') ? '' : form.photoUrl}
                  onChange={(e) => handleFieldChange('photoUrl', e.target.value)}
                  placeholder={
                    form.photoUrl.startsWith('data:')
                      ? 'আপলোড করা ছবি সংযুক্ত আছে (নতুন লিংক দিতে চাইলে এখানে লিখুন)'
                      : 'https://example.com/teacher-photo.jpg'
                  }
                  className="w-full bg-white border border-[#D6CFC5] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
                />
              </div>

              {uploadError && <p className="text-xs font-medium text-red-700">{uploadError}</p>}
              {fieldErrors.photoUrl && (
                <p className="text-xs font-medium text-red-700">{fieldErrors.photoUrl}</p>
              )}
            </div>
          </div>

          {/* Principal Toggle */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-[#D9A74A]/50 bg-[#FDF9F1] cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrincipal}
              onChange={(e) => handleFieldChange('isPrincipal', e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#7A0D14] cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-[#2A0A0E] flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#B8862B]" />
                <span>প্রধান শিক্ষক হিসেবে নির্ধারণ করুন</span>
              </span>
              <span className="block text-xs text-[#57534E] mt-0.5">
                টিক দিলে এই শিক্ষক হোম পেইজের শীর্ষে গাঢ় মেরুন-গোল্ড প্রিমিয়াম ডিজাইনে প্রধান শিক্ষক হিসেবে
                প্রদর্শিত হবেন।
              </span>
            </div>
          </label>

          {/* Core Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="fac-name" className="block text-xs font-semibold text-[#44403C] mb-1">
                শিক্ষকের পূর্ণ নাম *
              </label>
              <input
                id="fac-name"
                type="text"
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="যেমন: অধ্যক্ষ মোঃ রফিকুল ইসলাম"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="fac-role" className="block text-xs font-semibold text-[#44403C] mb-1">
                পদবি *
              </label>
              <input
                id="fac-role"
                type="text"
                value={form.roleTitle}
                onChange={(e) => handleFieldChange('roleTitle', e.target.value)}
                placeholder="যেমন: প্রধান শিক্ষক ও একাডেমিক পরিচালক"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.roleTitle && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.roleTitle}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="fac-subject"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                পাঠদানকৃত বিষয় *
              </label>
              <input
                id="fac-subject"
                type="text"
                value={form.subject}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                placeholder="যেমন: উচ্চতর গণিত / পদার্থবিজ্ঞান"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.subject && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.subject}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="fac-qualification"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                শিক্ষাগত যোগ্যতা *
              </label>
              <input
                id="fac-qualification"
                type="text"
                value={form.qualification}
                onChange={(e) => handleFieldChange('qualification', e.target.value)}
                placeholder="যেমন: এম.এসসি (গণিত), ঢাকা বিশ্ববিদ্যালয়"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.qualification && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.qualification}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="fac-experience"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                অভিজ্ঞতা (বছর) *
              </label>
              <input
                id="fac-experience"
                type="number"
                min={0}
                max={60}
                value={form.experienceYears}
                onChange={(e) => handleFieldChange('experienceYears', Number(e.target.value))}
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] tabular-nums focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.experienceYears && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.experienceYears}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="fac-classes"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                পাঠদান শ্রেণি *
              </label>
              <input
                id="fac-classes"
                type="text"
                value={form.classesTaught}
                onChange={(e) => handleFieldChange('classesTaught', e.target.value)}
                placeholder="যেমন: ৯ম, ১০ম ও একাদশ শ্রেণি"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.classesTaught && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.classesTaught}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="fac-specialization"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                পাঠদানের বিশেষত্ব (কার্ডে প্রদর্শিত সংক্ষিপ্ত লাইন) *
              </label>
              <input
                id="fac-specialization"
                type="text"
                value={form.specialization}
                onChange={(e) => handleFieldChange('specialization', e.target.value)}
                placeholder="যেমন: ধারণাভিত্তিক পদার্থবিজ্ঞান, গাণিতিক সমস্যা সমাধান ও বোর্ড প্রস্তুতি"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.specialization && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.specialization}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="fac-consultation"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                সাক্ষাৎ ও পরামর্শের সময়
              </label>
              <input
                id="fac-consultation"
                type="text"
                value={form.consultationTime}
                onChange={(e) => handleFieldChange('consultationTime', e.target.value)}
                placeholder="যেমন: শনি – বৃহস্পতি, বিকাল ৪:০০ – ৬:৩০"
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.consultationTime && (
                <p className="text-xs text-red-700 mt-1">{fieldErrors.consultationTime}</p>
              )}
            </div>
          </div>

          {/* Bio, Principal Quote & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fac-bio" className="block text-xs font-semibold text-[#44403C] mb-1">
                বিস্তারিত পরিচিতি ও পাঠদান অভিজ্ঞতা *
              </label>
              <textarea
                id="fac-bio"
                rows={4}
                value={form.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                placeholder="শিক্ষকের পাঠদান পদ্ধতি, অভিজ্ঞতা ও শিক্ষার্থীদের প্রতি যত্নের সংক্ষিপ্ত বিবরণ লিখুন..."
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
              {fieldErrors.bio && <p className="text-xs text-red-700 mt-1">{fieldErrors.bio}</p>}
            </div>

            <div>
              <label
                htmlFor="fac-highlights"
                className="block text-xs font-semibold text-[#44403C] mb-1"
              >
                পাঠদানের বিশেষত্ব ও অর্জন (প্রতি লাইনে ১টি, সর্বোচ্চ ৬টি)
              </label>
              <textarea
                id="fac-highlights"
                rows={4}
                value={form.highlightsText}
                onChange={(e) => handleFieldChange('highlightsText', e.target.value)}
                placeholder={
                  'এসএসসি ও এইচএসসি বোর্ড প্রস্তুতি বিশেষজ্ঞ\nসাপ্তাহিক মডেল টেস্ট ও দুর্বল শিক্ষার্থী কেয়ার\nসহজবোধ্য শিট ও নোট প্রণেতা'
                }
                className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="fac-message"
              className="block text-xs font-semibold text-[#44403C] mb-1"
            >
              প্রধান শিক্ষকের বাণী / শিক্ষার্থীদের উদ্দেশ্যে বার্তা (প্রধান শিক্ষকের কার্ডে কোট হিসেবে
              প্রদর্শিত হবে)
            </label>
            <textarea
              id="fac-message"
              rows={2}
              value={form.message}
              onChange={(e) => handleFieldChange('message', e.target.value)}
              placeholder="শিক্ষার্থীদের উদ্দেশ্যে অনুপ্রেরণামূলক সংক্ষিপ্ত বাণী লিখুন (ঐচ্ছিক)..."
              className="w-full bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#7A0D14]"
            />
            {fieldErrors.message && (
              <p className="text-xs text-red-700 mt-1">{fieldErrors.message}</p>
            )}
          </div>

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
              {submitError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#F0EBE3]">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 text-sm font-semibold text-[#57534E] bg-white border border-[#D6CFC5] rounded-xl hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
            )}
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-bold rounded-xl hover:bg-[#5E090F] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? 'সংরক্ষণ হচ্ছে...'
                  : editingId
                    ? 'পরিবর্তন সংরক্ষণ করুন'
                    : 'শিক্ষক প্যানেলে যুক্ত করুন'}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Current Faculty Directory List */}
      <section className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[#E7E2DA] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1C1917]">বর্তমান শিক্ষক প্যানেল তালিকা</h3>
            <p className="text-xs text-[#78716C]">
              যেকোনো শিক্ষকের ছবি ও তথ্য পরিবর্তন করতে “সম্পাদনা” বাটনে ক্লিক করুন।
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#F0EBE3]">
          {facultyMembers.map((member) => {
            const isEditingThis = editingId === member.id;
            const isBusy = busyId === member.id;
            const isConfirmingDelete = confirmDeleteId === member.id;

            return (
              <div
                key={member.id}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  member.isPrincipal
                    ? 'bg-[#2A0A0E]/[0.04]'
                    : isEditingThis
                      ? 'bg-[#FDF9F1]'
                      : 'hover:bg-[#FAF8F5]/60'
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={`w-16 h-20 rounded-xl overflow-hidden shrink-0 border ${
                      member.isPrincipal
                        ? 'border-[#B8862B] bg-[#2A0A0E]'
                        : 'border-[#E7E2DA] bg-[#F4F0E8]'
                    }`}
                  >
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#7A0D14]">
                        {getFacultyInitials(member.name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {member.isPrincipal && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-[#2A0A0E] text-[#E8C67A] rounded-md">
                          <Crown className="w-3 h-3" />
                          <span>প্রধান শিক্ষক</span>
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#7A0D14]">
                        {member.roleTitle}
                      </span>
                      <span aria-hidden="true" className="text-[#A8A29E] text-xs">
                        ·
                      </span>
                      <span className="text-xs font-medium text-[#57534E]">{member.subject}</span>
                    </div>

                    <h4 className="text-base font-bold text-[#1C1917] leading-snug">
                      {member.name}
                    </h4>

                    <p className="text-xs text-[#57534E]">
                      {member.qualification} · অভিজ্ঞতা {toBengaliDigits(member.experienceYears)}{' '}
                      বছর · {member.classesTaught}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!member.isPrincipal && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetPrincipal(member.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#7A0D14] bg-[#FDF9F1] border border-[#D9A74A]/60 rounded-lg hover:bg-[#2A0A0E] hover:text-[#E8C67A] hover:border-[#2A0A0E] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>প্রধান শিক্ষক করুন</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStartEdit(member)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1C1917] bg-white border border-[#D6CFC5] rounded-lg hover:border-[#7A0D14] hover:text-[#7A0D14] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>সম্পাদনা</span>
                  </button>

                  {isConfirmingDelete ? (
                    <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-semibold text-red-800">মুছবেন?</span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleConfirmDelete(member.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-red-700 text-white rounded-md hover:bg-red-800 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>হ্যাঁ</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs font-semibold text-[#57534E] bg-white border border-[#D6CFC5] rounded-md hover:text-[#1C1917] cursor-pointer"
                      >
                        না
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy || facultyMembers.length <= 1}
                      onClick={() => setConfirmDeleteId(member.id)}
                      title={
                        facultyMembers.length <= 1
                          ? 'প্যানেলে কমপক্ষে একজন শিক্ষক থাকা আবশ্যক'
                          : 'শিক্ষক মুছে ফেলুন'
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
