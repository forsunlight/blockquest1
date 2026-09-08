import { describe, expect, it } from 'vitest'
import { createDefaultState } from './gameState'
import { sortTasksByTime } from './taskOrder'

describe('task time order', () => {
  const tasks = (...times: string[]) => times.map((time, index) => ({
    id: String(index), time, title: '任务', emeralds: 1, xp: 10,
  }))

  it('orders numeric times, including single-digit hours and Chinese colons', () => {
    expect(sortTasksByTime(tasks('21:30', '9:00', '00:00', ' 07：20 ', '07:00', '23:59'))
      .map(task => task.time)).toEqual(['00:00', '07:00', ' 07：20 ', '9:00', '21:30', '23:59'])
  })

  it('puts missing, descriptive and invalid times last in original order', () => {
    expect(sortTasksByTime(tasks('', '放学后', '24:00', '07:60', '任意时间', '10:00'))
      .map(task => task.id)).toEqual(['5', '0', '1', '2', '3', '4'])
  })

  it('preserves ties and leaves the original array and task identities unchanged', () => {
    const original = tasks('18:00', '7:00', '07:00')
    const sorted = sortTasksByTime(original)
    expect(sorted.map(task => task.id)).toEqual(['1', '2', '0'])
    expect(original.map(task => task.id)).toEqual(['0', '1', '2'])
    expect(sorted[0]).toBe(original[1])
  })

  it('orders the default bedtime before tasks without a clock time', () => {
    expect(sortTasksByTime(createDefaultState().tasks).map(task => task.id))
      .toEqual(['wake-up', 'breakfast', 'bedtime', 'homework', 'reading', 'exercise'])
  })
})
