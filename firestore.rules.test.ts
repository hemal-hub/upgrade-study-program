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
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesContent, /function isValidId\(id\)/);
  assert.doesNotMatch(rulesContent, /allow list:\s*if isSignedIn\(\);/);
  assert.match(
    rulesContent,
    /existsAfter\(\/databases\/\$\(database\)\/documents\/admissions\/\$\(incoming\(\)\.admissionId\)\)/,
  );
  assert.match(rulesContent, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesContent, /incoming\(\)\.updatedAt == request\.time/);

  const validators = [
    'isValidUserProfile',
    'isValidStaffMember',
    'isValidStaffInvite',
    'isValidNotice',
    'isValidRoutine',
    'isValidAdmission',
    'isValidPayment',
    'isValidSiteSettings',
    'isValidResult',
  ];
  for (const fn of validators) {
    assert.ok(rulesContent.includes(`function ${fn}(data)`), `Missing validator ${fn}`);
  }
  assert.match(rulesContent, /existing\(\)\.email == request\.auth\.token\.email\.lower\(\)/);
});

