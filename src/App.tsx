import { FormEvent, useEffect, useMemo, useState } from 'react'
import { sortTasksByTime } from './lib/taskOrder'
import {
  completeTask, GameState, loadState, redeemReward, resetToDefaults, Reward, saveState, skipTask,
  Task, todayKey, updatePin, updateRewards, updateTasks,
} from './lib/gameState'

type Page = 'today' | 'rewards' | 'parent'
const date = todayKey()
const uid = () => `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`
const taskIcons = ['☀️', '🥞', '📚', '📖', '⚽', '🌙']

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState())
  const [page, setPage] = useState<Page>('today')
  const [toast, setToast] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')

  useEffect(() => { saveState(state) }, [state])
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(''), 2600); return () => clearTimeout(id) }, [toast])

  const displayState = useMemo(() => ({ ...state, tasks: sortTasksByTime(state.tasks) }), [state])
  const record = state.days[date]?.tasks ?? {}
  const completed = state.tasks.filter((task) => record[task.id] === 'completed').length
  const progress = state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0
  const level = Math.floor(state.profile.xp / 100) + 1
  const xpIntoLevel = state.profile.xp % 100
  const act = (next: GameState, message?: string) => { setState(next); if (message) setToast(message) }

  const parentOpen = () => {
    if (unlocked) setPage('parent')
    else { setPage('parent'); setPin('') }
  }

  return <main className="app-shell">
    <div className="sky-pixels" aria-hidden="true"><i /><i /><i /></div>
    <header className="topbar">
      <div className="brand"><div className="brand-cube">B</div><div><strong>BlockQuest</strong><span>Build Habits. Earn Rewards. Level Up.</span></div></div>
      <div className="stats">
        <Stat icon="⚔️" value={`Lv.${level}`} label="勇者等级" />
        <Stat icon="💚" value={state.profile.emeralds} label="绿宝石" emerald />
        <Stat icon="🔥" value={state.profile.streak} label="连续天数" />
      </div>
    </header>

    {page === 'today' && <Today state={displayState} record={record} completed={completed} progress={progress} xpIntoLevel={xpIntoLevel}
      onComplete={(id) => act(completeTask(state, id, date), '叮！获得了冒险奖励！')}
      onSkip={(id) => act(skipTask(state, id, date), '任务已暂时跳过。明天再挑战！')} />}
    {page === 'rewards' && <Rewards state={state} onRedeem={(id) => {
      const before = state.profile.emeralds; const next = redeemReward(state, id, date)
      act(next, next.profile.emeralds === before ? '绿宝石还不够，继续完成任务吧！' : '宝箱已打开！记得告诉爸爸妈妈。')
    }} />}
    {page === 'parent' && (!unlocked ? <PinGate pin={pin} setPin={setPin} onUnlock={() => {
      if (pin === state.settings.pin) { setUnlocked(true); setToast('家长模式已开启') } else { setPin(''); setToast('PIN 不正确，请再试一次') }
    }} /> : <ParentPanel state={displayState} onChange={act} onLock={() => { setUnlocked(false); setPage('today') }} />)}

    <nav className="nav-dock" aria-label="主要导航">
      <NavButton active={page === 'today'} icon="⛏️" label="今日冒险" onClick={() => setPage('today')} />
      <NavButton active={page === 'rewards'} icon="🎁" label="奖励宝箱" onClick={() => setPage('rewards')} />
      <NavButton active={page === 'parent'} icon="⚙️" label="家长基地" onClick={parentOpen} />
    </nav>
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>
}

function Stat({ icon, value, label, emerald }: { icon: string; value: string | number; label: string; emerald?: boolean }) {
  return <div className="stat"><span className={emerald ? 'emerald' : ''}>{icon}</span><b>{value}</b><small>{label}</small></div>
}
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}><span>{icon}</span>{label}</button>
}

function Today({ state, record, completed, progress, xpIntoLevel, onComplete, onSkip }: {
  state: GameState; record: Record<string, string>; completed: number; progress: number; xpIntoLevel: number; onComplete: (id: string) => void; onSkip: (id: string) => void
}) {
  return <section className="page today-page">
    <aside className="hero-card">
      <div className="cloud cloud-a" /><div className="cloud cloud-b" />
      <div className="hero-copy"><p>第 {state.profile.streak + 1} 天冒险</p><h1>今天也来<br /><em>建造好习惯！</em></h1><span>完成全部任务，宝箱额外送 {state.settings.allCompleteBonus} 颗绿宝石</span></div>
      <div className="adventure-map"><div className="mountain" /><div className="path"><i /><i /><i /></div><div className="chest">▣</div><div className="tree tree-one" /><div className="tree tree-two" /></div>
    </aside>
    <section className="quest-area">
      <div className="section-head"><div><p>今日任务 · {new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</p><h2>冒险任务板</h2></div><div className="progress-label">{completed}/{state.tasks.length} 完成</div></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="xp-row"><span>成长经验</span><b>{xpIntoLevel}/100 XP</b></div>
      <div className="task-grid">
        {state.tasks.map((task) => <QuestCard key={task.id} task={task} icon={taskIcons[['wake-up', 'breakfast', 'homework', 'reading', 'exercise', 'bedtime'].indexOf(task.id)] ?? '📋'} status={record[task.id]} onComplete={onComplete} onSkip={onSkip} />)}
        {state.tasks.length === 0 && <div className="empty-card">还没有任务，去家长基地添加一个新冒险吧！</div>}
      </div>
    </section>
  </section>
}

function QuestCard({ task, icon, status, onComplete, onSkip }: { task: Task; icon: string; status?: string; onComplete: (id: string) => void; onSkip: (id: string) => void }) {
  const done = status === 'completed'
  return <article className={`quest-card ${done ? 'done' : ''} ${status === 'skipped' ? 'skipped' : ''}`}>
    <div className="quest-icon">{done ? '✓' : icon}</div><div className="quest-main"><span className="time-tag">{task.time}</span><h3>{task.title}</h3><div className="gains"><span>💚 +{task.emeralds}</span><span>⚡ +{task.xp} XP</span></div></div>
    {status ? <div className="quest-status">{done ? '已完成！' : '已跳过'}</div> : <div className="quest-actions"><button className="complete" onClick={() => onComplete(task.id)}>完成</button><button className="skip" aria-label={`跳过${task.title}`} onClick={() => onSkip(task.id)}>跳过</button></div>}
  </article>
}

function Rewards({ state, onRedeem }: { state: GameState; onRedeem: (id: string) => void }) {
  return <section className="page rewards-page"><div className="reward-hero"><div className="big-chest">▣</div><div><p>用努力换来惊喜</p><h1>奖励宝箱</h1><span>你有 <b>💚 {state.profile.emeralds}</b> 颗绿宝石可以使用</span></div></div><div className="reward-grid">{state.rewards.map((reward) => <article className="reward-card" key={reward.id}><div className="reward-icon">{reward.icon}</div><h2>{reward.title}</h2><p>{reward.description}</p><div><span className="cost">💚 {reward.cost}</span><button disabled={state.profile.emeralds < reward.cost} onClick={() => onRedeem(reward.id)}>{state.profile.emeralds < reward.cost ? '继续收集' : '打开宝箱'}</button></div></article>)}</div>{state.rewards.length === 0 && <div className="empty-card">奖励宝箱空空的，去家长基地放入新奖励吧！</div>}</section>
}

function PinGate({ pin, setPin, onUnlock }: { pin: string; setPin: (pin: string) => void; onUnlock: () => void }) {
  return <section className="page pin-page"><div className="pin-card"><div className="lock-cube">🔒</div><p>仅限家长</p><h1>家长基地</h1><span>输入 4 位 PIN，管理任务和奖励。</span><input value={pin} inputMode="numeric" maxLength={4} autoFocus aria-label="四位 PIN" onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={(event) => event.key === 'Enter' && onUnlock()} /><button onClick={onUnlock}>进入基地</button><small>默认 PIN：1234（可在进入后修改）</small></div></section>
}

function ParentPanel({ state, onChange, onLock }: { state: GameState; onChange: (next: GameState, message?: string) => void; onLock: () => void }) {
  const [taskDraft, setTaskDraft] = useState({ time: '', title: '', emeralds: '1', xp: '10' })
  const [rewardDraft, setRewardDraft] = useState({ title: '', description: '', cost: '10', icon: '🎁' })
  const addTask = (event: FormEvent) => { event.preventDefault(); if (!taskDraft.title.trim()) return; onChange(updateTasks(state, [...state.tasks, { id: uid(), time: taskDraft.time || '任意时间', title: taskDraft.title.trim(), emeralds: Number(taskDraft.emeralds) || 1, xp: Number(taskDraft.xp) || 10 }]), '新任务已加入冒险板'); setTaskDraft({ time: '', title: '', emeralds: '1', xp: '10' }) }
  const addReward = (event: FormEvent) => { event.preventDefault(); if (!rewardDraft.title.trim()) return; onChange(updateRewards(state, [...state.rewards, { id: uid(), title: rewardDraft.title.trim(), description: rewardDraft.description || '一份努力换来的惊喜！', cost: Number(rewardDraft.cost) || 1, icon: rewardDraft.icon || '🎁' }]), '新奖励已放入宝箱'); setRewardDraft({ title: '', description: '', cost: '10', icon: '🎁' }) }
  const editTask = (task: Task) => { const title = window.prompt('任务名称', task.title); if (title?.trim()) onChange(updateTasks(state, state.tasks.map((item) => item.id === task.id ? { ...item, title: title.trim() } : item)), '任务已更新') }
  const editReward = (reward: Reward) => { const title = window.prompt('奖励名称', reward.title); if (title?.trim()) onChange(updateRewards(state, state.rewards.map((item) => item.id === reward.id ? { ...item, title: title.trim() } : item)), '奖励已更新') }
  return <section className="page parent-page"><div className="parent-head"><div><p>家长基地 · 管理工具</p><h1>任务与奖励工坊</h1></div><button className="lock-btn" onClick={onLock}>🔒 锁定</button></div><div className="admin-columns"><div className="admin-panel"><h2>🧭 今日任务</h2><div className="manage-list">{state.tasks.map((task) => <div key={task.id}><span>{task.time}</span><b>{task.title}</b><small>💚{task.emeralds} · ⚡{task.xp}</small><button onClick={() => editTask(task)}>编辑</button><button className="delete" onClick={() => onChange(updateTasks(state, state.tasks.filter((item) => item.id !== task.id)), '任务已删除')}>删除</button></div>)}</div><form className="add-form" onSubmit={addTask}><h3>添加任务</h3><input placeholder="时间（例如 18:00）" value={taskDraft.time} onChange={(e) => setTaskDraft({ ...taskDraft, time: e.target.value })} /><input required placeholder="任务名称" value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} /><div><input type="number" min="1" value={taskDraft.emeralds} onChange={(e) => setTaskDraft({ ...taskDraft, emeralds: e.target.value })} /><input type="number" min="1" value={taskDraft.xp} onChange={(e) => setTaskDraft({ ...taskDraft, xp: e.target.value })} /></div><button>添加任务</button></form></div><div className="admin-panel"><h2>🎁 奖励宝箱</h2><div className="manage-list">{state.rewards.map((reward) => <div key={reward.id}><span>{reward.icon}</span><b>{reward.title}</b><small>💚 {reward.cost}</small><button onClick={() => editReward(reward)}>编辑</button><button className="delete" onClick={() => onChange(updateRewards(state, state.rewards.filter((item) => item.id !== reward.id)), '奖励已删除')}>删除</button></div>)}</div><form className="add-form" onSubmit={addReward}><h3>添加奖励</h3><input required placeholder="奖励名称" value={rewardDraft.title} onChange={(e) => setRewardDraft({ ...rewardDraft, title: e.target.value })} /><input placeholder="描述（可选）" value={rewardDraft.description} onChange={(e) => setRewardDraft({ ...rewardDraft, description: e.target.value })} /><div><input aria-label="图标" maxLength={2} value={rewardDraft.icon} onChange={(e) => setRewardDraft({ ...rewardDraft, icon: e.target.value })} /><input type="number" min="1" value={rewardDraft.cost} onChange={(e) => setRewardDraft({ ...rewardDraft, cost: e.target.value })} /></div><button>添加奖励</button></form></div></div><div className="settings-row"><label>修改 PIN <input inputMode="numeric" maxLength={4} defaultValue={state.settings.pin} onBlur={(e) => /^\d{4}$/.test(e.target.value) && onChange(updatePin(state, e.target.value), 'PIN 已更新')} /></label><button className="reset" onClick={() => window.confirm('确定恢复默认任务、奖励和所有打卡数据吗？') && onChange(resetToDefaults(state, date), '已恢复默认数据')}>恢复默认数据</button></div></section>
}
