import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'high' | 'medium' | 'low' | 'todo' | 'in_progress' | 'done'
  children: ReactNode
}

export function Badge({ variant = 'default', children, className, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-700 text-slate-300',
    high: 'bg-red-500/20 text-red-400 border border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border border-green-500/30',
    todo: 'bg-slate-600/20 text-slate-400 border border-slate-600/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    done: 'bg-green-500/20 text-green-400 border border-green-500/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
