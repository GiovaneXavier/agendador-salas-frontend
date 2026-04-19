/**
 * Deriva o nome completo a partir do username no formato nome.sobrenome.
 * Fallback local — será substituído pela API de colaboradores.
 */
export function deriveFullName(username: string): string {
  return username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}
