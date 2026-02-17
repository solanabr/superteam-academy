import { BetterAuthLinkingService } from "./better-auth-linking";

export class MainnetAuthLinkingService extends BetterAuthLinkingService {
	constructor(betterAuth: Record<string, unknown>) {
		super(betterAuth);
	}
}
