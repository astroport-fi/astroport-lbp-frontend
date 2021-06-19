import { useEffect } from 'react';

export function useRefreshingEffect(fn, timeout, deps=[]) {
  useEffect(() => {
    // Invoke immediately
    fn();

    // And then every specified ms
    const interval = setInterval(fn, timeout);

    return () => clearInterval(interval);

  /* eslint-disable react-hooks/exhaustive-deps */
  }, deps);
};

export function useDebouncedEffect(fn, delay, deps) {
  useEffect(() => {
    const timeout = setTimeout(fn, delay);

    return () => clearTimeout(timeout);
  }, deps);
};
