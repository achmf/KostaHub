// Sengaja TANPA 'use client': Server Component wajib import palette dari sini.
// Jika diimport dari components/KostaUI (file 'use client'), di server nilainya client reference → palette.x = undefined.
export const palette = {
  cream: '#F2EDE0',
  creamSoft: '#FBF8EF',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  mossSoft: '#A5B5A0',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  borderStrong: 'rgba(13,20,15,0.18)',
  rose: '#B5443B',
  amber: '#D9A23C',
  emerald: '#3F7A4E',
  muted: 'rgba(13,20,15,0.6)',
}
