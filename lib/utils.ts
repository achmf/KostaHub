import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// shortcut: flag statis, fitur RFID/NFC belum masuk lingkup skripsi
export const FITUR_RFID = false

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escape data user sebelum disisipkan ke string HTML mentah (mis. popup peta via dangerouslySetInnerHTML). */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])
}
