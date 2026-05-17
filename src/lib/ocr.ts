import { createWorker, type Worker, type RecognizeResult } from 'tesseract.js'

type OCRData = RecognizeResult['data']

interface FlatWord {
  text: string
  x: number
  y: number
  right: number
  bottom: number
  cx: number
  cy: number
  confidence: number
}

// Worker singleton — Tesseract baixa o modelo (~3MB) na primeira inicialização
// e cacheia em IndexedDB. Inicializações subsequentes são instantâneas.
let workerPromise: Promise<Worker> | null = null

export function getOCRWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('por').then(async (worker) => {
      // Crachá Knox: letras (pra detectar labels como GEN/Matrícula),
      // dígitos, e separadores. Inclui `/` e `-` pra que datas tipo "05/12/2022"
      // mantenham seus separadores e não sejam confundidas com 8 dígitos seguidos.
      await worker.setParameters({
        tessedit_char_whitelist:
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÍíÇç /-',
      })
      return worker
    })
  }
  return workerPromise
}

export function disposeOCRWorker(): void {
  if (workerPromise) {
    workerPromise.then((w) => w.terminate()).catch(() => {})
    workerPromise = null
  }
}

/**
 * Heurística: 8 dígitos no formato DDMMYYYY que representam uma data plausível
 * (dia ≤ 31, mês ≤ 12, ano entre 1900 e 2100).
 * Usado pra rejeitar a "Admissão" do crachá quando lida sem barras.
 */
function isLikelyDate(digits: string): boolean {
  if (digits.length !== 8) return false
  const day = parseInt(digits.slice(0, 2), 10)
  const month = parseInt(digits.slice(2, 4), 10)
  const year = parseInt(digits.slice(4, 8), 10)
  return (
    day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100
  )
}

/** Pega o valor associado a um label, procurando a partir da linha do label. */
function valueNearLabel(lines: string[], labelRegex: RegExp): string | null {
  for (let i = 0; i < lines.length; i++) {
    if (!labelRegex.test(lines[i])) continue

    // Mesma linha: "GEN 22537320" ou "GEN: 22537320"
    const same = lines[i].match(/([0-9]{6,10})\s*$/)
    if (same && !isLikelyDate(same[1])) return same[1]

    // Linhas seguintes (até 3): primeira que seja dígitos puros
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const m = lines[j].match(/^([0-9]{6,10})$/)
      if (m && !isLikelyDate(m[1])) return m[1]
      // Linha com texto entre dígitos quebra a busca (já saiu do bloco do label)
      if (/[A-Za-zÀ-ÿ]/.test(lines[j])) break
    }
  }
  return null
}

interface FlatLine {
  text: string
  words: string[]
  y: number
  cy: number
}

function flattenLines(data: OCRData): FlatLine[] {
  const lines: FlatLine[] = []
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        const words = (line.words ?? [])
          .map((w) => w.text?.trim() ?? '')
          .filter(Boolean)
        if (words.length === 0) continue
        const { y0, y1 } = line.bbox
        lines.push({
          text: line.text?.trim() ?? words.join(' '),
          words,
          y: y0,
          cy: (y0 + y1) / 2,
        })
      }
    }
  }
  // Ordena por posição vertical (Tesseract pode misturar a ordem entre blocos).
  return lines.sort((a, b) => a.cy - b.cy)
}

/**
 * Estratégia "linha de baixo": acha a linha que contém o label, e procura
 * o número adjacente — primeiro na mesma linha, depois nas próximas 2 linhas.
 */
function extractByLines(data: OCRData, labelRegex: RegExp): string | null {
  const lines = flattenLines(data)
  for (let i = 0; i < lines.length; i++) {
    const labelIdx = lines[i].words.findIndex((w) => labelRegex.test(w))
    if (labelIdx < 0) continue

    // Mesma linha: número depois do label
    for (let k = labelIdx + 1; k < lines[i].words.length; k++) {
      const m = lines[i].words[k].match(/^([0-9]{6,10})$/)
      if (m && !isLikelyDate(m[1])) return m[1]
    }

    // Próximas 2 linhas: primeira palavra que seja só dígitos
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      for (const w of lines[j].words) {
        const m = w.match(/^([0-9]{6,10})$/)
        if (m && !isLikelyDate(m[1])) return m[1]
      }
    }
  }
  return null
}

function flattenWords(data: OCRData): FlatWord[] {
  const flat: FlatWord[] = []
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const w of line.words ?? []) {
          const text = w.text?.trim()
          if (!text) continue
          const { x0, y0, x1, y1 } = w.bbox
          flat.push({
            text,
            x: x0,
            y: y0,
            right: x1,
            bottom: y1,
            cx: (x0 + x1) / 2,
            cy: (y0 + y1) / 2,
            confidence: w.confidence,
          })
        }
      }
    }
  }
  return flat
}

// Regex relaxado pra detectar o label GEN em uma palavra do OCR:
// aceita "GEN", "GEN.", "GEN:", "GEN,", e similares com prefixo/sufixo de pontuação
// (Tesseract às vezes gruda a borda do retângulo como pontuação).
const GEN_WORD_REGEX = /(?:^|[\s\W_])GEN(?:[\s\W_]|$)/i

/**
 * Extrai o número GEN. Estratégias em ordem de confiabilidade:
 *
 *   1. Linha-baseada: acha a linha com "GEN" e pega o número adjacente.
 *   2. Geométrica: bbox do label + número diretamente abaixo.
 *   3. Texto puro como último recurso.
 *
 * Importante: se `GEN` não for encontrado, retornamos `null` (espera próximo
 * frame) em vez de cair pra Matrícula — usuário quer GEN especificamente.
 */
export function extractGenFromData(data: OCRData): string | null {
  return extractGenWithDebug(data).value
}

/**
 * Versão verbosa de extractGenFromData — devolve a estratégia usada pra debug.
 */
export interface BBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface FieldHighlight {
  field: 'gen-label' | 'gen-value' | 'name-label' | 'name-value'
  bbox: BBox
}

export interface ExtractionResult {
  value: string | null
  strategy: 'lines' | 'geometric' | 'text' | 'none'
  genDetected: boolean
  /** Nome do colaborador, extraído do campo `Nome` do crachá. */
  name: string | null
  /** Largura/altura do frame original (pra mapear bboxes pra display). */
  imageWidth: number
  imageHeight: number
  /** Bboxes de campos identificados, pra overlay visual. */
  highlights: FieldHighlight[]
}

export function extractGenWithDebug(data: OCRData): ExtractionResult {
  const text = data.text ?? ''
  const genDetected = GEN_WORD_REGEX.test(text)
  const name = extractNameFromData(data)
  const highlights = collectHighlights(data)
  const { imageWidth, imageHeight } = getImageDimensions(data)

  const base = { genDetected, name, highlights, imageWidth, imageHeight }

  const byLines = extractByLines(data, GEN_WORD_REGEX)
  if (byLines) return { ...base, value: byLines, strategy: 'lines' }

  const words = flattenWords(data)
  if (words.length > 0) {
    const geo = tryLabelGeometric(words, GEN_WORD_REGEX)
    if (geo) return { ...base, value: geo, strategy: 'geometric' }
  }

  const normalized = text.replace(/\s+/g, ' ')
  const fromText = normalized.match(/GEN[^0-9]{0,10}([0-9]{6,10})/i)
  if (fromText && !isLikelyDate(fromText[1])) {
    return { ...base, value: fromText[1], strategy: 'text' }
  }

  return { ...base, value: null, strategy: 'none' }
}

function getImageDimensions(data: OCRData): { imageWidth: number; imageHeight: number } {
  let maxX = 0
  let maxY = 0
  for (const block of data.blocks ?? []) {
    const { x1, y1 } = block.bbox
    if (x1 > maxX) maxX = x1
    if (y1 > maxY) maxY = y1
  }
  return { imageWidth: maxX, imageHeight: maxY }
}

/**
 * Extrai o nome do colaborador a partir do label "Nome" no crachá.
 * Aceita acentos. Considera as próximas linhas até encontrar texto com letras.
 */
export function extractNameFromData(data: OCRData): string | null {
  const lines = flattenLines(data)
  for (let i = 0; i < lines.length; i++) {
    const hasNomeLabel = lines[i].words.some((w) => /^NOME[:.]?$/i.test(w))
    if (!hasNomeLabel) continue

    // Próxima linha que tenha múltiplas letras seguidas (nome próprio)
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      const candidate = lines[j].text
        // Remove caracteres não-letras/espaço
        .replace(/[^A-Za-zÀ-ÿ\s]/g, ' ')
        .trim()
      if (candidate.length >= 5 && /[A-Za-zÀ-ÿ]{2,}/.test(candidate)) {
        return candidate.replace(/\s+/g, ' ')
      }
    }
  }
  return null
}

function collectHighlights(data: OCRData): FieldHighlight[] {
  const highlights: FieldHighlight[] = []
  const words = flattenWordsRaw(data)

  // GEN label
  const genLabels = words.filter((w) => GEN_WORD_REGEX.test(w.text))
  for (const lbl of genLabels) {
    highlights.push({ field: 'gen-label', bbox: lbl.bbox })

    // GEN value (primeiro número 6-10 dígitos abaixo do label, alinhado)
    const xTol = Math.max(120, (lbl.bbox.x1 - lbl.bbox.x0) * 4)
    const lblCx = (lbl.bbox.x0 + lbl.bbox.x1) / 2
    const valueCandidates = words
      .filter((w) => /^[0-9]{6,10}$/.test(w.text))
      .filter((w) => !isLikelyDate(w.text))
      .filter((w) => {
        const cx = (w.bbox.x0 + w.bbox.x1) / 2
        return w.bbox.y0 >= lbl.bbox.y0 && Math.abs(cx - lblCx) <= xTol
      })
      .sort((a, b) => a.bbox.y0 - b.bbox.y0)
    if (valueCandidates[0]) {
      highlights.push({ field: 'gen-value', bbox: valueCandidates[0].bbox })
    }
  }

  // Nome label + valor
  const nameLabels = words.filter((w) => /^NOME[:.]?$/i.test(w.text))
  for (const lbl of nameLabels) {
    highlights.push({ field: 'name-label', bbox: lbl.bbox })
  }

  return highlights
}

interface RawWord {
  text: string
  bbox: BBox
}

function flattenWordsRaw(data: OCRData): RawWord[] {
  const out: RawWord[] = []
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const w of line.words ?? []) {
          const text = w.text?.trim()
          if (!text) continue
          out.push({ text, bbox: w.bbox })
        }
      }
    }
  }
  return out
}

function tryLabelGeometric(words: FlatWord[], labelRegex: RegExp): string | null {
  const labels = words.filter((w) => labelRegex.test(w.text))
  for (const lbl of labels) {
    // Janela horizontal: digitos a ate ~3x a largura do label do centro dele
    const xTolerance = Math.max(80, (lbl.right - lbl.x) * 3)

    // Candidatos: palavras de dígitos abaixo do label (ou à direita, mesma linha),
    // horizontalmente próximas. Filtra datas.
    const candidates = words
      .filter((w) => /^[0-9]{6,10}$/.test(w.text))
      .filter((w) => !isLikelyDate(w.text))
      .filter((w) => {
        const below = w.y >= lbl.y // começa em uma linha igual ou abaixo
        const aligned = Math.abs(w.cx - lbl.cx) <= xTolerance
        return below && aligned
      })
      .map((w) => ({
        word: w,
        // Distância "vertical-pesada": preferimos diretamente abaixo
        dist: Math.hypot((w.cx - lbl.cx) * 0.5, w.cy - lbl.cy),
      }))
      .sort((a, b) => a.dist - b.dist)

    if (candidates[0]) return candidates[0].word.text
  }
  return null
}

/**
 * Extrai o número GEN do texto plano reconhecido pelo OCR.
 * Fallback usado quando não há bboxes disponíveis.
 *
 * Estratégia em camadas:
 *   1. Linha com label `GEN` → valor na mesma linha ou nas próximas 3 linhas.
 *   2. Fallback pra `Matrícula`.
 *   3. Último recurso: a sequência de 7–10 dígitos mais longa que NÃO pareça
 *      uma data DDMMYYYY (filtra "05122022" da admissão).
 */
export function extractGenFromText(text: string): string | null {
  if (!text) return null

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const gen = valueNearLabel(lines, /\bGEN\b/i)
  if (gen) return gen

  const mat = valueNearLabel(lines, /MATR[ÍI]CULA/i)
  if (mat) return mat

  const allDigits = text.match(/(?<!\d)[0-9]{7,10}(?!\d)/g) ?? []
  const candidates = allDigits.filter((d) => !isLikelyDate(d))
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.length - a.length)[0]
  }

  return null
}
