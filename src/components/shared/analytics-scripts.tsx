'use client';

import Script from 'next/script';

/**
 * Analytics script loader component.
 * Loads GA4, PostHog, and Sentry when environment variables are configured.
 */
export function AnalyticsScripts() {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  return (
    <>
      {/* Google Analytics 4 */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* PostHog */}
      {posthogKey && (
        <Script id="posthog" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('${posthogKey}', {
              api_host: 'https://app.posthog.com',
              capture_pageview: true,
              capture_pageleave: true,
            });
          `}
        </Script>
      )}

      {/* Microsoft Clarity (Free heatmaps alternative) */}
      <Script id="clarity" strategy="afterInteractive">
        {`
          // Microsoft Clarity - uncomment and add your project ID
          // (function(c,l,a,r,i,t,y){
          //   c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          //   t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          //   y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          // })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
        `}
      </Script>
    </>
  );
}
