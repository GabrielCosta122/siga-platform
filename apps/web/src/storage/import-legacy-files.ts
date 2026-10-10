import type { AppState } from '@/store/app-state'
import { getDocumentFile, saveDocumentFile } from './document-file-storage'
import { getChapterPhoto, saveChapterPhoto } from './chapter-photo-storage'
import { fileDatabase } from '@/store/scoped-persistence'

export async function copyLegacyFiles(state: AppState, userId: string, propertyId: string, assertCurrent: () => void): Promise<void> {
  const target = fileDatabase(userId, propertyId)
  for (const document of state.documents) {
    assertCurrent()
    const file = await getDocumentFile(document.id, 'siga-files')
    assertCurrent()
    if (file) await saveDocumentFile(document.id, new File([file.blob], file.name, { type: file.type, lastModified: file.lastModified }), target)
  }
  for (const chapter of state.chapters) {
    for (const photo of chapter.photos ?? []) {
      assertCurrent()
      const file = await getChapterPhoto(photo.id, 'siga-files')
      assertCurrent()
      if (file) await saveChapterPhoto(photo.id, chapter.id, new File([file.blob], file.name, { type: file.type, lastModified: file.lastModified }), target)
    }
  }
  assertCurrent()
}
