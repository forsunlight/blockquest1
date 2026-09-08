import type { DayRecord } from './gameState'
import { todayKey } from './gameState'

export function shiftMonth(month: string, offset: number): string {
  const date = new Date(`${month}-01T12:00:00`)
  date.setMonth(date.getMonth() + offset)
  return todayKey(date).slice(0, 7)
}

/** Six complete weeks, starting on Monday, using local calendar dates. */
export function monthCells(month: string): string[] {
  const cursor = new Date(`${month}-01T12:00:00`)
  cursor.setDate(cursor.getDate() - (cursor.getDay() + 6) % 7)
  return Array.from({ length: 42 }, () => {
    const key = todayKey(cursor)
    cursor.setDate(cursor.getDate() + 1)
    return key
  })
}

export function daySummary(record?: DayRecord) {
  const tasks = record?.taskSnapshot ?? []
  const completed = tasks.filter(task => record?.tasks[task.id] === 'completed').length
  const skipped = tasks.filter(task => record?.tasks[task.id] === 'skipped').length
  const total = tasks.length
  const full = record?.reconstructed ? record.bonusAwarded : total > 0 && completed === total
  return { completed, skipped, total, full, recorded: Boolean(record) }
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
    .format(new Date(`${date}T12:00:00`))
}
