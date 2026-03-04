import axios from "axios";

interface GithubAuthData {
  githubId: string;
  username: string;
  email: string | null;
  name: string | null;
  avatar: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
  twitterUsername: string | null;
}

interface GithubAuthResponse {
  success: boolean;
  data?: GithubAuthData;
  error?: string;
}

class GithubAuthService {
  private readonly tokenUrl = "https://github.com/login/oauth/access_token";
  private readonly userUrl = "https://api.github.com/user";
  private readonly emailUrl = "https://api.github.com/user/emails";

  /**
   * Exchange a GitHub OAuth code for an access token
   * @param code - OAuth code from GitHub callback
   */
  private async getAccessToken(code: string): Promise<string | null> {
    try {
      const response = await axios.post(
        this.tokenUrl,
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: { Accept: "application/json" },
        }
      );

      return response.data.access_token || null;
    } catch (error) {
      console.error("GitHub token exchange error:", error);
      return null;
    }
  }

  /**
   * Fetch the authenticated user's primary verified email
   * GitHub doesn't always return email in the user profile
   * @param accessToken - GitHub access token
   */
  private async getPrimaryEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await axios.get(this.emailUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });

      const emails: { email: string; primary: boolean; verified: boolean }[] =
        response.data;

      const primary = emails.find((e) => e.primary && e.verified);
      return primary?.email || null;
    } catch (error) {
      console.error("GitHub email fetch error:", error);
      return null;
    }
  }

  /**
   * Exchange OAuth code for user profile data
   * @param code - OAuth code from GitHub callback
   */
  async verifyCode(code: string): Promise<GithubAuthResponse> {
    try {
      // 1. Get access token
      const accessToken = await this.getAccessToken(code);

      if (!accessToken) {
        return { success: false, error: "Failed to exchange GitHub code for access token" };
      }

      // 2. Fetch GitHub user profile
      const { data: profile } = await axios.get(this.userUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      });

      // 3. Get email — try profile first, fallback to emails endpoint
      let email: string | null = profile.email || null;
      if (!email) {
        email = await this.getPrimaryEmail(accessToken);
      }

      return {
        success: true,
        data: {
          githubId: String(profile.id),
          username: profile.login,
          email,
          name: profile.name || null,
          avatar: profile.avatar_url || "",
          bio: profile.bio || null,
          location: profile.location || null,
          blog: profile.blog || null,
          twitterUsername: profile.twitter_username || null,
        },
      };
    } catch (error) {
      console.error("GitHub auth error:", error);
      return { success: false, error: "Failed to authenticate with GitHub" };
    }
  }
}

export default new GithubAuthService();