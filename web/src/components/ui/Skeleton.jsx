import React from 'react';

/**
 * Skeleton Loading Components for Faheemly
 * Improves perceived performance during data loading
 */

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl p-8">
        {/* Icon placeholder */}
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-2xl mb-6"></div>

        {/* Title placeholder */}
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 mb-4"></div>

        {/* Description placeholder */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
        </div>

        {/* Features placeholder */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonSolutionCard = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl overflow-hidden">
        {/* Image placeholder */}
        <div className="h-56 bg-gray-300 dark:bg-gray-600"></div>

        {/* Content placeholder */}
        <div className="p-6">
          <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-6"></div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-gray-300 dark:bg-gray-600 rounded-xl mb-5">
            <div className="text-center">
              <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded mb-2"></div>
              <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded"></div>
            </div>
            <div className="text-center">
              <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded mb-2"></div>
              <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded"></div>
            </div>
          </div>

          {/* Button */}
          <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonPricingCard = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
      </div>
    </div>
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-300 dark:bg-gray-600 rounded"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        ></div>
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`animate-pulse ${className}`}>
      <div
        className={`${sizes[size]} bg-gray-300 dark:bg-gray-600 rounded-full`}
      ></div>
    </div>
  );
};

export const SkeletonButton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-xl w-full"></div>
    </div>
  );
};

export const SkeletonImage = ({ className = '', aspectRatio = '16/9' }) => {
  return (
    <div className={`animate-pulse ${className}`} style={{ aspectRatio }}>
      <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SkeletonHero = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-full w-48 mx-auto mb-8"></div>

        {/* Title */}
        <div className="space-y-4 mb-8">
          <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg w-full"></div>
          <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg w-5/6 mx-auto"></div>
        </div>

        {/* Description */}
        <div className="space-y-3 mb-10">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-full mx-auto max-w-3xl"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mx-auto max-w-3xl"></div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <div className="h-14 bg-gray-300 dark:bg-gray-600 rounded-full w-40"></div>
          <div className="h-14 bg-gray-300 dark:bg-gray-600 rounded-full w-32"></div>
        </div>
      </div>
    </div>
  );
};

// Loading container with pulse animation
export const LoadingContainer = ({ children, isLoading, skeleton }) => {
  if (isLoading) {
    return skeleton || <SkeletonCard />;
  }
  return children;
};

/**
 * Dashboard-specific Skeletons
 */
export const SkeletonDashboardStats = ({ className = '' }) => {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-300 dark:bg-cosmic-700 rounded w-24"></div>
            <div className="h-10 w-10 bg-gray-300 dark:bg-cosmic-700 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-300 dark:bg-cosmic-700 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-cosmic-700 rounded w-32"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonConversationList = ({ rows = 8, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-panel p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-12 w-12 bg-gray-300 dark:bg-cosmic-700 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-32"></div>
                <div className="h-3 bg-gray-300 dark:bg-cosmic-700 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-300 dark:bg-cosmic-700 rounded w-full"></div>
              <div className="h-3 bg-gray-300 dark:bg-cosmic-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonKnowledgeBaseCard = ({ className = '' }) => {
  return (
    <div className={`glass-panel p-6 animate-pulse ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-300 dark:bg-cosmic-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-5/6"></div>
        </div>
        <div className="h-10 w-10 bg-gray-300 dark:bg-cosmic-700 rounded-lg flex-shrink-0"></div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-300 dark:bg-cosmic-700 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-300 dark:bg-cosmic-700 rounded-full"></div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-cosmic-700">
        <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-24"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-300 dark:bg-cosmic-700 rounded"></div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-cosmic-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonWidgetPreview = ({ className = '' }) => {
  return (
    <div className={`glass-panel p-8 animate-pulse ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-gray-300 dark:bg-cosmic-700 rounded w-40"></div>
        <div className="h-10 w-32 bg-gray-300 dark:bg-cosmic-700 rounded-lg"></div>
      </div>

      <div className="border-2 border-dashed border-gray-300 dark:border-cosmic-700 rounded-2xl p-8 mb-6">
        <div className="h-64 bg-gray-300 dark:bg-cosmic-700 rounded-xl mb-4"></div>
        <div className="flex gap-4 justify-center">
          <div className="h-10 w-10 bg-gray-300 dark:bg-cosmic-700 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-300 dark:bg-cosmic-700 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-300 dark:bg-cosmic-700 rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-20"></div>
          <div className="h-10 bg-gray-300 dark:bg-cosmic-700 rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-20"></div>
          <div className="h-10 bg-gray-300 dark:bg-cosmic-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonChart = ({ className = '' }) => {
  return (
    <div className={`glass-panel p-6 animate-pulse ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-gray-300 dark:bg-cosmic-700 rounded w-40"></div>
        <div className="h-8 w-24 bg-gray-300 dark:bg-cosmic-700 rounded-lg"></div>
      </div>

      <div className="h-64 flex items-end gap-2 mb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-300 dark:bg-cosmic-700 rounded-t"
            style={{ height: `${Math.random() * 70 + 30}%` }}
          ></div>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-cosmic-700">
        <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-32"></div>
        <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-32"></div>
      </div>
    </div>
  );
};
