import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | CapySolBuild Academy',
  description: 'Cookie Policy for CapySolBuild Academy',
};

export default function CookiePolicyPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website.
              They help websites remember your preferences and provide a better user experience.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. How We Use Cookies</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              CapySolBuild Academy uses cookies and similar technologies for the following purposes:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for the Platform to function properly,
                including authentication and security.
              </li>
              <li>
                <strong>Functional Cookies:</strong> Remember your preferences, such as language and
                theme settings.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how you use the Platform so
                we can improve it.
              </li>
              <li>
                <strong>Performance Cookies:</strong> Track learning progress and optimize platform
                performance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. Types of Cookies We Use</h2>

            <div className="bg-muted/30 mb-4 rounded-lg p-6">
              <h3 className="mb-2 text-lg font-medium">Essential Cookies</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                These cookies are strictly necessary for the Platform to operate.
              </p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Session authentication cookies</li>
                <li>• Security tokens</li>
                <li>• Load balancing cookies</li>
              </ul>
            </div>

            <div className="bg-muted/30 mb-4 rounded-lg p-6">
              <h3 className="mb-2 text-lg font-medium">Analytics Cookies</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                Help us understand how visitors interact with our Platform.
              </p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Google Analytics</li>
                <li>• PostHog (behavior analytics)</li>
                <li>• Sentry (error tracking)</li>
              </ul>
            </div>

            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="mb-2 text-lg font-medium">Functional Cookies</h3>
              <p className="text-muted-foreground mb-2 text-sm">
                Remember your choices and preferences.
              </p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Theme preference (light/dark mode)</li>
                <li>• Language settings</li>
                <li>• Code editor preferences</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some third-party services we use may set their own cookies. These include
              authentication providers (Google, GitHub), analytics services, and wallet connection
              libraries. We encourage you to review the privacy policies of these third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. Managing Cookies</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>View cookies stored on your device</li>
              <li>Delete individual or all cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies (this may affect functionality)</li>
            </ul>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Please note that disabling essential cookies may prevent you from using certain
              features of the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              In addition to cookies, we use local storage to store certain preferences and data
              locally on your device. This includes your learning progress, code editor settings,
              and wallet connection state.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:privacy@capysolbuild.com" className="text-primary hover:underline">
                privacy@capysolbuild.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
