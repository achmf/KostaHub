import { describe, it, expect } from 'vitest'
import { toggleBaca } from '../notifikasi-baca'

describe('toggleBaca', () => {
  it('menambah user yang belum membaca', () => {
    expect(toggleBaca(['a'], 'b')).toEqual(['a', 'b'])
  })
  it('mencabut user yang sudah membaca tanpa menyentuh user lain', () => {
    expect(toggleBaca(['a', 'b'], 'a')).toEqual(['b'])
  })
})
