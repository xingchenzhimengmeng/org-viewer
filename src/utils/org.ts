/**
 * Shared helpers for recognizing Org documents and handing files to the viewer.
 */

export const PENDING_ORG_DOCUMENT_KEY = 'pendingOrgDocument';

export interface PendingOrgDocument {
  name: string;
  text: string;
}

export function isOrgFilename(filename: string | undefined): boolean {
  return Boolean(filename && /\.org$/i.test(filename.trim()));
}

export function isOrgUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;

  try {
    const url = new URL(rawUrl);
    return /\.org$/i.test(url.pathname);
  } catch {
    return false;
  }
}
