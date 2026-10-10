import assert from 'node:assert/strict'
import { createModuleLoader } from './test-module-loader.mjs'

const load = createModuleLoader({
  'read-excel-file/browser': async () => [],
})
const {
  createImportedFinancingSchedule,
  financingChargeId,
  financingImportId,
  parseFinancingChargesSheets,
} = load('features/financial/import-financing-charges.ts')

const parsed = parseFinancingChargesSheets([
  {
    sheet: 'Resumo',
    data: [['Descrição', 'Total']],
  },
  {
    sheet: 'Base',
    data: [
      ['fase', 'numero', 'vencimento', 'prestacao', 'encargo', 'saldo_devedor'],
      ['construction', 1, new Date('2026-10-18T00:00:00.000Z'), 62.93, 121.38, 11905.9],
      ['construction', 2, '18/11/2026', 76, 'R$ 134,45', 14046.53],
      ['construction', 3, 'data inválida', 89.66, 148.12, 19258.5],
      [null, null, null, null, null, null],
    ],
  },
])

assert.equal(parsed.sheetName, 'Base')
assert.equal(parsed.ignoredRows, 1)
assert.deepEqual(parsed.charges, [
  { dueDate: '2026-10-18', amount: 121.38, rowNumber: 2 },
  { dueDate: '2026-11-18', amount: 134.45, rowNumber: 3 },
])
assert.equal(financingChargeId('2026-10-18', 121.38), 'financing-charge-2026-10-18-12138')
assert.equal(financingChargeId('2026-10-18', 121.38001), 'financing-charge-2026-10-18-12138')

const schedule = createImportedFinancingSchedule({
  propertyId: 'property-1',
  title: 'Financiamento habitacional',
  institution: 'Caixa',
  charges: parsed.charges,
}, new Date('2026-10-20T12:00:00.000Z'))
assert.ok(schedule)
assert.equal(schedule.loan.id, financingImportId('property-1', parsed.charges))
assert.equal(schedule.loan.installmentCount, 2)
assert.equal(schedule.loan.firstDueDate, '2026-10-18')
assert.equal(schedule.loan.expectedEndDate, '2026-11-18')
assert.equal(schedule.installments[0].source, 'caixa_import')
assert.equal(schedule.installments[0].expectedFees, 121.38)
assert.equal(schedule.installments[0].status, 'overdue')
assert.equal(schedule.installments[1].status, 'upcoming')
assert.equal(schedule.commitments[0].loanId, schedule.loan.id)
assert.equal(schedule.commitments[0].status, 'pending')
assert.equal(schedule.commitments[1].status, 'scheduled')

assert.throws(
  () => parseFinancingChargesSheets([{ sheet: 'Base', data: [['Data', 'Valor']] }]),
  /Não encontrei uma aba/,
)
assert.throws(
  () => parseFinancingChargesSheets([{ sheet: 'Base', data: [['Vencimento', 'Valor Encargo'], ['inválida', 0]] }]),
  /não contém cobranças válidas/,
)

console.log('Importação de financiamento: 15 contratos passaram.')
