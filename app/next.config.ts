import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../packages/i18n/src/config.ts");

const nextConfig: NextConfig = {
	compiler: {
		styledComponents: true,
	},
	transpilePackages: [
		"@superteam-academy/anchor",
		"@superteam-academy/auth",
		"@superteam-academy/cms",
		"@superteam-academy/editor",
		"@superteam-academy/gamification",
		"@superteam-academy/i18n",
		"@superteam-academy/solana",
	],
	serverExternalPackages: [
		"@solana/web3.js",
		"@solana/wallet-adapter-base",
		"@solana/wallet-adapter-wallets",
		"@coral-xyz/anchor",
		"tweetnacl",
		"better-auth",
		"better-call",
		"@sanity/client",
	],
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "cdn.sanity.io" },
			{ protocol: "https", hostname: "arweave.net" },
			{ protocol: "https", hostname: "gravatar.com" },
			{ protocol: "http", hostname: "localhost" },
		],
	},
	turbopack: {
		rules: {
			"*.svg": {
				loaders: ["@svgr/webpack"],
				as: "*.js",
			},
		},
		resolveAlias: {
			"../build/polyfills/polyfill-module": "./polyfill-stub.js",
			"next/dist/build/polyfills/polyfill-module": "./polyfill-stub.js",
		},
	},
	experimental: {
		optimizeCss: true,
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-dialog",
			"@radix-ui/react-popover",
			"@radix-ui/react-tabs",
			"@radix-ui/react-select",
			"@radix-ui/react-tooltip",
			"@radix-ui/react-navigation-menu",
			"date-fns",
		],
	},
};

export default withNextIntl(nextConfig);
