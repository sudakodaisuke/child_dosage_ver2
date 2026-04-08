import Papa from 'papaparse'
import type { Drug } from '../types'

// Japanese <-> English header aliases
const HEADER_MAP: Record<string, keyof Drug> = {
  薬品id: 'id',
  id: 'id',
  商品名: 'brandName',
  brandname: 'brandName',
  trade_name: 'brandName',
  tradename: 'brandName',
  一般名: 'genericName',
  genericname: 'genericName',
  generic_name: 'genericName',
  疾患カテゴリ: 'category',
  category: 'category',
  用量: 'dosage',
  dosage: 'dosage',
  用量詳細: 'dosageDetail',
  dosagedetail: 'dosageDetail',
  投与経路: 'route',
  route: 'route',
  禁忌: 'contraindications',
  contraindications: 'contraindications',
  注意事項: 'notes',
  notes: 'notes',
  年齢制限: 'ageRestriction',
  agerestriction: 'ageRestriction',
  タグ: 'tags',
  tags: 'tags',
  参考文献: 'reference',
  reference: 'reference',
  重要: 'isImportant',
  is_important: 'isImportant',
  isimportant: 'isImportant',
  メモ: 'memo',
  memo: 'memo',
}

function normalizeHeader(h: string): keyof Drug | null {
  const key = h.trim().toLowerCase().replace(/\s/g, '')
  return HEADER_MAP[key] ?? null
}

export interface ParseResult {
  drugs: Drug[]
  errors: string[]
  skipped: number
}

export function parseCSV(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  return buildDrugs(result.data, result.meta.fields ?? [])
}

export function buildDrugs(
  rows: Record<string, string>[],
  rawHeaders: string[]
): ParseResult {
  const errors: string[] = []
  let skipped = 0

  // Map raw headers to Drug fields
  const headerMapping: Record<string, keyof Drug> = {}
  for (const h of rawHeaders) {
    const field = normalizeHeader(h)
    if (field) headerMapping[h] = field
  }

  const drugs: Drug[] = []

  for (const row of rows) {
    const drug: Partial<Drug> = { importedAt: Date.now() }

    for (const [rawHeader, field] of Object.entries(headerMapping)) {
      const val = row[rawHeader]?.trim() ?? ''
      if (!val) continue

      if (field === 'tags') {
        drug.tags = val.split(/[,、]/).map((t) => t.trim()).filter(Boolean)
      } else if (field === 'isImportant') {
        drug.isImportant = val === '1' || val.toLowerCase() === 'true' || val === '○' || val === '◯'
      } else {
        // @ts-expect-error dynamic assignment
        drug[field] = val
      }
    }

    // Validate required fields
    if (!drug.brandName && !drug.genericName) {
      skipped++
      continue
    }
    if (!drug.dosage) {
      errors.push(`「${drug.brandName ?? drug.genericName}」に用量がありません`)
    }

    // Auto-generate ID if missing
    if (!drug.id) {
      drug.id = crypto.randomUUID()
    }
    if (!drug.category) {
      drug.category = '未分類'
    }

    drugs.push(drug as Drug)
  }

  return { drugs, errors, skipped }
}
