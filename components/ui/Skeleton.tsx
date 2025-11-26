'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-700/50',
        className
      )}
    />
  )
}

// Pre-built skeleton patterns for common use cases
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonTaskCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-5 w-5 rounded-md flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonNoteCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Today's Focus */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <SkeletonTaskCard />
          <SkeletonTaskCard />
          <SkeletonTaskCard />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonTasksPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, col) => (
          <div key={col} className="bg-slate-800/30 rounded-xl p-4">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonTaskCard key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonNotesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <Skeleton className="h-4 w-16 mb-4" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonNoteCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
