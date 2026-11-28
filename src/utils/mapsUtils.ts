import { toBengaliDigits } from './academicLogic';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

/**
 * Builds ordered live search queries from the campus contact address.
 * Returns primary full address + broader area fallback (last two comma segments)
 * without duplicating identical queries.
 */
export function buildCampusSearchQueries(contactAddress: string): string[] {
  const cleaned = contactAddress
    .replace(/[।.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return ['বাংলাদেশ'];
  }

  const queries: string[] = [];
  const addUnique = (q: string) => {
    const trimmed = q.trim();
    if (trimmed && !queries.includes(trimmed)) {
      queries.push(trimmed);
    }
  };

  addUnique(cleaned.includes('বাংলাদেশ') || /bangladesh/i.test(cleaned) ? cleaned : `${cleaned}, বাংলাদেশ`);

  const segments = cleaned
    .split(/[,،]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    const broadArea = segments.slice(-2).join(', ');
    addUnique(
      broadArea.includes('বাংলাদেশ') || /bangladesh/i.test(broadArea)
        ? broadArea
        : `${broadArea}, বাংলাদেশ`,
    );
  }

  if (segments.length >= 1) {
    const lastSegment = segments[segments.length - 1];
    addUnique(
      lastSegment.includes('বাংলাদেশ') || /bangladesh/i.test(lastSegment)
        ? lastSegment
        : `${lastSegment}, বাংলাদেশ`,
    );
  }

  return queries;
}

/**
 * Formats route distance in meters into clean Bengali display text.
 */
export function formatRouteDistanceBn(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return '০ মিটার';
  }
  if (distanceMeters < 1000) {
    return `${toBengaliDigits(Math.round(distanceMeters))} মিটার`;
  }
  const km = distanceMeters / 1000;
  const formatted = km >= 10 ? Math.round(km).toString() : km.toFixed(1).replace(/\.0$/, '');
  return `${toBengaliDigits(formatted)} কিমি`;
}

/**
 * Formats route duration in milliseconds into clean Bengali display text.
 */
export function formatRouteDurationBn(durationMillis: number): string {
  if (!Number.isFinite(durationMillis) || durationMillis <= 0) {
    return '১ মিনিটের কম';
  }
  const totalMinutes = Math.max(1, Math.round(durationMillis / 60000));
  if (totalMinutes < 60) {
    return `${toBengaliDigits(totalMinutes)} মিনিট`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${toBengaliDigits(hours)} ঘণ্টা`;
  }
  return `${toBengaliDigits(hours)} ঘণ্টা ${toBengaliDigits(mins)} মিনিট`;
}

/**
 * Detects genuine Google Maps Platform quota/rate-limit errors without false-positives
 * on empty search results or generic offline network failures.
 */
export function isMapsQuotaError(error: unknown): boolean {
  if (!error) return false;

  const parts: string[] = [];
  if (typeof error === 'string') {
    parts.push(error);
  } else if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') parts.push(record.message);
    if (typeof record.code === 'string' || typeof record.code === 'number') {
      parts.push(String(record.code));
    }
    if (typeof record.status === 'string' || typeof record.status === 'number') {
      parts.push(String(record.status));
    }
    if (typeof record.name === 'string') parts.push(record.name);
  }

  const combined = parts.join(' ');
  return (
    /OVER_QUERY_LIMIT/i.test(combined) ||
    /RESOURCE_EXHAUSTED/i.test(combined) ||
    /QuotaExceeded/i.test(combined) ||
    /OverQuotaMapError/i.test(combined) ||
    /\b429\b/.test(combined)
  );
}

/**
 * Builds a clean external Google Maps URL for opening a place or directions externally.
 */
export function buildExternalGoogleMapsUrl(
  destination: string | LatLngPoint,
  origin?: string | LatLngPoint | null,
): string {
  const formatPoint = (val: string | LatLngPoint): string => {
    if (typeof val === 'string') return val.trim();
    return `${val.lat},${val.lng}`;
  };

  if (origin) {
    const params = new URLSearchParams({
      api: '1',
      origin: formatPoint(origin),
      destination: formatPoint(destination),
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  const params = new URLSearchParams({
    api: '1',
    query: formatPoint(destination),
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
