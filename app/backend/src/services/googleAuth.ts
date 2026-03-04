import { OAuth2Client } from "google-auth-library";

interface GoogleAuthData {
    googleId: string;
    email: string;
    emailVerified: boolean;
    name: string;
    givenName: string;
    familyName: string;
    picture: string;
    locale: string;
}

interface GoogleAuthResponse {
    success: boolean;
    data?: GoogleAuthData;
    error?: string;
}

class GoogleAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    /**
     * Verify Google ID token and extract user information
     * @param idToken - Google ID token from React Native
     * @returns User information from Google
     */
    async verifyIdToken(idToken: string): Promise<GoogleAuthResponse> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();

            if (!payload) {
                return {
                    success: false,
                    error: "Invalid Google token payload",
                };
            }

            return {
                success: true,
                data: {
                    googleId: payload.sub,
                    email: payload.email || "",
                    emailVerified: payload.email_verified || false,
                    name: payload.name || "",
                    givenName: payload.given_name || "",
                    familyName: payload.family_name || "",
                    picture: payload.picture || "",
                    locale: payload.locale || "",
                },
            };
        } catch (error) {
            console.error("Google token verification error:", error);
            return {
                success: false,
                error: "Invalid Google token",
            };
        }
    }

    /**
     * Verify Google ID token for sign-in (existing users only)
     * @param idToken - Google ID token from React Native
     * @returns Verification result with user data
     */
    async verifySignInToken(idToken: string): Promise<GoogleAuthResponse> {
        try {
            const verificationResult = await this.verifyIdToken(idToken);

            if (!verificationResult.success || !verificationResult.data) {
                return verificationResult;
            }

            const { emailVerified } = verificationResult.data;

            // Check if email is verified by Google
            if (!emailVerified) {
                return {
                    success: false,
                    error: "Google email not verified",
                };
            }

            return {
                success: true,
                data: verificationResult.data,
            };
        } catch (error) {
            console.error("Google sign-in verification error:", error);
            return {
                success: false,
                error: "Failed to verify Google token",
            };
        }
    }
}

export default new GoogleAuthService();

