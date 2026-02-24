import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Sentry Monitoring" };

export default function SentryPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Sentry Monitoring</h1>
      <p className="lead">
        Sentry provides error tracking, performance monitoring, and session
        replay. It catches client-side and server-side errors automatically.
      </p>

      <h2>What Sentry Does</h2>
      <ul>
        <li><strong>Error tracking</strong> — Captures unhandled exceptions with full stack traces</li>
        <li><strong>Performance monitoring</strong> — Tracks page load times, API latency</li>
        <li><strong>Session replay</strong> — Records user sessions when errors occur (for debugging)</li>
        <li><strong>Alerts</strong> — Sends notifications when error thresholds are breached</li>
        <li><strong>Release tracking</strong> — Associates errors with specific deployments</li>
      </ul>

      <h2>Setting Up Sentry</h2>
      <ol>
        <li>Go to <a href="https://sentry.io/signup" target="_blank" rel="noopener noreferrer">sentry.io/signup</a> and create an account</li>
        <li>Create a new project → Select <strong>Next.js</strong> as the platform</li>
        <li>Note the <strong>DSN</strong> from the setup wizard</li>
        <li>Go to <strong>Settings → Organization</strong> to find your org slug</li>
        <li>Go to <strong>Settings → Projects</strong> to find your project slug</li>
      </ol>

      <h3>Environment Variables</h3>
      <pre><code>{`NEXT_PUBLIC_SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=superteam-academy`}</code></pre>

      <h2>Configuration Files</h2>
      <p>
        Sentry is configured via three files in the <code>app/</code> root:
      </p>

      <h3>sentry.client.config.ts</h3>
      <p>Client-side configuration (runs in the browser):</p>
      <ul>
        <li><strong>Trace sample rate</strong>: 10% (<code>tracesSampleRate: 0.1</code>)</li>
        <li><strong>Session replay</strong>: Disabled normally, 100% capture on error (<code>replaysOnErrorSampleRate: 1.0</code>)</li>
        <li>Replay integration is lazy-loaded to reduce bundle size</li>
      </ul>

      <h3>sentry.server.config.ts</h3>
      <p>Server-side configuration (runs in Node.js):</p>
      <ul>
        <li><strong>Trace sample rate</strong>: 10%</li>
        <li>Minimal configuration — most server errors are automatically captured</li>
      </ul>

      <h3>sentry.edge.config.ts</h3>
      <p>Edge runtime configuration (for middleware/edge functions):</p>
      <ul>
        <li>Same configuration as server</li>
      </ul>

      <h2>Instrumentation</h2>
      <p>
        The file <code>src/instrumentation.ts</code> handles conditional import:
      </p>
      <ul>
        <li>Node.js runtime → imports <code>sentry.server.config.ts</code></li>
        <li>Edge runtime → imports <code>sentry.edge.config.ts</code></li>
        <li>Exports <code>onRequestError</code> for automatic request error capture</li>
      </ul>

      <h2>Next.js Integration</h2>
      <p>
        Sentry wraps the Next.js config in <code>next.config.ts</code> via
        <code>withSentryConfig()</code>. Current settings:
      </p>
      <ul>
        <li><strong>Source maps</strong>: Disabled (<code>sourcemaps.disable: true</code>) — enable for production debugging</li>
        <li><strong>Tree shaking</strong>: Logger statements removed in production</li>
        <li><strong>Tunnel route</strong>: Not configured (direct DSN reporting)</li>
      </ul>

      <h2>Using the Sentry Dashboard</h2>

      <h3>Viewing Errors</h3>
      <ol>
        <li>Go to <strong>Sentry Dashboard → Issues</strong></li>
        <li>Errors are grouped by type and message</li>
        <li>Click an issue to see stack traces, breadcrumbs, and user context</li>
      </ol>

      <h3>Performance</h3>
      <ol>
        <li>Go to <strong>Performance → Overview</strong></li>
        <li>View page load times, API response times, and Web Vitals</li>
        <li>Identify slow transactions and bottlenecks</li>
      </ol>

      <h3>Session Replay</h3>
      <p>
        When an error occurs, Sentry records a replay of the user&apos;s session
        leading up to the error. Find these under <strong>Replays</strong> or
        attached to individual error reports.
      </p>

      <h3>Setting Up Alerts</h3>
      <ol>
        <li>Go to <strong>Alerts → Create Alert</strong></li>
        <li>Choose alert type: error count, performance threshold, etc.</li>
        <li>Configure conditions (e.g., &quot;more than 10 errors in 1 hour&quot;)</li>
        <li>Set notification channels: email, Slack, PagerDuty, etc.</li>
      </ol>

      <h2>Best Practices</h2>
      <ul>
        <li>Keep the sample rate at 10% to stay within free tier limits</li>
        <li>Enable source maps in production for readable stack traces</li>
        <li>Set up alerts for critical error spikes</li>
        <li>Review the Issues page weekly to address recurring errors</li>
        <li>Use Sentry&apos;s Release feature to tag deployments</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
