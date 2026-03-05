/**
 * @fileoverview Better Auth client-side configuration.
 * Provides hooks and methods for authentication, session management, and custom Solana actions.
 * Exports signIn, signUp, useSession and other auth primitives for use across the application.
 */
import {
	inferAdditionalFields,
	multiSessionClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./index";

/**
 * The primary authentication client instance.
 * Configured with multi-session support and custom Solana wallet linking logic.
 */
export const authClient = createAuthClient({
	session: {
		refetchOnWindowFocus: false,
		refetchInterval: 0,
		refetchOnMount: false, // Disable aggressive mount refetching
	},
	plugins: [
		inferAdditionalFields<typeof auth>(),
		multiSessionClient(),
		{
			id: "solana",
			getActions: (fetch) => ({
				solana: {
					link: async (data: {
						publicKey: string;
						signature: string;
						message: string;
					}) => {
						return await fetch<{ success: boolean }>("/link/solana", {
							method: "POST",
							body: data,
						});
					},
				},
			}),
		},
	],
});

export const { signIn, signUp, useSession, signOut, linkSocial, listAccounts } =
	authClient;
