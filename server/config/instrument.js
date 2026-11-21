import * as Sentry from '@sentry/node';
// Telemetry is opt-in, with request bodies and default personal data excluded.
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, sendDefaultPii: false, tracesSampleRate: 0.05,
    beforeSend(event) { if (event.request) { delete event.request.data; delete event.request.headers; delete event.request.cookies; } return event; } });
}
