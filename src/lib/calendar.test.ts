import { afterEach, describe, expect, it, vi } from 'vitest'
import { monthCells, shiftMonth, daySummary } from './calendar'
import { completeTask, createDefaultState, ensureDay, getStreak, loadState, restoreHistory, saveState, skipTask, updateTasks } from './gameState'

afterEach(() => vi.unstubAllGlobals())

describe('calendar and daily history', () => {
  it('builds Monday-based grids including leap day and adjacent months', () => {
    const dates = monthCells('2024-02')
    expect(dates).toHaveLength(42)
    expect(dates[0]).toBe('2024-01-29')
    expect(dates).toContain('2024-02-29')
    expect(new Set(dates).size).toBe(42)
    expect(monthCells('2025-02')).not.toContain('2025-02-29')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('creates a pending daily snapshot and never invents missed days', () => {
    const initial = createDefaultState()
    const today = ensureDay(initial, '2026-09-09')
    expect(daySummary(today.days['2026-09-09'])).toMatchObject({ total: 6, completed: 0, full: false })
    expect(today.days['2026-09-08']).toBeUndefined()
    expect(daySummary(undefined).recorded).toBe(false)
    expect(today.profile).toEqual(initial.profile)
    expect(ensureDay(today, '2026-09-09')).toBe(today)
  })

  it('keeps previous snapshots and statuses after tasks are edited, deleted or added', () => {
    let state = completeTask(createDefaultState(), 'wake-up', '2026-09-08')
    state = skipTask(state, 'breakfast', '2026-09-08')
    const snapshot = structuredClone(state.days['2026-09-08'])
    const tasks = [{ ...state.tasks[0], title: '新名称', time: '08:30' }, { ...state.tasks[0], id: 'new' }]
    state = updateTasks(state, tasks, '2026-09-09')
    expect(state.days['2026-09-08']).toEqual(snapshot)
    expect(state.days['2026-09-09'].taskSnapshot).toEqual(tasks)
    expect(daySummary(state.days['2026-09-08'])).toMatchObject({ completed: 1, skipped: 1, total: 6 })
    expect(daySummary(state.days['2026-09-09']).completed).toBe(0)
  })

  it('awards each day independently and preserves a full historical day after catalogue changes', () => {
    let state = createDefaultState()
    for (const task of state.tasks) state = completeTask(state, task.id, '2026-09-08')
    const previousBalance = state.profile.emeralds
    state = updateTasks(state, [{ ...state.tasks[0], id: 'new' }], '2026-09-09')
    expect(daySummary(state.days['2026-09-08']).full).toBe(true)
    expect(getStreak(state, '2026-09-09')).toBe(1)
    state = completeTask(state, 'new', '2026-09-09')
    expect(state.profile.emeralds).toBe(previousBalance + 4)
    expect(getStreak(state, '2026-09-09')).toBe(2)
    expect(getStreak(state, '2026-09-11')).toBe(0)
    expect(completeTask(state, 'new', '2026-09-09')).toBe(state)
  })

  it('migrates legacy status without losing deleted task IDs or inventing rewards', () => {
    const original = createDefaultState()
    original.days['2026-09-01'] = { tasks: { 'wake-up': 'completed', deleted: 'skipped' }, bonusAwarded: false }
    const migrated = restoreHistory(original)
    expect(migrated.days['2026-09-01'].reconstructed).toBe(true)
    expect(migrated.days['2026-09-01'].taskSnapshot?.find(task => task.id === 'deleted')?.title).toContain('名称未保存')
    expect(migrated.days['2026-09-01'].tasks).toEqual(original.days['2026-09-01'].tasks)
    expect(migrated.profile).toEqual(original.profile)
    expect(restoreHistory(migrated)).toEqual(migrated)
    expect(daySummary(migrated.days['2026-09-01']).full).toBe(false)
  })

  it('persists snapshots, completed states and custom tasks across reloads', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) })
    let state = createDefaultState()
    state = updateTasks(state, [...state.tasks, { id: 'custom', title: '整理书桌', time: '18:00', emeralds: 2, xp: 20 }], '2026-09-08')
    state = completeTask(state, 'custom', '2026-09-08')
    saveState(state)
    expect(loadState()).toEqual(state)
    const tomorrow = ensureDay(loadState(), '2026-09-09')
    expect(tomorrow.days['2026-09-08'].tasks.custom).toBe('completed')
    expect(tomorrow.days['2026-09-09'].tasks.custom).toBeUndefined()
    expect(tomorrow.tasks.find(task => task.id === 'custom')).toBeDefined()
  })
})
