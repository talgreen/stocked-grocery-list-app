// Run with: npx tsx scripts/simulate-popularity.ts
import { applyInteraction, getDecayedPopularityScore, isStaple, withDefaultMetrics } from '../lib/popularity'
import type { Item } from '../types/item'

const DAYS = 24 * 60 * 60 * 1000

function logState(label: string, item: Item, now: number) {
  const score = getDecayedPopularityScore(item, now)
  console.log(`${label}: score=${score.toFixed(2)}, purchases=${item.totalPurchases ?? 0}, isStaple=${isStaple(item, { now })}`)
}

function main() {
  const now = Date.now()
  let item: Item = withDefaultMetrics({
    id: 1,
    name: 'חלב',
    purchased: true,
  })

  console.log('--- Simulating repeated purchases for "חלב" ---')

  const checkpoints = [
    { label: 'Purchase 1 (20 days ago)', offsetDays: 20 },
    { label: 'Purchase 2 (10 days ago)', offsetDays: 10 },
    { label: 'Purchase 3 (2 days ago)', offsetDays: 2 },
  ]

  for (const checkpoint of checkpoints) {
    const timestamp = now - checkpoint.offsetDays * DAYS
    item = applyInteraction({ ...item, purchased: true }, 'purchase', timestamp)
    logState(checkpoint.label, item, now)
  }

  console.log('\n--- Resetting for a new shopping trip ---')
  item = applyInteraction({ ...item, purchased: false }, 'reset', now)
  logState('After auto-uncheck', item, now)

  console.log('\nInteraction history:')
  console.table((item.interactionHistory ?? []).map(entry => ({
    action: entry.type,
    occurredAt: entry.at,
  })))
}

main()
