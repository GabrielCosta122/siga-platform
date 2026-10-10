import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function toLocalDate(date: string | Date) {
  if (date instanceof Date) return date
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateLongBR(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(toLocalDate(date))
}

export function formatDateShortBR(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(toLocalDate(date))
}

export function createUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    // Development fallback for runtimes without Web Crypto.
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const value = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

export function createEntityId(prefix = 'entity') {
  const randomId = createUuid()
  return prefix ? `${prefix}-${randomId}` : randomId
}
