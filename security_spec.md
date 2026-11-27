# Security Specification — Upgrade Study Program (USP)

## 1. Data Invariants
1. **Identity & Role Integrity**: Users cannot self-assign `principal` or `teacher` roles when creating `/users/{userId}` or modify their own `role` field. Only the bootstrapped Principal (`dark24dark24dark@gmail.com` with `email_verified == true`) or verified principals in `/staff/{uid}` can manage `/staff/{staffId}`.
2. **PII Isolation**: `/users/{userId}`, `/admissions/{admissionId}`, and `/payments/{paymentId}` contain PII (email, phone numbers, guardian details). Only the document owner (`ownerId == request.auth.uid`) or verified staff/principal may read them. List queries strictly enforce `resource.data.ownerId == request.auth.uid || isBootstrapPrincipal()` with zero `get()`/`exists()` calls.
3. **Public Academic Content, Privileged Writes**: `/notices/{noticeId}` and `/routines/{routineId}` are publicly readable so students and parents can inspect class schedules and official notices, while create/update/delete require verified Principal/Teacher privileges.
4. **Payment-to-Admission Consistency**: Creating a `/payments/{paymentId}` document strictly requires `exists(/databases/$(database)/documents/admissions/$(incoming().admissionId))` and `incoming().ownerId == request.auth.uid`.
5. **Terminal State Locking**: Once an admission reaches `rejected` or a payment reaches `verified` or `refunded`, regular users cannot mutate its state; only verified staff/principal can perform administrative overrides.
6. **Temporal & Volumetric Integrity**: Every `createdAt` / `updatedAt` field must match `request.time`. Every string enforces strict `min`/`max` `.size()` bounds matching `firebase-blueprint.json`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Be Rejected)
1. **Role Escalation on Registration**: Creating `/users/u1` with `role: "principal"` as a regular student.
2. **Shadow Field Injection on Admission**: Creating `/admissions/adm1` with an extra `isScholarshipApproved: true` ghost field.
3. **Identity Spoofing on Admission**: Creating `/admissions/adm2` with `ownerId: "victim_uid"` while authenticated as `"attacker_uid"`.
4. **Unverified Admin Email Spoof**: Attempting to post a notice using `email: "dark24dark24dark@gmail.com"` when `email_verified: false`.
5. **ID Poisoning**: Creating `/admissions/<200-char-junk-id>` violating `isValidId()`.
6. **Orphaned Payment Write**: Creating `/payments/pay1` referencing a non-existent `admissionId`.
7. **Self-Verifying Payment on Create**: Creating `/payments/pay2` with `status: "verified"` as a student instead of `"pending"`.
8. **Terminal State Tampering**: Student attempting to update a `status: "verified"` payment back to `"pending"`.
9. **Timestamp Forgery**: Creating a notice with client-forged `createdAt` not equal to `request.time`.
10. **PII Cross-Read**: Student A attempting `get` on Student B's `/admissions/adm_b` containing guardian phone number.
11. **Value Poisoning on Update**: Updating `status` on `/admissions/adm1` to an invalid type (`12345`) or unallowed enum (`"super_approved"`).
12. **Denial-of-Wallet Oversized String**: Creating `/notices/n1` with a 10,000-character `body` exceeding the 2000-char limit.
13. **Delegated Admin Escalation on `/staff_invites`**: A delegated admin attempting to create, update, list, or delete `/staff_invites/{inviteId}` — must be rejected because only `isBootstrapPrincipal()` can manage admin authorizations.
14. **Invite Email Mismatch / Collision Spoof**: An attacker with email `a_b@gmail.com` attempting to read or claim an invite created for `a.b@gmail.com` — blocked by exact `existing().email == request.auth.token.email.lower()` equality check plus `email_verified == true`.
15. **Student Self-Approval / Plaintext Password Injection on `/student_registrations`**: A student attempting to create `/student_registrations/{uid}` with `status: "approved"`, an extra `password` field, or updating their own `status` to `"approved"` — blocked by `hasOnly([...])`, `incoming().status == 'pending'`, and `isStaff()`-only update rule.
16. **Student Registration Username Spoofing**: A student authenticated as `alice@students.usp-academy.edu.bd` attempting to register with `username: "bob"` or listing other students' registrations — blocked by exact `request.auth.token.email.lower() == incoming().username + '@students.usp-academy.edu.bd'` binding and `resource.data.uid == request.auth.uid || isStaff()` list guard.

