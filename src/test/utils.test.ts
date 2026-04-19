import { describe, it, expect } from 'vitest'
import { deriveFullName } from '../lib/utils'

describe('deriveFullName', () => {
  it('capitaliza nome e sobrenome separados por ponto', () => {
    expect(deriveFullName('g.xavier')).toBe('G Xavier')
  })

  it('capitaliza múltiplas partes', () => {
    expect(deriveFullName('time.produto')).toBe('Time Produto')
  })

  it('funciona com nome de uma só parte', () => {
    expect(deriveFullName('admin')).toBe('Admin')
  })

  it('trata nomes comuns corretamente', () => {
    expect(deriveFullName('m.silva')).toBe('M Silva')
    expect(deriveFullName('a.beatriz')).toBe('A Beatriz')
    expect(deriveFullName('l.rocha')).toBe('L Rocha')
  })

  it('preserva o separador como espaço na saída', () => {
    const result = deriveFullName('joao.da.silva')
    expect(result).toBe('Joao Da Silva')
  })

  it('string vazia retorna string vazia', () => {
    expect(deriveFullName('')).toBe('')
  })
})
