import Script from "next/script";

/**
 * Analytics provider component.
 * Includes GA4, PostHog, and Sentry scripts.
 * 
 * Environment variables:
 * - NEXT_PUBLIC_GA_ID: Google Analytics 4 Measurement ID
 * - NEXT_PUBLIC_POSTHOG_KEY: PostHog project API key
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN for error monitoring
 */
export function AnalyticsProvider() {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

    return (
        <>
            {/* Google Analytics 4 */}
            {gaId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_title: document.title,
                send_page_view: true,
                custom_map: {
                  'dimension1': 'wallet_connected',
                  'dimension2': 'user_level',
                  'dimension3': 'locale'
                }
              });
            `}
                    </Script>
                </>
            )}

            {/* PostHog Analytics & Heatmaps */}
            {posthogKey && (
                <Script id="posthog-init" strategy="afterInteractive">
                    {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('${posthogKey}', {
              api_host: 'https://us.i.posthog.com',
              person_profiles: 'identified_only',
              capture_pageview: true,
              capture_pageleave: true,
              enable_heatmaps: true,
              session_recording: {
                maskAllInputs: false,
                maskInputOptions: { password: true }
              }
            });
          `}
                </Script>
            )}

            {/* Sentry Error Monitoring */}
            {sentryDsn && (
                <Script id="sentry-init" strategy="afterInteractive">
                    {`
            (function() {
              var s = document.createElement('script');
              s.src = 'https://browser.sentry-cdn.com/7.118.0/bundle.tracing.min.js';
              s.crossOrigin = 'anonymous';
              s.onload = function() {
                Sentry.init({
                  dsn: '${sentryDsn}',
                  tracesSampleRate: 0.1,
                  environment: '${process.env.NODE_ENV}',
                  integrations: [new Sentry.BrowserTracing()],
                });
              };
              document.head.appendChild(s);
            })();
          `}
                </Script>
            )}
        </>
    );
}
