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
  
  return (props: P) => React.createElement(
    Suspense,
    { fallback: fallback || React.createElement('div', null, 'Loading...') },
    React.createElement(LazyComponent, props)
  );
}; 