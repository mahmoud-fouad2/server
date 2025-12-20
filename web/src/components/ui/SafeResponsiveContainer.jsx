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
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder with the same CSS footprint so layout doesn't jump
    const style = typeof height === 'string' && height.endsWith('px') ? { height } : { minHeight };
    return <div style={{ width, ...style }} />;
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      {children}
    </ResponsiveContainer>
  );
}
