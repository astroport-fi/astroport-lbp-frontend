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
