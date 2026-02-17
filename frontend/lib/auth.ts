import { createServerAuth, type ServerAuthConfig } from "@superteam/auth";

const authConfig: ServerAuthConfig = {
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
	googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
	githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
};

export const serverAuth = createServerAuth(authConfig);
