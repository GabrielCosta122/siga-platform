import type { HouseDocument } from '@/domain/types'
import { Card, CardContent } from '@/components/ui/card'
import {
  PhotoAttachmentsEditor,
  type ChapterPhotoAttachmentView,
} from '@/features/new-chapter/components/PhotoAttachmentsEditor'
import { DocumentAttachmentsSelector } from '@/features/new-chapter/components/DocumentAttachmentsSelector'

type AttachmentsPanelProps = {
  photos: ChapterPhotoAttachmentView[]
  coverPhotoId: string | null
  documents: HouseDocument[]
  selectedDocumentIds: string[]
  onPhotosAdded: (files: File[]) => void
  onPhotoRemoved: (photoId: string) => void
  onPhotoCaptionChange: (photoId: string, caption: string) => void
  onCoverPhotoChange: (photoId: string) => void
  onDocumentToggle: (documentId: string) => void
  onAddDocument: () => void
  photoError?: string
  documentError?: string
  disabled?: boolean
}

function AttachmentsPanel({
  photos,
  coverPhotoId,
  documents,
  selectedDocumentIds,
  onPhotosAdded,
  onPhotoRemoved,
  onPhotoCaptionChange,
  onCoverPhotoChange,
  onDocumentToggle,
  onAddDocument,
  photoError,
  documentError,
  disabled = false,
}: AttachmentsPanelProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-book-xs">
        <CardContent className="pt-6">
          <PhotoAttachmentsEditor
            photos={photos}
            coverPhotoId={coverPhotoId}
            onPhotosAdded={onPhotosAdded}
            onPhotoRemoved={onPhotoRemoved}
            onPhotoCaptionChange={onPhotoCaptionChange}
            onCoverPhotoChange={onCoverPhotoChange}
            error={photoError}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card className="shadow-book-xs">
        <CardContent className="pt-6">
          <DocumentAttachmentsSelector
            documents={documents}
            selectedDocumentIds={selectedDocumentIds}
            onDocumentToggle={onDocumentToggle}
            onAddDocument={onAddDocument}
            error={documentError}
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export { AttachmentsPanel }
export type { AttachmentsPanelProps, ChapterPhotoAttachmentView }
