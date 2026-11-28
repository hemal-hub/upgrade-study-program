import type { FacultyFormInput, FacultyMember, RoutineEntry } from '../types';

export interface SplitFacultyResult {
  principal: FacultyMember | null;
  teachers: FacultyMember[];
}

export interface FacultyValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Sorts faculty members deterministically: Principal first, then ascending displayOrder, then id.
 */
export function sortFacultyMembers(members: FacultyMember[]): FacultyMember[] {
  return [...members].sort((a, b) => {
    const aPrincipal = a.isPrincipal ? 0 : 1;
    const bPrincipal = b.isPrincipal ? 0 : 1;
    if (aPrincipal !== bPrincipal) return aPrincipal - bPrincipal;

    const aOrder = typeof a.displayOrder === 'number' ? a.displayOrder : 999;
    const bOrder = typeof b.displayOrder === 'number' ? b.displayOrder : 999;
    if (aOrder !== bOrder) return aOrder - bOrder;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Separates the designated Principal (Head Teacher) from the subject-specialist faculty list.
 * Falls back to the first faculty entry if none has isPrincipal=true.
 */
export function splitPrincipalAndTeachers(members: FacultyMember[]): SplitFacultyResult {
  if (members.length === 0) {
    return { principal: null, teachers: [] };
  }
  const sorted = sortFacultyMembers(members);
  const principalIndex = sorted.findIndex((m) => m.isPrincipal);
  const resolvedIndex = principalIndex >= 0 ? principalIndex : 0;
  const principal = sorted[resolvedIndex];
  const teachers = sorted.filter((_, idx) => idx !== resolvedIndex);
  return { principal, teachers };
}

/**
 * Parses multiline highlight text from the admin form into at most 6 bounded items.
 */
export function parseHighlightsText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-–*]+/, '').trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((line) => line.slice(0, 160));
}

/**
 * Converts a FacultyMember record into an editable FacultyFormInput object.
 */
export function facultyToFormInput(member: FacultyMember): FacultyFormInput {
  return {
    name: member.name,
    roleTitle: member.roleTitle,
    subject: member.subject,
    qualification: member.qualification,
    experienceYears: member.experienceYears,
    photoUrl: member.photoUrl,
    isPrincipal: Boolean(member.isPrincipal),
    classesTaught: member.classesTaught,
    specialization: member.specialization,
    bio: member.bio,
    message: member.message ?? '',
    highlightsText: (member.highlights ?? []).join('\n'),
    consultationTime: member.consultationTime ?? '',
  };
}

/**
 * Validates admin FacultyFormInput against Firestore security rule constraints.
 */
export function validateFacultyInput(input: FacultyFormInput): FacultyValidationResult {
  const errors: Record<string, string> = {};

  const name = input.name.trim();
  const roleTitle = input.roleTitle.trim();
  const subject = input.subject.trim();
  const qualification = input.qualification.trim();
  const classesTaught = input.classesTaught.trim();
  const specialization = input.specialization.trim();
  const bio = input.bio.trim();
  const message = input.message.trim();
  const consultationTime = input.consultationTime.trim();
  const photoUrl = input.photoUrl.trim();
  const exp = Number(input.experienceYears);

  if (name.length < 2 || name.length > 100) {
    errors.name = 'শিক্ষকের নাম ২ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (roleTitle.length < 2 || roleTitle.length > 100) {
    errors.roleTitle = 'পদবি ২ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (subject.length < 2 || subject.length > 100) {
    errors.subject = 'পাঠদানকৃত বিষয় ২ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (qualification.length < 2 || qualification.length > 160) {
    errors.qualification = 'শিক্ষাগত যোগ্যতা ২ থেকে ১৬০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (!Number.isFinite(exp) || exp < 0 || exp > 60) {
    errors.experienceYears = 'অভিজ্ঞতার বছর ০ থেকে ৬০-এর মধ্যে হতে হবে।';
  }
  if (photoUrl.length < 1) {
    errors.photoUrl = 'শিক্ষকের একটি ছবি আপলোড করুন অথবা ছবির লিংক দিন।';
  } else if (photoUrl.length > 180000) {
    errors.photoUrl = 'ছবির আকার বেশি বড় হয়ে গেছে। অনুগ্রহ করে ছোট ছবি আপলোড করুন।';
  }
  if (classesTaught.length < 2 || classesTaught.length > 120) {
    errors.classesTaught = 'পাঠদান শ্রেণি ২ থেকে ১২০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (specialization.length < 2 || specialization.length > 240) {
    errors.specialization = 'বিশেষত্ব ২ থেকে ২৪০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (bio.length < 5 || bio.length > 800) {
    errors.bio = 'সংক্ষিপ্ত পরিচিতি কমপক্ষে ৫ এবং সর্বোচ্চ ৮০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (message.length > 400) {
    errors.message = 'প্রধান শিক্ষকের বাণী সর্বোচ্চ ৪০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (consultationTime.length > 120) {
    errors.consultationTime = 'সাক্ষাতের সময় সর্বোচ্চ ১২০ অক্ষরের মধ্যে হতে হবে।';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Finds all scheduled routine entries belonging to a specific faculty member.
 */
export function getTeacherRoutines(
  teacherName: string,
  routines: RoutineEntry[],
): RoutineEntry[] {
  const normalizedTarget = teacherName.trim().toLowerCase();
  if (!normalizedTarget) return [];
  return routines.filter((entry) => {
    const entryTeacher = entry.teacherName.trim().toLowerCase();
    return entryTeacher === normalizedTarget || entryTeacher.includes(normalizedTarget);
  });
}

/**
 * Calculates total combined teaching experience across all faculty members.
 */
export function getTotalFacultyExperience(members: FacultyMember[]): number {
  return members.reduce((sum, item) => sum + Math.max(0, item.experienceYears || 0), 0);
}

/**
 * Extracts a clean 1–2 character monogram from a teacher's name for image fallback states.
 */
export function getFacultyInitials(name: string): string {
  const cleaned = name
    .replace(/^(অধ্যক্ষ|ড\.|মোঃ|মো\.|প্রফেসর)\s+/u, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'শি';
  if (parts.length === 1) return Array.from(parts[0])[0] ?? 'শি';
  const first = Array.from(parts[0])[0] ?? '';
  const second = Array.from(parts[parts.length - 1])[0] ?? '';
  return `${first}${second}`;
}
