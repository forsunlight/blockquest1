import { useEffect, useState } from 'react'
import { todayKey } from '../lib/gameState'

/** Refresh at local midnight and when an iPad resumes a suspended app. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayKey())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      setToday(todayKey())
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 100)
    }
    refresh()
    const interval = setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return today
}
