import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://2b5faea7913b0cb22a42d94bf81e9e9b@o4511658006282240.ingest.de.sentry.io/4511658018013264",

  integrations: [nodeProfilingIntegration(),
    Sentry.mongoIntegration()
  ],

//   tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});