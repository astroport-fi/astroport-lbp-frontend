import { useEffect } from 'react';

export function useRefreshingEffect(fn, timeout, deps=[]) {
  useEffect(() => {
    // Invoke immediately
    fn();

    // And then every specified ms
    // passing true to the function for refresh-specific logic
    const interval = setInterval(fn, timeout, true);

    return () => clearInterval(interval);

  /* eslint-disable react-hooks/exhaustive-deps */
  }, deps);
};
