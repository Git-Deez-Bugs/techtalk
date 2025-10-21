import { useEffect, useRef } from 'react'

export function useAutoScroll(dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerElem = containerRef.current;

    if (containerElem) {
      containerElem.scrollTop = containerElem.scrollHeight;
    }
  }, [dependencies])

  return containerRef;
}