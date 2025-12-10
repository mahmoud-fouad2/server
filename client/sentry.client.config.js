import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Reduce sample rates to minimize potential conflicts
  tracesSampleRate: 0.1,

  // Disable debug in production
  debug: false,

  // Reduce replay sample rates
  replaysOnErrorSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,

  // Use minimal integrations to avoid conflicts
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
