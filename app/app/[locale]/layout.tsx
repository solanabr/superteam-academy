import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Providers from "../providers";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { locales } from "@superteam-academy/i18n/config";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const metadata: Metadata = {
	title: {
		default: "Superteam Academy - Learn Solana Development",
		template: "%s | Superteam Academy",
	},
	description:
		"Master Solana development through interactive courses, earn on-chain credentials, and join a global community of Web3 builders.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: "#008c4c",
};

export function generateStaticParams() {
	return locales.map((locale) => ({ locale: locale.code }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Validate locale
	const isValidLocale = locales.some((l) => l.code === locale);
	if (!isValidLocale) {
		notFound();
	}

	// Set request locale for next-intl
	setRequestLocale(locale);

	const headerList = await headers();
	const messages = await getMessages({ locale });
	const initialSession = await serverAuth.api.getSession({
		headers: {
			cookie: headerList.get("cookie") || "",
		},
	});

	return (
		<>
			{GA_ID && (
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
						strategy="afterInteractive"
					/>
					<Script id="ga4-init" strategy="afterInteractive">
						{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
					</Script>
				</>
			)}
			{POSTHOG_KEY && (
				<Script id="posthog-init" strategy="afterInteractive">
					{`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageviewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('${POSTHOG_KEY}',{api_host:'${POSTHOG_HOST}',person_profiles:'identified_only',autocapture:true,capture_pageview:true,capture_pageleave:true,enable_heatmaps:true,enable_recording_console_log:false,session_recording:{sample_rate:0.1},persistence:'localStorage'})`}
				</Script>
			)}
			<NextIntlClientProvider locale={locale} messages={messages}>
				<Providers
					initialSession={
						initialSession
							? {
									id: initialSession.session.id,
									expiresAt: initialSession
										? new Date(initialSession.session.expiresAt)
										: new Date(),
									userId: initialSession?.user.id ?? "",
								}
							: null
					}
				>
					<SiteHeader />
					<main className="flex-1">{children}</main>
					<SiteFooter />
				</Providers>
			</NextIntlClientProvider>
		</>
	);
}
