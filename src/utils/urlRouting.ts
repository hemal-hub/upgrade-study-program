import type { AppView } from '../types';

export const ADMIN_ROUTE_PATH = '/admin';

function normalizeRouteSegment(rawPath: string): string {
  const cleaned = rawPath.trim().toLowerCase().replace(/^#+/, '').replace(/\/+$/, '');
  if (!cleaned) return '/';
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

export function parseAppViewFromLocation(pathname: string, hash = ''): AppView {
  const normalizedHash = hash ? normalizeRouteSegment(hash) : '';
  const candidate =
    normalizedHash && normalizedHash !== '/'
      ? normalizedHash
      : normalizeRouteSegment(pathname);

  if (candidate === '/admin' || candidate.startsWith('/admin/')) {
    return 'dashboard';
  }
  if (candidate === '/student' || candidate.startsWith('/student/') || candidate === '/results') {
    return 'student';
  }
  if (candidate === '/classes' || candidate.startsWith('/classes/')) {
    return 'classes';
  }
  if (candidate === '/notices' || candidate.startsWith('/notices/')) {
    return 'notices';
  }
  if (candidate === '/admission' || candidate.startsWith('/admission/')) {
    return 'admission';
  }
  return 'home';
}

export function getPathForAppView(view: AppView): string {
  switch (view) {
    case 'dashboard':
      return ADMIN_ROUTE_PATH;
    case 'student':
    case 'results':
      return '/student';
    case 'classes':
      return '/classes';
    case 'notices':
      return '/notices';
    case 'admission':
      return '/admission';
    case 'home':
    default:
      return '/';
  }
}

export function isAdminRoute(view: AppView): boolean {
  return view === 'dashboard';
}
