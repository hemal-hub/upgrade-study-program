import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_ROUTE_PATH,
  getPathForAppView,
  isAdminRoute,
  parseAppViewFromLocation,
} from './urlRouting';

test('parseAppViewFromLocation maps /admin and #/admin to dashboard view', () => {
  assert.equal(parseAppViewFromLocation('/admin'), 'dashboard');
  assert.equal(parseAppViewFromLocation('/admin/'), 'dashboard');
  assert.equal(parseAppViewFromLocation('/ADMIN/settings'), 'dashboard');
  assert.equal(parseAppViewFromLocation('/', '#/admin'), 'dashboard');
  assert.equal(parseAppViewFromLocation('/', '#admin'), 'dashboard');
});

test('parseAppViewFromLocation maps public routes accurately and falls back to home', () => {
  assert.equal(parseAppViewFromLocation('/'), 'home');
  assert.equal(parseAppViewFromLocation('/classes'), 'classes');
  assert.equal(parseAppViewFromLocation('/notices'), 'notices');
  assert.equal(parseAppViewFromLocation('/student'), 'student');
  assert.equal(parseAppViewFromLocation('/results'), 'student');
  assert.equal(parseAppViewFromLocation('/admission'), 'admission');
  assert.equal(parseAppViewFromLocation('/unknown-path'), 'home');
});

test('getPathForAppView returns dedicated /admin URL for dashboard and clean public paths', () => {
  assert.equal(getPathForAppView('dashboard'), ADMIN_ROUTE_PATH);
  assert.equal(getPathForAppView('home'), '/');
  assert.equal(getPathForAppView('student'), '/student');
  assert.equal(getPathForAppView('results'), '/student');
  assert.equal(getPathForAppView('classes'), '/classes');
  assert.equal(getPathForAppView('notices'), '/notices');
  assert.equal(getPathForAppView('admission'), '/admission');
  assert.equal(isAdminRoute('dashboard'), true);
  assert.equal(isAdminRoute('home'), false);
});
