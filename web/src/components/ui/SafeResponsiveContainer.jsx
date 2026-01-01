import React, { useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * SafeResponsiveContainer
 * Renders `ResponsiveContainer` only after the component is mounted on the client.
 * This prevents Recharts from attempting to measure a container during SSR
 * or when the parent is temporarily hidden (which can result in width/height -1 warnings).
 */
export default function SafeResponsiveContainer({ width = '100%', height = '100%', children, minHeight = 120 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to ensure layout is stable
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    // Render a placeholder with the same CSS footprint so layout doesn't jump
    const style = typeof height === 'string' && height.endsWith('px') ? { height } : { minHeight };
    return <div style={{ width, ...style }} className="w-full h-full" />;
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight }} className="recharts-wrapper-safe">
      <ResponsiveContainer width={width} height={height} minHeight={minHeight}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
