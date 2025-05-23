import { useCallback, useMemo, useRef, useState, useEffect } from 'react';

/**
 * Custom hook for performance optimizations
 */
export const usePerformance = () => {
  const frameRef = useRef<number | undefined>(undefined);
  const [isHighPerformanceMode, setIsHighPerformanceMode] = useState(true);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Optimize animations based on device capabilities
  useEffect(() => {
    const checkPerformance = () => {
      // Check for high-performance capabilities
      const hasGoodPerformance = 
        window.devicePixelRatio <= 2 && 
        navigator.hardwareConcurrency >= 4;
      
      setIsHighPerformanceMode(hasGoodPerformance);
    };

    checkPerformance();
  }, []);

  /**
   * Request animation frame with cleanup
   */
  const requestAnimationFrame = useCallback((callback: () => void) => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(callback);
  }, []);

  /**
   * Batched update utility
   */
  const batchedUpdate = useCallback((updateFn: () => void) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(updateFn, { timeout: 100 });
    } else {
      setTimeout(updateFn, 0);
    }
  }, []);

  return {
    isHighPerformanceMode,
    prefersReducedMotion,
    requestAnimationFrame,
    batchedUpdate,
  };
};

/**
 * Hook for debounced values
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for debounced callbacks
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<number | undefined>(undefined);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
};

/**
 * Hook for throttled callbacks
 */
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastRanRef = useRef<number>(0);
  
  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRanRef.current >= delay) {
        lastRanRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Hook for intersection observer with performance optimizations
 */
export const useIntersectionObserver = (
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { targetRef, isIntersecting };
};

/**
 * Hook for optimized state updates without circular dependency
 */
export const useOptimizedState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdateRef = useRef<T | null>(null);

  const setOptimizedState = useCallback((newState: T | ((prevState: T) => T)) => {
    const nextState = typeof newState === 'function' 
      ? (newState as (prevState: T) => T)(pendingUpdateRef.current || state)
      : newState;
    
    pendingUpdateRef.current = nextState;
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        setState(pendingUpdateRef.current!);
        pendingUpdateRef.current = null;
      }, { timeout: 100 });
    } else {
      setTimeout(() => {
        setState(pendingUpdateRef.current!);
        pendingUpdateRef.current = null;
      }, 0);
    }
  }, [state]);

  return [state, setOptimizedState] as const;
}; 