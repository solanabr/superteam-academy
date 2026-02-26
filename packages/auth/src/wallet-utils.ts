const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const WALLET_EMAIL_DOMAIN = "wallet.superteam.local";

export function walletEmail(publicKey: string): string {
	return `${publicKey}@${WALLET_EMAIL_DOMAIN}`;
}

export function isWalletEmail(email: string): boolean {
	return email.endsWith(`@${WALLET_EMAIL_DOMAIN}`);
}

export function walletFromEmail(email: string): string | undefined {
	if (!isWalletEmail(email)) {
		return undefined;
	}

	const candidate = email.slice(0, email.length - `@${WALLET_EMAIL_DOMAIN}`.length);
	return BASE58_RE.test(candidate) ? candidate : undefined;
}
