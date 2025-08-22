import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounce hook for performance optimization
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

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

// Throttle hook for limiting function calls
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Memoized service configuration selector
export const useServiceConfig = (serviceName, servicesConfig) => {
  return useMemo(() => {
    if (!servicesConfig || !serviceName) return null;
    return servicesConfig[serviceName];
  }, [serviceName, servicesConfig]);
};

// Memoized enabled services count
export const useEnabledServicesCount = (services) => {
  return useMemo(() => {
    if (!services) return 0;
    return Object.values(services).filter(service => service?.enabled).length;
  }, [services]);
};

// Memoized provider regions
export const useProviderRegions = (providerType, providersConfig) => {
  return useMemo(() => {
    if (!providersConfig || !providerType) return [];
    return providersConfig[providerType]?.regions || [];
  }, [providerType, providersConfig]);
};

// Optimized field validation hook
export const useFieldValidation = (fieldConfig, value, fieldName) => {
  return useMemo(() => {
    if (!fieldConfig) return [];

    // Import validation function dynamically to avoid circular dependencies
    const validateField = require('./configValidator').validateField;
    return validateField(fieldConfig, value, fieldName);
  }, [fieldConfig, value, fieldName]);
};

// Virtual scrolling hook for large lists
export const useVirtualization = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  return {
    ...visibleItems,
    setScrollTop
  };
};

// Lazy loading hook for components
export const useLazyComponent = (importFunction) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    setError(null);

    try {
      const module = await importFunction();
      setComponent(() => module.default || module);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [importFunction, Component, loading]);

  return { Component, loading, error, loadComponent };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options]);

  return [targetRef, isIntersecting];
};

// Memory usage monitoring (development only)
export const useMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !performance.memory) {
      return;
    }

    const updateMemoryUsage = () => {
      const memory = performance.memory;
      setMemoryUsage({
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      });
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};

// Component render counter (development only)
export const useRenderCounter = (componentName) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};

// Optimized event handlers
export const useOptimizedHandlers = () => {
  // Memoized click handler
  const createClickHandler = useCallback((callback, ...args) => {
    return useCallback((event) => {
      event.preventDefault();
      callback(...args);
    }, [callback, ...args]);
  }, []);

  // Memoized change handler
  const createChangeHandler = useCallback((callback, fieldName) => {
    return useCallback((event) => {
      const value = event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
      callback(fieldName, value);
    }, [callback, fieldName]);
  }, []);

  return {
    createClickHandler,
    createChangeHandler
  };
};

// Bundle size analysis helper
export const getBundleInfo = () => {
  if (process.env.NODE_ENV !== 'development') return null;

  return {
    chunks: window.__webpack_require__ ?
      Object.keys(window.__webpack_require__.cache || {}).length : 0,
    modules: window.__webpack_require__ ?
      Object.keys(window.__webpack_require__.cache || {}).filter(
        key => window.__webpack_require__.cache[key].exports
      ).length : 0
  };
};

export default {
  useDebounce,
  useThrottle,
  useServiceConfig,
  useEnabledServicesCount,
  useProviderRegions,
  useFieldValidation,
  useVirtualization,
  useLazyComponent,
  useIntersectionObserver,
  useMemoryMonitor,
  useRenderCounter,
  useOptimizedHandlers,
  getBundleInfo
};
