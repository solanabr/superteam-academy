import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CapySolBuild Academy',
  description: 'Terms of Service for CapySolBuild Academy',
};

export default function TermsOfServicePage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using CapySolBuild Academy (&ldquo;the Platform&rdquo;), you agree to
              be bound by these Terms of Service. If you do not agree to these terms, please do not
              use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              CapySolBuild Academy provides an online learning platform for Solana blockchain
              development. Our services include interactive courses, coding challenges, on-chain
              credentials, and community features.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              To access certain features of the Platform, you must create an account. You agree to:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on the Platform, including courses, code examples, graphics, and logos, is
              the property of CapySolBuild Academy or its licensors. You may not reproduce,
              distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. On-Chain Credentials</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credentials and achievements earned on the Platform may be minted as NFTs on the
              Solana blockchain. By earning credentials, you acknowledge that these records are
              permanent and publicly visible on the blockchain.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">You agree not to:</p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Share account credentials with others</li>
              <li>Attempt to circumvent platform security</li>
              <li>Submit malicious code or content</li>
              <li>Harass other users or community members</li>
              <li>Use the Platform for illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Payment and Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some courses and features may require payment. All payments are processed securely
              through our payment providers. Refund policies are outlined at the time of purchase.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              CapySolBuild Academy is provided &ldquo;as is&rdquo; without warranties of any kind.
              We are not liable for any damages arising from your use of the Platform, including but
              not limited to lost profits or data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the Platform
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@capysolbuild.com" className="text-primary hover:underline">
                legal@capysolbuild.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
