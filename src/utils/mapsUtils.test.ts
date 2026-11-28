import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCampusSearchQueries,
  buildExternalGoogleMapsUrl,
  formatRouteDistanceBn,
  formatRouteDurationBn,
  isMapsQuotaError,
} from './mapsUtils.ts';

describe('buildCampusSearchQueries', () => {
  it('builds full address query plus broader area fallbacks without trailing punctuation', () => {
    const queries = buildCampusSearchQueries('তুতা মিয়ার বিল্ডিং, সেন্টার, মদন, নেত্রকোণা।');
    assert.deepEqual(queries, [
      'তুতা মিয়ার বিল্ডিং, সেন্টার, মদন, নেত্রকোণা, বাংলাদেশ',
      'মদন, নেত্রকোণা, বাংলাদেশ',
      'নেত্রকোণা, বাংলাদেশ',
    ]);
  });

  it('does not duplicate বাংলাদেশ when already present', () => {
    const queries = buildCampusSearchQueries('মদন, নেত্রকোণা, বাংলাদেশ');
    assert.deepEqual(queries, [
      'মদন, নেত্রকোণা, বাংলাদেশ',
      'নেত্রকোণা, বাংলাদেশ',
      'বাংলাদেশ',
    ]);
  });

  it('handles empty address safely', () => {
    assert.deepEqual(buildCampusSearchQueries('   '), ['বাংলাদেশ']);
  });
});

describe('formatRouteDistanceBn', () => {
  it('formats sub-kilometer distance in Bengali meters', () => {
    assert.equal(formatRouteDistanceBn(450), '৪৫০ মিটার');
  });

  it('formats kilometer distance with one decimal when under 10 km', () => {
    assert.equal(formatRouteDistanceBn(3540), '৩.৫ কিমি');
    assert.equal(formatRouteDistanceBn(4000), '৪ কিমি');
  });

  it('rounds kilometer distance at or above 10 km', () => {
    assert.equal(formatRouteDistanceBn(24600), '২৫ কিমি');
  });
});

describe('formatRouteDurationBn', () => {
  it('formats short durations in Bengali minutes', () => {
    assert.equal(formatRouteDurationBn(12 * 60 * 1000), '১২ মিনিট');
  });

  it('formats hour and minute durations in Bengali', () => {
    assert.equal(formatRouteDurationBn(75 * 60 * 1000), '১ ঘণ্টা ১৫ মিনিট');
    assert.equal(formatRouteDurationBn(120 * 60 * 1000), '২ ঘণ্টা');
  });

  it('handles zero or negative durations gracefully', () => {
    assert.equal(formatRouteDurationBn(0), '১ মিনিটের কম');
  });
});

describe('isMapsQuotaError', () => {
  it('detects Google Maps Platform quota and 429 errors', () => {
    assert.equal(isMapsQuotaError(new Error('RESOURCE_EXHAUSTED: Quota exceeded')), true);
    assert.equal(isMapsQuotaError({ status: 'OVER_QUERY_LIMIT' }), true);
    assert.equal(isMapsQuotaError({ code: 429, message: 'Too Many Requests' }), true);
    assert.equal(isMapsQuotaError('OverQuotaMapError'), true);
  });

  it('does not false-positive on zero results or generic network errors', () => {
    assert.equal(isMapsQuotaError(new Error('ZERO_RESULTS')), false);
    assert.equal(isMapsQuotaError(new Error('NetworkError when attempting to fetch')), false);
    assert.equal(isMapsQuotaError(null), false);
  });
});

describe('buildExternalGoogleMapsUrl', () => {
  it('builds search URL when only destination is provided', () => {
    const url = buildExternalGoogleMapsUrl({ lat: 24.68, lng: 90.96 });
    assert.equal(url, 'https://www.google.com/maps/search/?api=1&query=24.68%2C90.96');
  });

  it('builds directions URL when both origin and destination are provided', () => {
    const url = buildExternalGoogleMapsUrl('মদন, নেত্রকোণা', { lat: 24.88, lng: 90.73 });
    assert.ok(url.startsWith('https://www.google.com/maps/dir/?api=1'));
    assert.ok(url.includes('origin=24.88%2C90.73'));
    assert.ok(url.includes('destination='));
  });
});
