import type { Task } from './gameState'

function minutes(time: string): number {
  const match = /^(\d{1,2})[:：](\d{2})$/.exec(time.trim())
  if (!match) return Infinity
  const hours = Number(match[1])
  const mins = Number(match[2])
  return hours < 24 && mins < 60 ? hours * 60 + mins : Infinity
}

/** Keep equal-time and untimed tasks in their original order; never mutate saved data. */
export function sortTasksByTime(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const left = minutes(a.time)
    const right = minutes(b.time)
    return left === right ? 0 : left < right ? -1 : 1
  })
}
