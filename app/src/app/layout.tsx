import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Superteam Academy",
  description: "Solana-native LMS for builders",
  icons: { icon: "/Superteam_Brazil_Logo.png" },
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
        {POSTHOG_KEY && (
          <Script
            id="posthog"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init("${POSTHOG_KEY}",{api_host:"${POSTHOG_HOST}",person_profiles:"identified_only"});`,
            }}
          />
        )}
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-hero" />
            <Header />
            <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
              <Sidebar />
              <main className="min-w-0 flex-1 px-3 py-6 sm:px-6">{children}</main>
            </div>
            <Footer />
          </div>
          <Toaster position="bottom-right" richColors closeButton />
        </AppProviders>
      </body>
    </html>
  );
}
