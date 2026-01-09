import { useEffect, useRef, useState } from "react";

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastExecuted.current >= delay) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThrottledValue(value);
      lastExecuted.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastExecuted.current = now;
      }, delay - (now - lastExecuted.current));
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}
