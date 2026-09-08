import { useState } from 'react'
import type { GameState } from '../lib/gameState'
import { dateLabel, daySummary, monthCells, shiftMonth } from '../lib/calendar'
import { sortTasksByTime } from '../lib/taskOrder'

type Props = { state: GameState; today: string; onToday: () => void }

export function Calendar({ state, today, onToday }: Props) {
  const [selection, setSelection] = useState<string | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const selected = selection ?? today
  const month = shiftMonth(today.slice(0, 7), monthOffset)
  const record = selected <= today ? state.days[selected] : undefined
  const summary = daySummary(record)
  const future = selected > today
  const monthRecords = Object.entries(state.days).filter(([date]) => date.startsWith(month) && date <= today)
  const fullDays = monthRecords.filter(([, record]) => daySummary(record).full).length
  const activeDays = monthRecords.filter(([, record]) => daySummary(record).completed > 0).length

  return <section className="page calendar-page" aria-label="冒险日历">
    <div className="calendar-board">
      <div className="calendar-intro"><span aria-hidden="true">📅</span><div><p>每一小步，都值得记住</p><h1>冒险日历</h1></div></div>
      <div className="month-controls">
        <button aria-label="上个月" onClick={() => setMonthOffset(value => value - 1)}>‹</button>
        <h2 aria-live="polite">{Number(month.slice(0, 4))}年{Number(month.slice(5))}月</h2>
        <button aria-label="下个月" onClick={() => setMonthOffset(value => value + 1)}>›</button>
      </div>
      <div className="calendar-week" aria-hidden="true">{['一', '二', '三', '四', '五', '六', '日'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-days">
        {monthCells(month).map(date => {
          const day = daySummary(date <= today ? state.days[date] : undefined)
          const label = date > today ? '未开始' : day.full ? '全完成' : day.recorded ? `${day.completed}/${day.total}` : '无记录'
          return <button key={date} aria-label={`${date} ${label}`} aria-pressed={date === selected}
            aria-current={date === today ? 'date' : undefined}
            className={`calendar-day ${date.startsWith(month) ? '' : 'outside'} ${day.full ? 'full' : day.completed ? 'partial' : ''} ${date === selected ? 'selected' : ''}`}
            onClick={() => setSelection(date === today ? null : date)}>
            <b>{Number(date.slice(8))}</b><small>{date === today ? '今天 · ' : ''}{label}</small>
          </button>
        })}
      </div>
      <div className="calendar-legend"><span>◆ 全部完成</span><span>◐ 部分完成</span><span>— 无记录</span></div>
      <div className="calendar-month-summary"><span>本月打卡 <b>{activeDays}</b> 天 · 全完成 <b>{fullDays}</b> 天</span><button onClick={() => { setSelection(null); setMonthOffset(0) }}>回到今天</button></div>
    </div>
    <section className="day-details" aria-label="所选日期的任务">
      <div className="section-head"><div><p>{selected.slice(0, 4)}年 · {selected === today ? '今天的冒险' : '成长足迹'}</p><h2>{dateLabel(selected)}</h2></div><span className="day-badge">{future ? '未开始' : !record ? '无记录' : summary.full ? '全部完成' : '任务记录'}</span></div>
      {record ? <>
        <p className="day-count">完成 <b>{summary.completed}/{summary.total}</b> · 跳过 {summary.skipped} 项</p>
        <div className="progress-track"><span style={{ width: `${summary.total ? summary.completed / summary.total * 100 : 0}%` }} /></div>
        {record.reconstructed && <p className="legacy-note">旧版记录：完成状态已保留；当时未保存任务清单，名称与总数参考现有任务，可能与当天不同。</p>}
        <div className="history-tasks">{sortTasksByTime(record.taskSnapshot ?? []).map(task => {
          const status = record.tasks[task.id]
          return <article key={task.id} className={`history-task ${status ?? 'pending'}`}>
            <span className="history-check" aria-hidden="true">{status === 'completed' ? '✓' : status === 'skipped' ? '↷' : '□'}</span>
            <div><small>{task.time || '未指定时间'}</small><h3>{task.title}</h3></div>
            <b>{status === 'completed' ? '已完成' : status === 'skipped' ? '已跳过' : '未完成'}</b>
          </article>
        })}</div>
        {!summary.total && <p className="empty-card">这一天没有安排任务。</p>}
        {record.bonusAwarded && <p className="day-treasure">🎁 这一天已领取全完成宝箱奖励</p>}
      </> : <div className="history-empty"><span aria-hidden="true">{future ? '🌱' : '📖'}</span><h3>{future ? '新的冒险，还未开始' : '这一天没有保存记录'}</h3><p>{future ? '到了这一天，完成任务就会留下成长足迹。' : '没有记录不代表没有努力。从今天开始记录每一步！'}</p></div>}
      {selected === today ? <button className="calendar-action" onClick={onToday}>去完成今天的任务 →</button> : <p className="history-hint">这里只查看记录，不会修改打卡或发放奖励。</p>}
    </section>
  </section>
}
