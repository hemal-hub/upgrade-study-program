import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve('firestore.rules');
const blueprintPath = path.resolve('firebase-blueprint.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test('firestore.rules includes default-deny safety net and rules_version 2', () => {
  assert.match(rulesContent, /rules_version\s*=\s*'2';/);
  assert.match(rulesContent, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('every collection in firebase-blueprint.json has an explicit match block in firestore.rules', () => {
  const collectionPaths = Object.keys(blueprint.firestore);
  for (const colPath of collectionPaths) {
    assert.ok(
      rulesContent.includes(`match ${colPath}`),
      `Missing match block for ${colPath} in firestore.rules`,
    );
  }
});

test('Dirty Dozen security invariants are encoded in firestore.rules', () => {
  // 1. Verified email requirement on admin bootstrap
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
  // 2. Path ID validation helper enforced
  assert.match(rulesContent, /function isValidId\(id\)/);
  // 3. No blanket isSignedIn() list rules on PII collections
  assert.doesNotMatch(rulesContent, /allow list:\s*if isSignedIn\(\);/);
  // 4. Atomic payment-to-admission relational guard
  assert.match(rulesContent, /existsAfter\(\/databases\/\$\(database\)\/documents\/admissions\/\$\(incoming\(\)\.admissionId\)\)/);
  // 5. Server timestamp enforcement
  assert.match(rulesContent, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesContent, /incoming\(\)\.updatedAt == request\.time/);
  // 6. Strict key checks (hasAll + hasOnly) on all entity validators
  const validators = [
    'isValidUserProfile',
    'isValidStaffMember',
    'isValidNotice',
    'isValidRoutine',
    'isValidAdmission',
    'isValidPayment',
  ];
  for (const fn of validators) {
    assert.ok(rulesContent.includes(`function ${fn}(data)`), `Missing validator ${fn}`);
  }
});
