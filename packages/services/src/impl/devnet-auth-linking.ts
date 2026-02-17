import { BetterAuthLinkingService } from "./better-auth-linking";

export class DevnetAuthLinkingService extends BetterAuthLinkingService {
	constructor(betterAuth: Record<string, unknown>) {
		super(betterAuth);
	}
}
