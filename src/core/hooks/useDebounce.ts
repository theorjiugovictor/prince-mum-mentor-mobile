// hooks/useDebounce.ts
import { useEffect, useState } from "react";

export function useDebounce(value: string, delay = 1000) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
