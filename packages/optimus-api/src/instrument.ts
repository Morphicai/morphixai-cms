import * as Sentry from "@sentry/nestjs";

Sentry.init({
    dsn: "https://3e2f18577f1b3964b4cc4dc71b36e8a2@o4509167367028736.ingest.de.sentry.io/4510385649942608",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    enableLogs: true,
    sendDefaultPii: true,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 1 : 1.0,
    // Set environment
    environment: process.env.NODE_ENV || "development",
});
