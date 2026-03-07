import React from 'react';

/** Animated shimmer placeholder for loading states */
const Shimmer = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`bg-[#E7E5E4] rounded-lg animate-pulse ${className}`}
    style={style}
  />
);

/** KPI card skeleton */
export const KPICardSkeleton = () => (
  <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
    <Shimmer className="h-3 w-24 mb-4" />
    <Shimmer className="h-9 w-16 mb-2" />
    <Shimmer className="h-2.5 w-20" />
  </div>
);

/** Table row skeleton */
export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <div className="flex items-center gap-4 py-4 px-6 animate-pulse">
    <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
    {Array.from({ length: cols }).map((_, i) => (
      <Shimmer
        key={i}
        className={`h-3 flex-1 ${i === 0 ? 'max-w-[160px]' : 'max-w-[100px]'}`}
      />
    ))}
  </div>
);

/** Card skeleton for project/person cards */
export const CardSkeleton = () => (
  <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <Shimmer className="h-3.5 w-32 mb-2" />
        <Shimmer className="h-2.5 w-20" />
      </div>
    </div>
    <Shimmer className="h-2 w-full mb-3" />
    <div className="flex gap-2">
      <Shimmer className="h-5 w-14 rounded-full" />
      <Shimmer className="h-5 w-14 rounded-full" />
    </div>
  </div>
);

/** Chart area skeleton */
export const ChartSkeleton = () => (
  <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 shadow-sm animate-pulse">
    <div className="flex justify-between items-center mb-8">
      <Shimmer className="h-5 w-48" />
      <div className="flex gap-2">
        <Shimmer className="h-8 w-16 rounded-lg" />
        <Shimmer className="h-8 w-16 rounded-lg" />
      </div>
    </div>
    <div className="flex items-end gap-2 h-48">
      {Array.from({ length: 8 }).map((_, i) => (
        <Shimmer
          key={i}
          className="flex-1 rounded-t-md"
          style={{ height: `${30 + Math.random() * 70}%` } as React.CSSProperties}
        />
      ))}
    </div>
  </div>
);

/** Full-page loading state for route transitions */
export const PageSkeleton = () => (
  <div className="p-10 max-w-[1600px] mx-auto animate-pulse">
    <div className="flex justify-between items-center mb-10">
      <div>
        <Shimmer className="h-8 w-48 mb-3" />
        <Shimmer className="h-3 w-64" />
      </div>
      <div className="flex gap-3">
        <Shimmer className="h-10 w-28 rounded-lg" />
        <Shimmer className="h-10 w-28 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-6 mb-8">
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
    </div>
    <ChartSkeleton />
  </div>
);

/** List skeleton */
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white border border-[#E7E5E4] rounded-xl shadow-sm overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className={`${i > 0 ? 'border-t border-[#F5F5F4]' : ''}`}
      >
        <TableRowSkeleton />
      </div>
    ))}
  </div>
);
