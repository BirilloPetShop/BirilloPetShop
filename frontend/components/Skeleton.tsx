import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** Basic skeleton block — pass className for width/height */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

/** Skeleton that looks like a ProductCard */
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
    {/* Image area */}
    <div className="skeleton h-52 w-full rounded-none" />
    {/* Content */}
    <div className="p-5 space-y-3">
      {/* Category */}
      <div className="skeleton h-3 w-16" />
      {/* Title */}
      <div className="skeleton h-5 w-3/4" />
      {/* Divider */}
      <div className="border-t border-stone-50 pt-3 flex items-center justify-between">
        {/* Price */}
        <div className="skeleton h-6 w-20" />
        {/* Button */}
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);

/** Row of skeleton text lines */
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`skeleton h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

/** Skeleton grid of product cards */
export const SkeletonGrid: React.FC<{ count?: number; columns?: string }> = ({
  count = 6,
  columns = 'grid-cols-2 md:grid-cols-3',
}) => (
  <div className={`grid ${columns} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
