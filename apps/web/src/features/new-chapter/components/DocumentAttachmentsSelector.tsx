import { useId, useMemo, useState } from 'react'
import { Check, FilePlus2, Search } from 'lucide-react'

import type { HouseDocument } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  formatDocumentDate,
  getDocumentCategoryLabel,
  getDocumentFileTypeLabel,
  getDocumentIcon,
} from '@/features/documents/presentation'
import { cn } from '@/lib/utils'

type DocumentAttachmentsSelectorProps = {
  documents: HouseDocument[]
  selectedDocumentIds: string[]
  onDocumentToggle: (documentId: string) => void
  onAddDocument: () => void
  error?: string
  disabled?: boolean
}

function DocumentAttachmentsSelector({
  documents,
  selectedDocumentIds,
  onDocumentToggle,
  onAddDocument,
  error,
  disabled = false,
}: DocumentAttachmentsSelectorProps) {
  const [search, setSearch] = useState('')
  const searchId = useId()
  const selectedIds = useMemo(() => new Set(selectedDocumentIds), [selectedDocumentIds])
  const validSelectedCount = useMemo(
    () => documents.reduce((count, document) => count + Number(selectedIds.has(document.id)), 0),
    [documents, selectedIds],
  )
  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return documents
    return documents.filter(document => [
      document.name,
      document.description,
      getDocumentCategoryLabel(document.category),
      getDocumentFileTypeLabel(document.fileType),
    ].some(value => String(value ?? '').toLocaleLowerCase('pt-BR').includes(term)))
  }, [documents, search])

  return (
    <section className="space-y-4" aria-labelledby={`${searchId}-heading`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={`${searchId}-heading`} className="font-display text-lg font-semibold">Documentos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Arquivos que ajudam a preservar o contexto.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddDocument} disabled={disabled}>
          <FilePlus2 aria-hidden="true" /> Adicionar novo documento
        </Button>
      </div>

      {error ? <p role="alert" className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p> : null}

      {documents.length ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar documento"
              aria-label="Buscar documentos existentes"
              className="pl-9"
              disabled={disabled}
            />
          </div>

          {filteredDocuments.length ? (
            <ul className="max-h-80 divide-y overflow-y-auto rounded-md border bg-background px-3" aria-label="Documentos existentes">
              {filteredDocuments.map(document => {
                const selected = selectedIds.has(document.id)
                const Icon = getDocumentIcon(document.fileType, document.category)
                const documentName = typeof document.name === 'string' && document.name.trim() ? document.name : 'Documento sem nome'

                return (
                  <li key={document.id}>
                    <label className={cn(
                      'flex cursor-pointer items-center gap-3 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={selected}
                        onChange={() => onDocumentToggle(document.id)}
                        disabled={disabled}
                      />
                      <span className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md border bg-secondary text-primary',
                        selected && 'border-primary bg-primary text-primary-foreground',
                      )}>
                        {selected ? <Check className="size-4" aria-hidden="true" /> : <Icon className="size-4" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{documentName}</span>
                        <span className="block text-xs leading-relaxed text-muted-foreground">
                          {getDocumentCategoryLabel(document.category)} · {getDocumentFileTypeLabel(document.fileType)} · {formatDocumentDate(document.date)}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center">
              <p className="text-sm font-medium">Nenhum documento encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground">Ajuste a busca para encontrar outro arquivo.</p>
              <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setSearch('')} disabled={disabled}>Limpar busca</Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-secondary/20 px-4 py-8 text-center">
          <FilePlus2 className="mx-auto size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">Nenhum documento relacionado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Vincule contratos, comprovantes ou outros arquivos a este capítulo.</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground" aria-live="polite">
        {validSelectedCount ? (
          <p>{validSelectedCount === 1 ? '1 documento vinculado' : `${validSelectedCount} documentos vinculados`}</p>
        ) : documents.length ? (
          <div className="rounded-md bg-secondary/35 px-3 py-2">
            <p className="font-medium text-foreground">Nenhum documento relacionado</p>
            <p className="mt-0.5 leading-relaxed">Vincule contratos, comprovantes ou outros arquivos a este capítulo.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export { DocumentAttachmentsSelector }
export type { DocumentAttachmentsSelectorProps }
