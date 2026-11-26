import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  BOOTSTRAP_PRINCIPAL_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from './config';
import type {
  AdmissionRecord,
  AdmissionStatus,
  CustomSection,
  NoticeItem,
  PaymentRecord,
  PaymentStatus,
  ProofItem,
  RoutineEntry,
  SiteSettings,
  StudentResult,
  TransactionStatus,
  UserRole,
} from '../types';
import { DEFAULT_SITE_SETTINGS } from '../data/seedData';
import { sanitizeText } from '../utils/academicLogic';
import { createStudentAvatarSvg } from '../utils/imageUtils';

function formatTimestamp(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return new Date().toISOString();
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export async function ensureUserProfile(user: User): Promise<UserRole> {
  const userRef = doc(db, 'users', user.uid);
  const isBootstrapPrincipal =
    user.emailVerified && user.email === BOOTSTRAP_PRINCIPAL_EMAIL;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const initialRole: UserRole = isBootstrapPrincipal ? 'principal' : 'student';
      await setDoc(userRef, {
        uid: user.uid,
        displayName: sanitizeText(user.displayName || 'ইউএসপি সদস্য', 100),
        email: (user.email || 'user@usp.edu.bd').slice(0, 150),
        role: initialRole,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  if (isBootstrapPrincipal) {
    return 'principal';
  }

  try {
    const staffSnap = await getDoc(doc(db, 'staff', user.uid));
    if (staffSnap.exists()) {
      const staffRole = staffSnap.data().role;
      if (staffRole === 'principal' || staffRole === 'teacher') {
        return staffRole;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `staff/${user.uid}`);
  }

  return 'student';
}

export function subscribePublicSiteSettings(
  onData: (settings: SiteSettings) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'site_settings/main';
  return onSnapshot(
    doc(db, 'site_settings', 'main'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_SITE_SETTINGS);
        return;
      }
      const data = snap.data();
      const vis = (data.sectionVisibility ?? {}) as Partial<SiteSettings['sectionVisibility']>;
      const rawProof = Array.isArray(data.proofItems) ? data.proofItems : [];
      const proofItems: ProofItem[] =
        rawProof.length > 0
          ? rawProof.slice(0, 4).map((p: Record<string, unknown>) => ({
              value: String(p?.value ?? ''),
              label: String(p?.label ?? ''),
            }))
          : DEFAULT_SITE_SETTINGS.proofItems;

      const rawCustom = Array.isArray(data.customSections) ? data.customSections : [];
      const customSections: CustomSection[] = rawCustom
        .slice(0, 12)
        .map((s: Record<string, unknown>, idx: number) => ({
          id: String(s?.id ?? `sec_${idx}`),
          title: String(s?.title ?? ''),
          subtitle: String(s?.subtitle ?? ''),
          body: String(s?.body ?? ''),
          imageUrl: String(s?.imageUrl ?? ''),
          ctaLabel: String(s?.ctaLabel ?? ''),
          ctaTarget:
            s?.ctaTarget === 'admission' ||
            s?.ctaTarget === 'classes' ||
            s?.ctaTarget === 'notices' ||
            s?.ctaTarget === 'results'
              ? s.ctaTarget
              : 'none',
          visible: s?.visible !== false,
        }));

      onData({
        siteName: String(data.siteName || DEFAULT_SITE_SETTINGS.siteName),
        siteTagline: String(data.siteTagline || DEFAULT_SITE_SETTINGS.siteTagline),
        logoUrl: String(data.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl),
        bannerUrl: String(data.bannerUrl || DEFAULT_SITE_SETTINGS.bannerUrl),
        heroKicker: String(data.heroKicker || DEFAULT_SITE_SETTINGS.heroKicker),
        heroTitle: String(data.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle),
        heroSubtitle: String(data.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle),
        primaryCtaText: String(data.primaryCtaText || DEFAULT_SITE_SETTINGS.primaryCtaText),
        secondaryCtaText: String(data.secondaryCtaText || DEFAULT_SITE_SETTINGS.secondaryCtaText),
        proofItems,
        footerDescription: String(
          data.footerDescription || DEFAULT_SITE_SETTINGS.footerDescription,
        ),
        contactAddress: String(data.contactAddress || DEFAULT_SITE_SETTINGS.contactAddress),
        contactPhone: String(data.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone),
        contactEmail: String(data.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail),
        copyrightText: String(data.copyrightText || DEFAULT_SITE_SETTINGS.copyrightText),
        sectionVisibility: {
          heroBanner: vis.heroBanner !== false,
          programs: vis.programs !== false,
          noticesAndRoutine: vis.noticesAndRoutine !== false,
          resultsSpotlight: vis.resultsSpotlight !== false,
          features: vis.features !== false,
          faculty: vis.faculty !== false,
          customSections: vis.customSections !== false,
        },
        customSections,
        updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
        updatedAt: data.updatedAt ? formatTimestamp(data.updatedAt) : undefined,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export async function saveSiteSettingsInFirestore(
  settings: SiteSettings,
  updatedByUid: string,
): Promise<void> {
  const path = 'site_settings/main';
  const payload = {
    siteName: sanitizeText(settings.siteName, 100),
    siteTagline: sanitizeText(settings.siteTagline, 160),
    logoUrl: settings.logoUrl.trim().slice(0, 200000),
    bannerUrl: settings.bannerUrl.trim().slice(0, 300000),
    heroKicker: sanitizeText(settings.heroKicker, 160),
    heroTitle: sanitizeText(settings.heroTitle, 220),
    heroSubtitle: settings.heroSubtitle.trim().slice(0, 500),
    primaryCtaText: sanitizeText(settings.primaryCtaText, 60),
    secondaryCtaText: sanitizeText(settings.secondaryCtaText, 60),
    proofItems: settings.proofItems.slice(0, 4).map((p) => ({
      value: sanitizeText(p.value, 60),
      label: sanitizeText(p.label, 120),
    })),
    footerDescription: settings.footerDescription.trim().slice(0, 500),
    contactAddress: sanitizeText(settings.contactAddress, 200),
    contactPhone: sanitizeText(settings.contactPhone, 80),
    contactEmail: sanitizeText(settings.contactEmail, 150),
    copyrightText: sanitizeText(settings.copyrightText, 160),
    sectionVisibility: {
      heroBanner: Boolean(settings.sectionVisibility.heroBanner),
      programs: Boolean(settings.sectionVisibility.programs),
      noticesAndRoutine: Boolean(settings.sectionVisibility.noticesAndRoutine),
      resultsSpotlight: Boolean(settings.sectionVisibility.resultsSpotlight),
      features: Boolean(settings.sectionVisibility.features),
      faculty: Boolean(settings.sectionVisibility.faculty),
      customSections: Boolean(settings.sectionVisibility.customSections),
    },
    customSections: settings.customSections.slice(0, 12).map((sec) => ({
      id: sanitizeText(sec.id, 64),
      title: sanitizeText(sec.title, 120),
      subtitle: sanitizeText(sec.subtitle, 160),
      body: sec.body.trim().slice(0, 1200),
      imageUrl: sec.imageUrl.trim().slice(0, 150000),
      ctaLabel: sanitizeText(sec.ctaLabel, 50),
      ctaTarget: sec.ctaTarget,
      visible: Boolean(sec.visible),
    })),
    updatedBy: updatedByUid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'site_settings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribePublicNotices(
  onData: (notices: NoticeItem[]) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'notices';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: NoticeItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? ''),
          body: String(data.body ?? ''),
          category: data.category,
          targetClass: data.targetClass,
          pinned: Boolean(data.pinned),
          authorId: String(data.authorId ?? ''),
          authorName: String(data.authorName ?? ''),
          publishedDate: String(data.publishedDate ?? ''),
          createdAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export function subscribePublicRoutines(
  onData: (routines: RoutineEntry[]) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'routines';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: RoutineEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          classLevel: data.classLevel,
          group: data.group,
          day: data.day,
          timeSlot: String(data.timeSlot ?? ''),
          subject: String(data.subject ?? ''),
          teacherName: String(data.teacherName ?? ''),
          room: String(data.room ?? ''),
          authorId: String(data.authorId ?? ''),
          createdAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export function subscribePublicResults(
  onData: (results: StudentResult[]) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'results';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: StudentResult[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          admissionId: String(data.admissionId ?? ''),
          studentName: String(data.studentName ?? ''),
          rollNumber: String(data.rollNumber ?? ''),
          studentPhoto: String(data.studentPhoto ?? ''),
          classLevel: data.classLevel,
          group: data.group,
          examName: String(data.examName ?? ''),
          subject: String(data.subject ?? ''),
          fullMarks: Number(data.fullMarks ?? 100),
          obtainedMarks: Number(data.obtainedMarks ?? 0),
          gpa: Number(data.gpa ?? 0),
          grade: data.grade,
          remarks: String(data.remarks ?? ''),
          publishedDate: String(data.publishedDate ?? ''),
          authorId: String(data.authorId ?? ''),
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export async function publishBatchResultsInFirestore(
  items: Array<Omit<StudentResult, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<string[]> {
  const batch = writeBatch(db);
  const ids: string[] = [];

  for (const res of items) {
    const resultId = makeDocId('res');
    ids.push(resultId);
    batch.set(doc(db, 'results', resultId), {
      admissionId: res.admissionId,
      studentName: sanitizeText(res.studentName, 100),
      rollNumber: res.rollNumber,
      studentPhoto: (res.studentPhoto ?? '').slice(0, 180000),
      classLevel: res.classLevel,
      group: res.group,
      examName: sanitizeText(res.examName, 120),
      subject: sanitizeText(res.subject, 100),
      fullMarks: res.fullMarks,
      obtainedMarks: res.obtainedMarks,
      gpa: res.gpa,
      grade: res.grade,
      remarks: sanitizeText(res.remarks, 200),
      publishedDate: sanitizeText(res.publishedDate, 40),
      authorId: res.authorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return ids;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'results');
  }
}

export async function deleteResultInFirestore(resultId: string): Promise<void> {
  const path = `results/${resultId}`;
  try {
    await deleteDoc(doc(db, 'results', resultId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAdmissions(
  user: User,
  isBootstrapPrincipal: boolean,
  onData: (admissions: AdmissionRecord[]) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'admissions';
  const colRef = collection(db, path);
  const q = isBootstrapPrincipal
    ? colRef
    : query(colRef, where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdmissionRecord[] = snapshot.docs.map((d, idx) => {
        const data = d.data();
        const studentName = String(data.studentName ?? '');
        return {
          id: d.id,
          ownerId: String(data.ownerId ?? ''),
          rollNumber: String(data.rollNumber ?? ''),
          studentName,
          fatherName: String(data.fatherName ?? data.guardianName ?? ''),
          motherName: String(data.motherName ?? ''),
          guardianName: String(data.guardianName ?? ''),
          guardianPhone: String(data.guardianPhone ?? ''),
          studentPhone: String(data.studentPhone ?? ''),
          dateOfBirth: String(data.dateOfBirth ?? ''),
          presentAddress: String(data.presentAddress ?? ''),
          permanentAddress: String(data.permanentAddress ?? ''),
          studentPhoto: String(data.studentPhoto || createStudentAvatarSvg(studentName, idx)),
          schoolName: String(data.schoolName ?? ''),
          classLevel: data.classLevel,
          group: data.group,
          batchShift: data.batchShift,
          monthlyFee: Number(data.monthlyFee ?? 0),
          admissionFee: Number(data.admissionFee ?? 0),
          status: data.status,
          paymentStatus: data.paymentStatus,
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export function subscribePayments(
  user: User,
  isBootstrapPrincipal: boolean,
  onData: (payments: PaymentRecord[]) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'payments';
  const colRef = collection(db, path);
  const q = isBootstrapPrincipal
    ? colRef
    : query(colRef, where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PaymentRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          admissionId: String(data.admissionId ?? ''),
          ownerId: String(data.ownerId ?? ''),
          studentName: String(data.studentName ?? ''),
          rollNumber: String(data.rollNumber ?? ''),
          classLevel: data.classLevel,
          amount: Number(data.amount ?? 0),
          method: data.method,
          senderNumber: String(data.senderNumber ?? ''),
          transactionId: String(data.transactionId ?? ''),
          status: data.status,
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export async function createAdmissionAndPaymentInFirestore(
  admission: Omit<AdmissionRecord, 'id' | 'createdAt' | 'updatedAt'>,
  payment: Omit<PaymentRecord, 'id' | 'admissionId' | 'createdAt' | 'updatedAt'>,
): Promise<{ admissionId: string; paymentId: string }> {
  const admissionId = makeDocId('adm');
  const paymentId = makeDocId('pay');
  const batch = writeBatch(db);

  const admissionRef = doc(db, 'admissions', admissionId);
  const paymentRef = doc(db, 'payments', paymentId);

  batch.set(admissionRef, {
    ownerId: admission.ownerId,
    rollNumber: admission.rollNumber,
    studentName: sanitizeText(admission.studentName, 100),
    fatherName: sanitizeText(admission.fatherName, 100),
    motherName: sanitizeText(admission.motherName, 100),
    guardianName: sanitizeText(admission.guardianName, 100),
    guardianPhone: admission.guardianPhone.trim(),
    studentPhone: admission.studentPhone.trim().slice(0, 15),
    dateOfBirth: admission.dateOfBirth.trim(),
    presentAddress: sanitizeText(admission.presentAddress, 300),
    permanentAddress: sanitizeText(admission.permanentAddress, 300),
    studentPhoto: admission.studentPhoto.slice(0, 180000),
    schoolName: sanitizeText(admission.schoolName, 150),
    classLevel: admission.classLevel,
    group: admission.group,
    batchShift: admission.batchShift,
    monthlyFee: admission.monthlyFee,
    admissionFee: admission.admissionFee,
    status: 'pending',
    paymentStatus: 'paid',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(paymentRef, {
    admissionId,
    ownerId: payment.ownerId,
    studentName: sanitizeText(payment.studentName, 100),
    rollNumber: payment.rollNumber,
    classLevel: payment.classLevel,
    amount: payment.amount,
    method: payment.method,
    senderNumber: payment.senderNumber.trim().slice(0, 24),
    transactionId: payment.transactionId.trim().toUpperCase().slice(0, 40),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return { admissionId, paymentId };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admissions/${admissionId}`);
  }
}

export async function createNoticeInFirestore(
  notice: Omit<NoticeItem, 'id' | 'createdAt'>,
): Promise<string> {
  const noticeId = makeDocId('nt');
  const path = `notices/${noticeId}`;
  try {
    await setDoc(doc(db, 'notices', noticeId), {
      title: sanitizeText(notice.title, 180),
      body: notice.body.trim().slice(0, 2000),
      category: notice.category,
      targetClass: notice.targetClass,
      pinned: notice.pinned,
      authorId: notice.authorId,
      authorName: sanitizeText(notice.authorName, 100),
      publishedDate: sanitizeText(notice.publishedDate, 40),
      createdAt: serverTimestamp(),
    });
    return noticeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteNoticeInFirestore(noticeId: string): Promise<void> {
  const path = `notices/${noticeId}`;
  try {
    await deleteDoc(doc(db, 'notices', noticeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createRoutineInFirestore(
  routine: Omit<RoutineEntry, 'id' | 'createdAt'>,
): Promise<string> {
  const routineId = makeDocId('rt');
  const path = `routines/${routineId}`;
  try {
    await setDoc(doc(db, 'routines', routineId), {
      classLevel: routine.classLevel,
      group: routine.group,
      day: routine.day,
      timeSlot: sanitizeText(routine.timeSlot, 60),
      subject: sanitizeText(routine.subject, 80),
      teacherName: sanitizeText(routine.teacherName, 100),
      room: sanitizeText(routine.room, 40),
      authorId: routine.authorId,
      createdAt: serverTimestamp(),
    });
    return routineId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteRoutineInFirestore(routineId: string): Promise<void> {
  const path = `routines/${routineId}`;
  try {
    await deleteDoc(doc(db, 'routines', routineId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateAdmissionStatusInFirestore(
  admissionId: string,
  status: AdmissionStatus,
  paymentStatus?: PaymentStatus,
): Promise<void> {
  const path = `admissions/${admissionId}`;
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (paymentStatus) {
    payload.paymentStatus = paymentStatus;
  }
  try {
    await updateDoc(doc(db, 'admissions', admissionId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updatePaymentStatusInFirestore(
  paymentId: string,
  status: TransactionStatus,
): Promise<void> {
  const path = `payments/${paymentId}`;
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeStaffMembers(
  onData: (
    staff: Array<{
      uid: string;
      name: string;
      role: 'teacher' | 'principal';
      subject: string;
      createdAt?: string;
    }>,
  ) => void,
  onErr?: (err: Error) => void,
): Unsubscribe {
  const path = 'staff';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: String(data.name ?? ''),
          role: (data.role === 'principal' ? 'principal' : 'teacher') as 'teacher' | 'principal',
          subject: String(data.subject ?? ''),
          createdAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onErr?.(wrapped as Error);
      }
    },
  );
}

export async function addStaffMemberInFirestore(staff: {
  uid: string;
  name: string;
  role: 'teacher' | 'principal';
  subject: string;
}): Promise<void> {
  const uid = staff.uid.trim();
  const path = `staff/${uid}`;
  try {
    await setDoc(doc(db, 'staff', uid), {
      uid,
      name: sanitizeText(staff.name, 100),
      role: staff.role,
      subject: sanitizeText(staff.subject, 80),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeStaffMemberInFirestore(uid: string): Promise<void> {
  const path = `staff/${uid}`;
  try {
    await deleteDoc(doc(db, 'staff', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
