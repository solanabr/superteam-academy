import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "Superteam Academy - Learn Solana Development",
		template: "%s | Superteam Academy",
	},
	description:
		"Master Solana development through interactive courses, earn on-chain credentials, and join a global community of Web3 builders.",
	metadataBase: new URL("https://academy.superteam.fun"),
	openGraph: {
		type: "website",
		siteName: "Superteam Academy",
		title: "Superteam Academy - Learn Solana Development",
		description:
			"Master Solana development through interactive courses, earn on-chain credentials, and join a global community of Web3 builders.",
	},
	twitter: {
		card: "summary_large_image",
		site: "@SuperteamAcademy",
	},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.ico" type="image/x-icon" />
				<link rel="manifest" href="/manifest.json" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="min-h-screen flex flex-col">{children}</body>
		</html>
	);
}
