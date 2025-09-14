import { useEffect, useState, useRef } from "react";

export function useRouteTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0); // seconds
  const startTime = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      if (!startTime.current) {
        startTime.current = Date.now();
      }

      timer.current = setInterval(() => {
        if (startTime.current) {
          const now = Date.now();
          setElapsed(Math.floor((now - startTime.current) / 1000));
        }
      }, 1000);
    } else {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      startTime.current = null;
      setElapsed(0);
    }

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [active]);

  return elapsed;
}
