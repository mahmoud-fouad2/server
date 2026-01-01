import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * SafeResponsiveContainer
 * Renders `ResponsiveContainer` only after the component is mounted on the client.
 * This prevents Recharts from attempting to measure a container during SSR
 * or when the parent is temporarily hidden (which can result in width/height -1 warnings).
 */
export default function SafeResponsiveContainer({ width = '100%', height = '100%', children, minHeight = 120 }) {
  const wrapperRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer;
    let timer;

    const updateReady = () => {
      if (cancelled) return;
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Recharts can warn with width/height -1 when container is hidden.
      // Only render the chart once we can measure a positive size.
      if (rect.width > 0 && rect.height > 0) {
        setReady(true);
      }
    };

    // Run once after mount, then keep tracking size changes.
    timer = setTimeout(updateReady, 0);
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateReady);
      if (wrapperRef.current) observer.observe(wrapperRef.current);
    } else {
      // Fallback: give layout a moment to settle.
      timer = setTimeout(updateReady, 200);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%', minHeight }} className="recharts-wrapper-safe">
      {ready ? (
        <ResponsiveContainer width={width} height={height} minHeight={minHeight}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
