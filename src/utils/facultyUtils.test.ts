import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FacultyFormInput, FacultyMember, RoutineEntry } from '../types.ts';
import {
  facultyToFormInput,
  getFacultyInitials,
  getTeacherRoutines,
  getTotalFacultyExperience,
  parseHighlightsText,
  sortFacultyMembers,
  splitPrincipalAndTeachers,
  validateFacultyInput,
} from './facultyUtils.ts';

const SAMPLE_FACULTY: FacultyMember[] = [
  {
    id: 'f1',
    name: 'অধ্যক্ষ মোঃ রফিকুল ইসলাম',
    roleTitle: 'প্রধান শিক্ষক ও পরিচালক',
    subject: 'উচ্চতর গণিত',
    qualification: 'এম.এসসি, ঢাকা বিশ্ববিদ্যালয়',
    experienceYears: 14,
    photoUrl: '/src/assets/images/principal.jpg',
    isPrincipal: true,
    classesTaught: '১০ম ও একাদশ',
    specialization: 'উচ্চতর গণিত',
    bio: 'অভিজ্ঞ শিক্ষক',
    highlights: ['বোর্ড প্রস্তুতি'],
    consultationTime: 'বিকাল ৪টা',
    displayOrder: 0,
  },
  {
    id: 'f2',
    name: 'মোঃ কামরুল হাসান',
    roleTitle: 'সিনিয়র শিক্ষক',
    subject: 'পদার্থবিজ্ঞান',
    qualification: 'বুয়েট',
    experienceYears: 9,
    photoUrl: '/src/assets/images/kamrul.jpg',
    classesTaught: '৯ম - একাদশ',
    specialization: 'পদার্থবিজ্ঞান',
    bio: 'সিনিয়র শিক্ষক',
    highlights: ['গাণিতিক পদার্থবিজ্ঞান'],
    consultationTime: 'বিকাল ৫টা',
    displayOrder: 1,
  },
];

const SAMPLE_ROUTINES: RoutineEntry[] = [
  {
    id: 'r1',
    classLevel: '১০ম',
    group: 'বিজ্ঞান',
    day: 'শনিবার',
    timeSlot: 'সকাল ৮:০০ - ৯:৩০',
    subject: 'উচ্চতর গণিত',
    teacherName: 'অধ্যক্ষ মোঃ রফিকুল ইসলাম',
    room: 'কক্ষ-৩০১',
    authorId: 'a1',
  },
  {
    id: 'r2',
    classLevel: '৯ম',
    group: 'বিজ্ঞান',
    day: 'শনিবার',
    timeSlot: 'বিকাল ৩:৩০ - ৪:৪৫',
    subject: 'পদার্থবিজ্ঞান',
    teacherName: 'মোঃ কামরুল হাসান',
    room: 'কক্ষ-২০১',
    authorId: 'a1',
  },
];

describe('sortFacultyMembers', () => {
  it('always places Principal first, then sorts by displayOrder and id', () => {
    const unordered: FacultyMember[] = [
      { ...SAMPLE_FACULTY[1], id: 'fac-3', displayOrder: 2, isPrincipal: false },
      { ...SAMPLE_FACULTY[1], id: 'fac-2', displayOrder: 1, isPrincipal: false },
      { ...SAMPLE_FACULTY[0], id: 'fac-1', displayOrder: 5, isPrincipal: true },
    ];
    const sorted = sortFacultyMembers(unordered);
    assert.deepEqual(
      sorted.map((m) => m.id),
      ['fac-1', 'fac-2', 'fac-3'],
    );
  });
});

describe('splitPrincipalAndTeachers', () => {
  it('separates designated principal from subject teachers cleanly', () => {
    const result = splitPrincipalAndTeachers(SAMPLE_FACULTY);
    assert.equal(result.principal?.id, 'f1');
    assert.equal(result.teachers.length, 1);
    assert.equal(result.teachers[0].id, 'f2');
  });

  it('handles empty list safely', () => {
    assert.deepEqual(splitPrincipalAndTeachers([]), { principal: null, teachers: [] });
  });
});

describe('parseHighlightsText', () => {
  it('strips bullet prefixes, removes empty lines, and caps at 6 items', () => {
    const raw = [
      '• প্রথম অর্জন',
      '  - দ্বিতীয় অর্জন  ',
      '',
      '* তৃতীয় অর্জন',
      '৪র্থ অর্জন',
      '৫ম অর্জন',
      '৬ষ্ঠ অর্জন',
      '৭ম অর্জন (বাদ পড়বে)',
    ].join('\n');
    const parsed = parseHighlightsText(raw);
    assert.equal(parsed.length, 6);
    assert.equal(parsed[0], 'প্রথম অর্জন');
    assert.equal(parsed[1], 'দ্বিতীয় অর্জন');
    assert.equal(parsed[2], 'তৃতীয় অর্জন');
  });
});

describe('facultyToFormInput & validateFacultyInput', () => {
  it('accepts valid faculty input', () => {
    const input = facultyToFormInput(SAMPLE_FACULTY[0]);
    const result = validateFacultyInput(input);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, {});
  });

  it('rejects missing photo, short bio, and out-of-range experience years', () => {
    const badInput: FacultyFormInput = {
      name: 'ক',
      roleTitle: '',
      subject: 'গণিত',
      qualification: 'ঢাবি',
      experienceYears: 75,
      photoUrl: '',
      isPrincipal: false,
      classesTaught: '৯ম',
      specialization: 'গণিত',
      bio: 'কম',
      message: '',
      highlightsText: '',
      consultationTime: '',
    };
    const result = validateFacultyInput(badInput);
    assert.equal(result.valid, false);
    assert.ok(result.errors.name);
    assert.ok(result.errors.roleTitle);
    assert.ok(result.errors.experienceYears);
    assert.ok(result.errors.photoUrl);
    assert.ok(result.errors.bio);
  });
});

describe('getTeacherRoutines', () => {
  it('matches live routines for a given teacher name', () => {
    const matched = getTeacherRoutines('মোঃ কামরুল হাসান', SAMPLE_ROUTINES);
    assert.equal(matched.length, 1);
    assert.equal(matched[0].id, 'r2');
  });
});

describe('getTotalFacultyExperience', () => {
  it('sums experience years across all faculty members', () => {
    assert.equal(getTotalFacultyExperience(SAMPLE_FACULTY), 23);
  });
});

describe('getFacultyInitials', () => {
  it('strips honorific prefixes and returns Bengali initials', () => {
    assert.equal(getFacultyInitials('অধ্যক্ষ মোঃ রফিকুল ইসলাম'), 'মই');
    assert.equal(getFacultyInitials('ফারহানা আক্তার'), 'ফআ');
  });
});
