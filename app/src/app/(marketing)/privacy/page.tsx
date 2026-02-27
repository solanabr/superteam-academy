import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CapySolBuild Academy',
  description: 'Privacy Policy for CapySolBuild Academy',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              CapySolBuild Academy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is
              committed to protecting your privacy. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">2. Information We Collect</h2>
            <h3 className="mb-3 text-xl font-medium">Personal Information</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              We may collect personal information that you voluntarily provide, including:
            </p>
            <ul className="text-muted-foreground mb-4 list-inside list-disc space-y-2">
              <li>Name and email address</li>
              <li>Wallet addresses (for on-chain credentials)</li>
              <li>Profile information and preferences</li>
              <li>Payment information (processed by third-party providers)</li>
            </ul>

            <h3 className="mb-3 text-xl font-medium">Automatically Collected Information</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              When you use the Platform, we automatically collect:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and learning progress</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Provide and maintain our services</li>
              <li>Track your learning progress and achievements</li>
              <li>Issue on-chain credentials and certificates</li>
              <li>Personalize your learning experience</li>
              <li>Communicate with you about updates and offers</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">4. Blockchain Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you earn credentials on CapySolBuild Academy, certain information may be recorded
              on the Solana blockchain. This includes your wallet address and credential metadata.
              Blockchain data is public, immutable, and cannot be deleted.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">5. Information Sharing</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              We may share your information with:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Service providers who assist in our operations</li>
              <li>Analytics partners to improve our services</li>
              <li>Legal authorities when required by law</li>
              <li>Other users (leaderboards, public profiles)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your
              personal information. However, no method of transmission over the Internet is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Depending on your location, you may have the right to:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data (except blockchain records)</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Platform is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">9. International Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &ldquo;Last updated&rdquo;
              date.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
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
