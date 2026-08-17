import { FileImage, FileSpreadsheet, FileText } from 'lucide-react'
import { normalizeDocumentCategory, normalizeDocumentFileType } from '@/features/documents/presentation'

function DocumentIcon({ fileType, category, className }: { fileType: unknown; category?: unknown; className?: string }) {
  const normalizedType = normalizeDocumentFileType(fileType)
  if (normalizedType === 'image') return <FileImage className={className} aria-hidden="true" />
  if (normalizedType === 'spreadsheet') return <FileSpreadsheet className={className} aria-hidden="true" />
  if (!normalizedType && normalizeDocumentCategory(category) === 'other') return <FileImage className={className} aria-hidden="true" />
  return <FileText className={className} aria-hidden="true" />
}
export { DocumentIcon }
