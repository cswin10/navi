import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  // Normalize to start of day for comparison
  d.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const diffMs = now.getTime() - d.getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return 'Today'
  } else if (days === -1) {
    return 'Tomorrow'
  } else if (days < -1 && days >= -7) {
    return `In ${Math.abs(days)} days`
  } else if (days === 1) {
    return 'Overdue'
  } else if (days > 1 && days < 7) {
    return `Overdue`
  } else if (days < -7) {
    // Future date more than a week away
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  } else {
    // Past date more than a week ago
    return 'Overdue'
  }
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
