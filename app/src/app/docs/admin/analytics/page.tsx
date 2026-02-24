import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Analytics</h1>
      <p className="lead">
        Superteam Academy uses dual analytics: Google Analytics 4 for traffic
        and acquisition metrics, and PostHog for product analytics and user
        behavior tracking.
      </p>

      <h2>Analytics Architecture</h2>
      <p>
        The <code>AnalyticsProvider</code> component wraps the app and initializes
        both analytics services. A unified <code>trackEvent()</code> function
        dispatches events to both GA4 and PostHog simultaneously.
      </p>

      <h2>Google Analytics 4 (GA4)</h2>

      <h3>What GA4 Does</h3>
      <ul>
        <li><strong>Traffic analysis</strong> — Page views, user sources, geography</li>
        <li><strong>Acquisition</strong> — How users find the platform</li>
        <li><strong>Engagement</strong> — Session duration, pages per session</li>
        <li><strong>Conversions</strong> — Custom events (enrollment, course completion)</li>
      </ul>

      <h3>Setting Up GA4</h3>
      <ol>
        <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">analytics.google.com</a></li>
        <li>Create a new property → Select &quot;Web&quot;</li>
        <li>Enter your site URL and stream name</li>
        <li>Copy the <strong>Measurement ID</strong> (starts with <code>G-</code>)</li>
        <li>Set <code>NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX</code> in your <code>.env.local</code></li>
      </ol>

      <h3>How It&apos;s Loaded</h3>
      <p>
        The GA4 script (<code>gtag.js</code>) is lazy-loaded to avoid impacting
        page load performance. It&apos;s injected by the AnalyticsProvider only when
        the measurement ID is configured.
      </p>

      <h2>PostHog</h2>

      <h3>What PostHog Does</h3>
      <ul>
        <li><strong>Product analytics</strong> — Feature usage, user flows</li>
        <li><strong>Funnels</strong> — Track conversion through signup → enrollment → completion</li>
        <li><strong>Cohort analysis</strong> — Compare user groups</li>
        <li><strong>Feature flags</strong> — Gradual feature rollouts (if configured)</li>
        <li><strong>Session recordings</strong> — Visual user session recordings</li>
      </ul>

      <h3>Setting Up PostHog</h3>
      <ol>
        <li>Go to <a href="https://posthog.com" target="_blank" rel="noopener noreferrer">posthog.com</a> and create an account</li>
        <li>Create a new project</li>
        <li>Go to <strong>Settings → Project API Key</strong></li>
        <li>Copy the API key and host URL</li>
        <li>Set environment variables:
          <pre><code>{`NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`}</code></pre>
        </li>
      </ol>

      <h3>Configuration Details</h3>
      <ul>
        <li><strong>Person profiles</strong>: <code>identified_only</code> — Only identified (signed-in) users get profiles</li>
        <li><strong>Auto-capture</strong>: Enabled by default</li>
        <li><strong>Session recording</strong>: Configurable in PostHog dashboard</li>
      </ul>

      <h2>Custom Events</h2>
      <p>
        Both analytics platforms receive custom events through the unified
        <code>trackEvent()</code> function:
      </p>
      <table>
        <thead>
          <tr><th>Event</th><th>When Fired</th></tr>
        </thead>
        <tbody>
          <tr><td><code>page_view</code></td><td>On every route change</td></tr>
          <tr><td><code>sign_in</code></td><td>When user signs in</td></tr>
          <tr><td><code>enroll</code></td><td>When user enrolls in a course</td></tr>
          <tr><td><code>lesson_complete</code></td><td>When user completes a lesson</td></tr>
          <tr><td><code>course_complete</code></td><td>When user finishes all lessons in a course</td></tr>
          <tr><td><code>wallet_connect</code></td><td>When user connects their wallet</td></tr>
          <tr><td><code>achievement_mint</code></td><td>When user mints an achievement NFT</td></tr>
        </tbody>
      </table>

      <h2>Dashboards</h2>

      <h3>GA4 Reports</h3>
      <ul>
        <li><strong>Realtime</strong> → Currently active users</li>
        <li><strong>Acquisition → Traffic</strong> → Where users come from</li>
        <li><strong>Engagement → Pages</strong> → Most viewed pages</li>
        <li><strong>Events</strong> → Custom event counts and trends</li>
      </ul>

      <h3>PostHog Insights</h3>
      <ul>
        <li>Create custom insights for enrollment funnels</li>
        <li>Build retention analysis dashboards</li>
        <li>Track feature adoption rates</li>
      </ul>

      <h2>Privacy Considerations</h2>
      <ul>
        <li>Analytics scripts are lazy-loaded and can be disabled by removing env vars</li>
        <li>PostHog uses <code>identified_only</code> — anonymous users don&apos;t get tracked as individuals</li>
        <li>No PII is sent to analytics beyond what users provide (display name, etc.)</li>
        <li>Consider adding a cookie consent banner for GDPR/CCPA compliance</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
