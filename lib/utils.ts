import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const adjectives = ['זריז', 'עליז', 'מסוקס', 'חייכן', 'נמרץ', 'קליל']
const nouns = ['שועל', 'זברה', 'דולפין', 'צבי', 'ינשוף', 'טווס']

export function generateFriendlyName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const suffix = Math.floor(Math.random() * 90 + 10)
  return `${adjective} ${noun} ${suffix}`
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2
  }).format(value)
}
