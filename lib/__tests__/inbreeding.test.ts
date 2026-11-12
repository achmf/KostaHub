import { describe, it, expect } from 'vitest'
import { leluhurBersama, BATAS_GENERASI } from '../inbreeding-rules'

const m = (o: Record<string, number>) => new Map(Object.entries(o))

describe('leluhurBersama', () => {
  it('batas 4 generasi', () => expect(BATAS_GENERASI).toBe(4))

  it('saudara kandung: kedua orang tua masuk hasil', () => {
    const r = leluhurBersama(m({ bapak: 1, ibu: 1 }), m({ bapak: 1, ibu: 1 }), 'a', 'b')
    expect(r.sort()).toEqual(['bapak', 'ibu'])
  })

  it('pejantan adalah bapak induk', () => {
    expect(leluhurBersama(m({ pj: 1, ibu: 1 }), m({}), 'induk', 'pj')).toEqual(['pj'])
  })

  it('induk adalah leluhur pejantan', () => {
    expect(leluhurBersama(m({}), m({ induk: 2 }), 'induk', 'pj')).toEqual(['induk'])
  })

  it('tidak ada irisan', () => {
    expect(leluhurBersama(m({ x: 1 }), m({ y: 1 }), 'a', 'b')).toEqual([])
  })

  it('percaya peta: leluhur depth 5 sudah dipotong SQL, jadi tidak ada di peta dan tidak dihitung', () => {
    // 'jauh' adalah leluhur depth 5 milik A (dipotong SQL, tidak ada di peta A); B punya di depth 4
    expect(leluhurBersama(m({ x: 1 }), m({ jauh: 4 }), 'a', 'b')).toEqual([])
  })
})
