"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function Analytics() {
    return (
        <>
            {/* Google Analytics 4 */}
            {GA_ID && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_ID}', {
                                page_path: window.location.pathname,
                                send_page_view: true
                            });
                        `}
                    </Script>
                </>
            )}

            {/* PostHog Analytics & Heatmaps */}
            {POSTHOG_KEY && (
                <Script id="posthog-init" strategy="afterInteractive">
                    {`
                        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
                        posthog.init('${POSTHOG_KEY}', {
                            api_host: 'https://us.i.posthog.com',
                            person_profiles: 'identified_only',
                            capture_pageview: true,
                            capture_pageleave: true,
                            autocapture: true
                        });
                    `}
                </Script>
            )}

            {/* Microsoft Clarity Heatmaps */}
            {CLARITY_ID && (
                <Script id="clarity-init" strategy="afterInteractive">
                    {`
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "${CLARITY_ID}");
                    `}
                </Script>
            )}
        </>
    );
}

// Custom event helpers for GA4
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
    if (typeof window !== "undefined" && "gtag" in window) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", eventName, params);
    }
}

// Pre-defined academy events
export const AcademyEvents = {
    courseView: (courseId: string) => trackEvent("course_view", { course_id: courseId }),
    courseEnroll: (courseId: string) => trackEvent("course_enroll", { course_id: courseId }),
    lessonComplete: (courseId: string, lessonId: string, xp: number) =>
        trackEvent("lesson_complete", { course_id: courseId, lesson_id: lessonId, xp_earned: xp }),
    courseComplete: (courseId: string, totalXp: number) =>
        trackEvent("course_complete", { course_id: courseId, total_xp: totalXp }),
    walletConnect: (walletName: string) => trackEvent("wallet_connect", { wallet: walletName }),
    codeRun: (courseId: string, lessonId: string) =>
        trackEvent("code_run", { course_id: courseId, lesson_id: lessonId }),
    achievementClaim: (achievementId: string) =>
        trackEvent("achievement_claim", { achievement_id: achievementId }),
    localeChange: (locale: string) => trackEvent("locale_change", { locale }),
};
