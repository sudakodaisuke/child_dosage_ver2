import * as XLSX from 'xlsx'
import { buildDrugs } from './csvParser'
import type { ParseResult } from './csvParser'

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to array of arrays
  const aoa: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  if (aoa.length < 2) {
    return { drugs: [], errors: ['データが見つかりませんでした'], skipped: 0 }
  }

  const [headerRow, ...dataRows] = aoa
  const headers = headerRow.map(String)

  // Convert to record format that buildDrugs expects
  const rows: Record<string, string>[] = dataRows.map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((h, i) => {
      record[h] = String(row[i] ?? '')
    })
    return record
  })

  return buildDrugs(rows, headers)
}
