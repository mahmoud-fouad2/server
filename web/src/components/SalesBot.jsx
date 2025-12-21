'use client';

// IMPORTANT: Avoid duplicate widget injection.
// The widget is injected via `WidgetLoader` in the root layout.
// This component remains for backward compatibility, but delegates to the single loader.

import WidgetLoader from '@/components/WidgetLoader';

export default function SalesBot() {
  return <WidgetLoader />;
}
