import { describe, it, expect } from 'vitest'
import { cekOrangTua } from '../aturan-silsilah'

const anak = { id: 'a', farmId: 'f1', tanggalLahir: new Date('2024-01-01') }
const bapak = { id: 'b', kelamin: 'JANTAN' as const, farmId: 'f1', tanggalLahir: new Date('2022-01-01') }
const induk = { id: 'i', kelamin: 'BETINA' as const, farmId: 'f1', tanggalLahir: new Date('2022-01-01') }

describe('cekOrangTua', () => {
  it('valid -> null', () => expect(cekOrangTua({ anak, bapak, induk })).toBeNull())
  it('tanpa orang tua -> null', () => expect(cekOrangTua({ anak })).toBeNull())
  it('orang tua diri sendiri', () =>
    expect(cekOrangTua({ anak, bapak: { ...bapak, id: 'a' } })).toBe('Hewan tidak bisa menjadi orang tuanya sendiri'))
  it('bapak harus jantan', () =>
    expect(cekOrangTua({ anak, bapak: { ...bapak, kelamin: 'BETINA' } })).toBe('Bapak harus jantan'))
  it('induk harus betina', () =>
    expect(cekOrangTua({ anak, induk: { ...induk, kelamin: 'JANTAN' } })).toBe('Induk harus betina'))
  it('farm sama', () =>
    expect(cekOrangTua({ anak, bapak: { ...bapak, farmId: 'f2' } })).toBe('Orang tua harus dari farm yang sama'))
  it('orang tua lahir lebih dulu', () =>
    expect(cekOrangTua({ anak, induk: { ...induk, tanggalLahir: new Date('2025-01-01') } })).toBe('Orang tua harus lahir lebih dulu'))
  it('silsilah melingkar via bapak', () =>
    expect(cekOrangTua({ anak, bapak, leluhurBapak: new Set(['a']) })).toBe('Silsilah melingkar: hewan ini leluhur dari orang tua yang dipilih'))
  it('silsilah melingkar via induk', () =>
    expect(cekOrangTua({ anak, induk, leluhurInduk: new Set(['a']) })).toBe('Silsilah melingkar: hewan ini leluhur dari orang tua yang dipilih'))
})
