import { Capacitor } from '@capacitor/core'

// When running as APK, use the live Vercel URL for API calls
// When running in browser (dev or Vercel), use relative paths
export const API_BASE = Capacitor.isNativePlatform()
  ? 'https://power-puff-boys.vercel.app'
  : ''

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}
