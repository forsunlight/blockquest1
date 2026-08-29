export type QuestStatus = 'completed' | 'skipped'

export type Task = {
  id: string
  time: string
  title: string
  emeralds: number
  xp: number
}

export type Reward = {
  id: string
  title: string
  description: string
  cost: number
  icon: string
}

export type DayRecord = {
  tasks: Record<string, QuestStatus>
  bonusAwarded: boolean
}

export type GameState = {
  version: 1
  tasks: Task[]
  rewards: Reward[]
  profile: { emeralds: number; xp: number; streak: number }
  settings: { pin: string; allCompleteBonus: number }
  days: Record<string, DayRecord>
  redemptions: { id: string; rewardId: string; date: string }[]
}

export const STORAGE_KEY = 'blockquest-state-v1'

const defaultTasks = (): Task[] => [
  { id: 'wake-up', time: '07:00', title: '起床和洗漱', emeralds: 1, xp: 10 },
  { id: 'breakfast', time: '07:20', title: '吃早餐和准备书包', emeralds: 1, xp: 10 },
  { id: 'homework', time: '放学后', title: '完成作业', emeralds: 3, xp: 30 },
  { id: 'reading', time: '冒险时间', title: '阅读20分钟', emeralds: 2, xp: 20 },
  { id: 'exercise', time: '能量时间', title: '运动30分钟', emeralds: 2, xp: 20 },
  { id: 'bedtime', time: '21:30', title: '上床睡觉', emeralds: 2, xp: 20 },
]

const defaultRewards = (): Reward[] => [
  { id: 'game-time', title: '30分钟游戏时间', description: '解锁一段自在探索的游戏时光！', cost: 10, icon: '🎮' },
  { id: 'movie', title: '周末看一部电影', description: '挑选一部喜欢的电影，周末一起看。', cost: 20, icon: '🎬' },
  { id: 'family-activity', title: '选择一次家庭活动', description: '这次的家庭冒险由你决定！', cost: 30, icon: '🗺️' },
  { id: 'gift', title: '一个小礼物', description: '打开一份神秘的小惊喜。', cost: 50, icon: '🎁' },
]

const dayRecord = (): DayRecord => ({ tasks: {}, bonusAwarded: false })
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function createDefaultState(_date = todayKey()): GameState {
  return {
    version: 1,
    tasks: defaultTasks(),
    rewards: defaultRewards(),
    profile: { emeralds: 0, xp: 0, streak: 0 },
    settings: { pin: '1234', allCompleteBonus: 3 },
    days: {},
    redemptions: [],
  }
}

export function todayKey(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function isDayFinished(state: GameState, date: string): boolean {
  const record = state.days[date]
  return Boolean(record && state.tasks.length && state.tasks.every((task) => record.tasks[task.id] === 'completed'))
}

function getStreak(state: GameState, date: string): number {
  let streak = 0
  const cursor = new Date(`${date}T12:00:00`)
  while (isDayFinished(state, todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function completeTask(state: GameState, taskId: string, date = todayKey()): GameState {
  const task = state.tasks.find((item) => item.id === taskId)
  const previous = state.days[date]?.tasks[taskId]
  if (!task || previous === 'completed') return state

  const next = clone(state)
  const record = next.days[date] ?? dayRecord()
  record.tasks[taskId] = 'completed'
  next.days[date] = record
  next.profile.emeralds += task.emeralds
  next.profile.xp += task.xp

  if (isDayFinished(next, date) && !record.bonusAwarded) {
    record.bonusAwarded = true
    next.profile.emeralds += next.settings.allCompleteBonus
  }
  next.profile.streak = getStreak(next, date)
  return next
}

export function skipTask(state: GameState, taskId: string, date = todayKey()): GameState {
  if (!state.tasks.some((task) => task.id === taskId) || state.days[date]?.tasks[taskId] === 'completed') return state
  const next = clone(state)
  const record = next.days[date] ?? dayRecord()
  record.tasks[taskId] = 'skipped'
  next.days[date] = record
  return next
}

export function redeemReward(state: GameState, rewardId: string, date = todayKey()): GameState {
  const reward = state.rewards.find((item) => item.id === rewardId)
  if (!reward || state.profile.emeralds < reward.cost) return state
  const next = clone(state)
  next.profile.emeralds -= reward.cost
  next.redemptions.unshift({ id: `${rewardId}-${Date.now()}`, rewardId, date })
  return next
}

export function resetToDefaults(state: GameState, date = todayKey()): GameState {
  return { ...createDefaultState(date), settings: { ...createDefaultState(date).settings, pin: state.settings.pin } }
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as GameState
    if (parsed.version !== 1 || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.rewards)) throw new Error('invalid state')
    return parsed
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function updateTasks(state: GameState, tasks: Task[]): GameState {
  return { ...state, tasks }
}

export function updateRewards(state: GameState, rewards: Reward[]): GameState {
  return { ...state, rewards }
}

export function updatePin(state: GameState, pin: string): GameState {
  return { ...state, settings: { ...state.settings, pin } }
}
