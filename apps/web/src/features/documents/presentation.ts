import { FileImage, FileSpreadsheet, FileText, ReceiptText, type LucideIcon } from 'lucide-react'

export type DocumentCategory = 'contracts' | 'receipts' | 'invoices' | 'reports' | 'plans' | 'other'
export type DocumentFileType = 'pdf' | 'image' | 'document' | 'spreadsheet'
type VisualConfig = { label: string; icon: LucideIcon }

export const documentCategoryConfig = {
  contracts: { label: 'Contratos', icon: FileText },
  receipts: { label: 'Comprovantes', icon: ReceiptText },
  invoices: { label: 'Notas fiscais', icon: ReceiptText },
  reports: { label: 'Relatórios', icon: FileText },
  plans: { label: 'Planta e projetos', icon: FileSpreadsheet },
  other: { label: 'Outros', icon: FileImage },
} satisfies Record<DocumentCategory, VisualConfig>

export const documentFileTypeConfig = {
  pdf: { label: 'PDF', icon: FileText },
  image: { label: 'Imagem', icon: FileImage },
  document: { label: 'Documento', icon: FileText },
  spreadsheet: { label: 'Planilha', icon: FileSpreadsheet },
} satisfies Record<DocumentFileType, VisualConfig>

const categoryAliases: Record<string, DocumentCategory> = { Contratos: 'contracts', Comprovantes: 'receipts', 'Notas fiscais': 'invoices', Relatórios: 'reports', 'Planta e projetos': 'plans', Outros: 'other' }
const typeAliases: Record<string, DocumentFileType> = { PDF: 'pdf', Imagem: 'image', JPG: 'image', JPEG: 'image', PNG: 'image', Documento: 'document', DOC: 'document', DOCX: 'document', Planilha: 'spreadsheet', XLS: 'spreadsheet', XLSX: 'spreadsheet' }
export const normalizeDocumentCategory = (category: unknown): DocumentCategory | null => typeof category === 'string' && category in documentCategoryConfig ? category as DocumentCategory : categoryAliases[String(category)] ?? null
export const normalizeDocumentFileType = (fileType: unknown): DocumentFileType | null => typeof fileType === 'string' && fileType in documentFileTypeConfig ? fileType as DocumentFileType : typeAliases[String(fileType)] ?? null
export const getDocumentCategoryLabel = (category: unknown) => { const normalized = normalizeDocumentCategory(category); return normalized ? documentCategoryConfig[normalized].label : 'Categoria não disponível' }
export const getDocumentFileTypeLabel = (fileType: unknown) => { const normalized = normalizeDocumentFileType(fileType); return normalized ? documentFileTypeConfig[normalized].label : 'Tipo não disponível' }
export const getDocumentIcon = (fileType: unknown, category?: unknown): LucideIcon => { const normalizedType = normalizeDocumentFileType(fileType); if (normalizedType) return documentFileTypeConfig[normalizedType].icon; const normalizedCategory = normalizeDocumentCategory(category); return normalizedCategory ? documentCategoryConfig[normalizedCategory].icon : FileText }

export const formatBytes = (size: unknown) => {
  const bytes = typeof size === 'number' && Number.isFinite(size) && size >= 0 ? size : 0
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 ** 2) return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024 ** 2)} MB`
}

export const parseFileSize = (value: string) => {
  const match = value.trim().match(/^([\d.,]+)\s*(B|KB|MB)?$/i)
  if (!match) return 0
  const raw = match[1]
  const lastComma = raw.lastIndexOf(',')
  const lastDot = raw.lastIndexOf('.')
  const normalized = lastComma > lastDot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '')
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return 0
  const unit = (match[2] ?? 'KB').toUpperCase()
  return Math.round(amount * (unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1))
}

export const isValidDocumentDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export const formatDocumentDate = (value: unknown) => typeof value === 'string' && isValidDocumentDate(value) ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'Data não disponível'

export function getDocumentFileTypeFromFile(file: File): DocumentFileType {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (file.type === 'application/pdf' || extension === 'pdf') return 'pdf'
  if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image'
  if (['xls', 'xlsx', 'csv'].includes(extension) || file.type.includes('spreadsheet') || file.type.includes('excel')) return 'spreadsheet'
  return 'document'
}
