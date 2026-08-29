import { describe, expect, it } from 'vitest'
import { completeTask, createDefaultState, redeemReward, resetToDefaults } from './gameState'

describe('BlockQuest game state', () => {
  it('awards a completed task once and records the completion', () => {
    const state = createDefaultState('2026-08-29')
    const task = state.tasks[0]
    const completed = completeTask(state, task.id, '2026-08-29')

    expect(completed.profile.emeralds).toBe(task.emeralds)
    expect(completed.profile.xp).toBe(task.xp)
    expect(completed.days['2026-08-29'].tasks[task.id]).toBe('completed')
    expect(completeTask(completed, task.id, '2026-08-29')).toEqual(completed)
  })

  it('gives the all-quests emerald bonus exactly once', () => {
    let state = createDefaultState('2026-08-29')
    for (const task of state.tasks) state = completeTask(state, task.id, '2026-08-29')

    const taskReward = state.tasks.reduce((total, task) => total + task.emeralds, 0)
    expect(state.profile.emeralds).toBe(taskReward + state.settings.allCompleteBonus)
    expect(completeTask(state, state.tasks[0].id, '2026-08-29')).toEqual(state)
  })

  it('redeems only affordable rewards', () => {
    const state = createDefaultState('2026-08-29')
    const reward = state.rewards[0]
    expect(redeemReward(state, reward.id)).toEqual(state)

    const funded = { ...state, profile: { ...state.profile, emeralds: reward.cost } }
    const redeemed = redeemReward(funded, reward.id)
    expect(redeemed.profile.emeralds).toBe(0)
    expect(redeemed.redemptions[0].rewardId).toBe(reward.id)
  })

  it('restores the default quest and reward catalogue', () => {
    const state = createDefaultState('2026-08-29')
    const altered = { ...state, tasks: [] }
    expect(resetToDefaults(altered, '2026-08-29').tasks).toHaveLength(6)
  })
})
