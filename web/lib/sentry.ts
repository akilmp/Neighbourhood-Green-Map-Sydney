import * as Sentry from '@sentry/browser';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const analyticsDisabled =
  process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === 'true';

if (dsn && !analyticsDisabled) {
  Sentry.init({ dsn });
}

export default Sentry;
