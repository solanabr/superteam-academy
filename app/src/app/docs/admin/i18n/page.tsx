import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Internationalization" };

export default function I18nPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Internationalization (i18n)</h1>
      <p className="lead">
        Superteam Academy uses next-intl for internationalization. The platform
        supports English, Portuguese (Brazil), and Spanish. This guide covers
        how i18n works and how to add new languages.
      </p>

      <h2>How i18n Works</h2>
      <ul>
        <li><strong>Library</strong>: <code>next-intl</code> v4.8.3</li>
        <li><strong>Locale detection</strong>: Cookie-based (<code>NEXT_LOCALE</code> cookie)</li>
        <li><strong>URL prefix</strong>: None — no <code>/en/</code> or <code>/pt-br/</code> in URLs</li>
        <li><strong>Default locale</strong>: <code>en</code></li>
        <li><strong>Message files</strong>: JSON at <code>src/i18n/messages/</code></li>
      </ul>

      <h2>Supported Locales</h2>
      <table>
        <thead>
          <tr><th>Code</th><th>Language</th><th>File</th></tr>
        </thead>
        <tbody>
          <tr><td><code>en</code></td><td>English</td><td><code>src/i18n/messages/en.json</code></td></tr>
          <tr><td><code>pt-br</code></td><td>Portuguese (Brazil)</td><td><code>src/i18n/messages/pt-br.json</code></td></tr>
          <tr><td><code>es</code></td><td>Spanish</td><td><code>src/i18n/messages/es.json</code></td></tr>
        </tbody>
      </table>

      <h2>Configuration Files</h2>

      <h3>src/i18n/routing.ts</h3>
      <p>Defines available locales and routing behavior:</p>
      <pre><code>{`import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt-br", "es"],
  defaultLocale: "en",
  localePrefix: "never",  // No URL prefix
});`}</code></pre>

      <h3>src/i18n/request.ts</h3>
      <p>Resolves the current locale from the request (cookie-based):</p>
      <pre><code>{`import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = /* read from NEXT_LOCALE cookie */;
  return {
    locale,
    messages: (await import(\`./messages/\${locale}.json\`)).default,
  };
});`}</code></pre>

      <h3>src/i18n/navigation.ts</h3>
      <p>Exports locale-aware navigation hooks:</p>
      <pre><code>{`import { createNavigation } from "next-intl/navigation";
export const { Link, usePathname, useRouter } = createNavigation(routing);`}</code></pre>

      <h2>Using Translations in Components</h2>

      <h3>Client Components</h3>
      <pre><code>{`"use client";
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("navigation");
  return <h1>{t("courses")}</h1>;
}`}</code></pre>

      <h3>Server Components</h3>
      <pre><code>{`import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("navigation");
  return <h1>{t("courses")}</h1>;
}`}</code></pre>

      <h2>Message File Structure</h2>
      <p>
        Messages are organized by namespace (component/section):
      </p>
      <pre><code>{`{
  "navigation": {
    "courses": "Courses",
    "dashboard": "Dashboard",
    "community": "Community",
    "leaderboard": "Leaderboard",
    "profile": "Profile",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  },
  "courses": {
    "title": "Explore Courses",
    "enroll": "Enroll",
    "difficulty": {
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced"
    }
  },
  "onboarding": {
    "welcome": "Welcome to Superteam Academy!",
    "getStarted": "Get Started"
  }
}`}</code></pre>

      <h2>Adding a New Language</h2>
      <p>Follow these steps to add a new language (e.g., French):</p>

      <h3>Step 1: Create the message file</h3>
      <pre><code>{`# Copy English as a template
cp src/i18n/messages/en.json src/i18n/messages/fr.json

# Translate all values in fr.json`}</code></pre>

      <h3>Step 2: Update routing config</h3>
      <pre><code>{`// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["en", "pt-br", "es", "fr"],  // Add "fr"
  defaultLocale: "en",
  localePrefix: "never",
});`}</code></pre>

      <h3>Step 3: Update the language switcher</h3>
      <p>
        Add the new locale option to the language switcher in
        <code>components/layout/navbar.tsx</code>.
      </p>

      <h3>Step 4: Test</h3>
      <ol>
        <li>Run the dev server</li>
        <li>Switch to the new language using the language switcher</li>
        <li>Verify all pages render correctly</li>
        <li>Check for any missing translation keys in the console</li>
      </ol>

      <h2>Language Switcher</h2>
      <p>
        The language switcher is in the Navbar component. It sets the
        <code>NEXT_LOCALE</code> cookie and reloads the page to apply the
        new locale.
      </p>

      <h2>Best Practices</h2>
      <ul>
        <li>Always add keys to all locale files simultaneously</li>
        <li>Use namespaced keys (e.g., <code>navigation.courses</code> not just <code>courses</code>)</li>
        <li>Use interpolation for dynamic values: <code>{`{t("welcome", { name: user.name })}`}</code></li>
        <li>Test all supported locales after changes</li>
        <li>Keep translations short and context-appropriate</li>
      </ul>

      <DocsPagination />
    </article>
  );
}
