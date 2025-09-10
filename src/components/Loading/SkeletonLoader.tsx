import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', height = 'h-4', width = 'w-full', rounded = true }: SkeletonProps) {
  return (
    <div 
      className={`bg-gray-200 animate-pulse ${height} ${width} ${rounded ? 'rounded' : ''} ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <Skeleton height="h-6" width="w-32" />
        <Skeleton height="h-8" width="w-8" className="rounded-lg" />
      </div>
      <Skeleton height="h-8" width="w-20" className="mb-2" />
      <Skeleton height="h-4" width="w-24" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header Skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton height="h-8" width="w-48" className="mb-2" />
            <Skeleton height="h-4" width="w-64" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <Skeleton height="h-8" width="w-8" className="mx-auto mb-1" />
              <Skeleton height="h-3" width="w-8" />
            </div>
            <div className="text-center">
              <Skeleton height="h-8" width="w-8" className="mx-auto mb-1" />
              <Skeleton height="h-3" width="w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <Skeleton height="h-8" width="w-8" />
              <Skeleton height="h-6" width="w-6" />
            </div>
            <Skeleton height="h-6" width="w-32" className="mb-2" />
            <Skeleton height="h-4" width="w-48" className="mb-4" />
            <Skeleton height="h-10" width="w-24" className="rounded-lg" />
          </div>
        ))}
      </div>

      {/* Recent Progress Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <Skeleton height="h-6" width="w-32" className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton height="h-8" width="w-8" className="rounded-lg" />
                <div>
                  <Skeleton height="h-4" width="w-24" className="mb-1" />
                  <Skeleton height="h-3" width="w-32" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton height="h-4" width="w-8" />
                <Skeleton height="h-2" width="w-2" className="rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="h-4" width="w-16" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-2">
            <Skeleton height="h-4" width="w-8" />
            <Skeleton height="h-4" width="w-20" />
            <Skeleton height="h-4" width="w-12" />
            <Skeleton height="h-4" width="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
