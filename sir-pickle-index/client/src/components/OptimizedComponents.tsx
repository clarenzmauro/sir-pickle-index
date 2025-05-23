import React, { memo, lazy, Suspense } from 'react';

// Performance-optimized wrapper with memo
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

// Lazy loading wrapper with suspense
export const withLazy = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: P) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Loading placeholder component
export const LoadingPlaceholder: React.FC<{ 
  height?: number; 
  className?: string;
}> = memo(({ height = 100, className = '' }) => (
  <div 
    className={`loading-placeholder ${className}`}
    style={{ 
      height: `${height}px`,
      backgroundColor: 'var(--primary-color)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-color)',
      fontSize: '0.9em',
      opacity: 0.7,
      animation: 'pulse 1.5s ease-in-out infinite'
    }}
  >
    Loading...
  </div>
));

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

// Optimized image component with lazy loading
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}> = memo(({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  loading = 'lazy' 
}) => (
  <img
    src={src}
    alt={alt}
    className={className}
    width={width}
    height={height}
    loading={loading}
    decoding="async"
    style={{
      willChange: 'auto',
      transform: 'translateZ(0)', // Hardware acceleration
    }}
  />
));

OptimizedImage.displayName = 'OptimizedImage';

// Virtualized list item wrapper
export const VirtualizedItem: React.FC<{
  children: React.ReactNode;
  index: number;
  isVisible: boolean;
  height?: number;
}> = memo(({ children, index, isVisible, height = 'auto' }) => {
  if (!isVisible) {
    return (
      <div 
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          visibility: 'hidden' 
        }} 
      />
    );
  }

  return (
    <div 
      data-index={index}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        contain: 'layout style paint',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </div>
  );
});

VirtualizedItem.displayName = 'VirtualizedItem'; 