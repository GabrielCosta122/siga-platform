import type { AppState } from './app-state'
import { isValidAppState } from './persistence'

type Rule = (value: unknown) => boolean
const text: Rule = value => typeof value === 'string'
const finite: Rule = value => typeof value === 'number' && Number.isFinite(value)
const bool: Rule = value => typeof value === 'boolean'
const strings: Rule = value => Array.isArray(value) && value.every(text)
const nullable = (rule: Rule): Rule => value => value === null || rule(value)
const fields = (value: unknown, shape: Record<string, Rule>): boolean => value !== null && typeof value === 'object'
  && Object.entries(shape).every(([key, rule]) => key in value && rule(Reflect.get(value, key)))
const base = { id: text, createdAt: text, updatedAt: text }
const shape = (texts: string, numbers = '', booleans = '', arrays = '', nullableTexts = '', nullableNumbers = '') => {
  const rules: Record<string, Rule> = { ...base }
  for (const [names, rule] of [[texts, text], [numbers, finite], [booleans, bool], [arrays, strings], [nullableTexts, nullable(text)], [nullableNumbers, nullable(finite)]] as const) {
    for (const name of names.split(' ').filter(Boolean)) rules[name] = rule
  }
  return rules
}
export function isSafeAppState(value: unknown): value is AppState {
  if (!isValidAppState(value)) return false
  const schemas = {
    chapters: { ...shape('title content category date status author', '', 'important', 'impacts documentIds financialTransactionIds assetIds maintenanceIds', 'coverPhotoId'),
      photos: (photos: unknown) => Array.isArray(photos) && photos.every(photo => fields(photo, { id: text, name: text, src: text, alt: text, caption: text, isCover: bool, createdAt: text })) },
    financialTransactions: shape('title description date type status category', 'amount', '', 'documentIds', 'chapterId assetId maintenanceId'),
    financialCommitments: shape('title dueDate status category', 'amount', '', '', 'chapterId'),
    financialLoans: shape('propertyId title institution firstDueDate amortizationSystem status notes', 'installmentCount', '', '', 'contractNumber startDate expectedEndDate', 'originalAmount financedAmount initialBalance currentBalance interestRateAnnual'),
    loanInstallments: shape('loanId dueDate status source', 'installmentNumber', '', 'documentIds', 'paidDate financialTransactionId', 'expectedAmount expectedPrincipal expectedInterest expectedInsurance expectedFees paidAmount balanceBefore balanceAfter'),
    documents: shape('name description category fileType date mockUrl', 'sizeInBytes', 'important', '', 'folderId chapterId financialTransactionId assetId maintenanceId'),
    documentFolders: shape('name'),
    rooms: shape('name type', 'order', 'active'),
    assets: shape('name kind description category status brand model serialNumber supplier image', 'value', 'important', 'documentIds maintenanceIds', 'roomId purchaseDate installationDate warrantyEndDate chapterId financialTransactionId'),
    maintenanceRecords: shape('title description type status priority scheduledDate responsible supplier', '', '', 'documentIds', 'completedDate roomId assetId chapterId financialTransactionId recurringRoutineId', 'cost'),
    maintenanceRoutines: shape('title frequency nextDate', '', 'active', '', 'roomId assetId'),
  } satisfies Record<Exclude<keyof AppState, 'schemaVersion' | 'property' | 'settings' | 'initializedAt' | 'updatedAt'>, Record<string, Rule>>
  return (Object.keys(schemas) as (keyof typeof schemas)[]).every(key => value[key].every(record => fields(record, schemas[key])))
}
