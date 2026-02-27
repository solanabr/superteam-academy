import { connectToDatabase } from '@/lib/mongodb';
import { User, IUser } from '@/models';
import mongoose from 'mongoose';
import { INotificationPreferences } from '@/models/User';

export interface CreateUserInput {
  wallet_address?: string;
  email?: string;
  google_id?: string;
  github_id?: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  language?: 'pt-br' | 'es' | 'en';
}

export interface UpdateUserInput {
  full_name?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  email?: string;
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  telegram?: string;
  discord?: string;
  medium?: string;
  youtube?: string;
  tiktok?: string;
  language?: 'pt-br' | 'es' | 'en';
  theme?: 'light' | 'dark' | 'system';
  profile_public?: boolean;
  show_on_leaderboard?: boolean;
  show_activity?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  notification_preferences?: Partial<INotificationPreferences>;
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(input: CreateUserInput): Promise<IUser> {
    await connectToDatabase();

    const user = new User({
      ...input,
      total_xp: 0,
      level: 1,
      last_activity_at: new Date(),
    });

    await user.save();
    return user;
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findById(userId);
  }

  /**
   * Find user by wallet address
   */
  static async findByWalletAddress(walletAddress: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ wallet_address: walletAddress });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ email });
  }

  /**
   * Find user by Google ID
   */
  static async findByGoogleId(googleId: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ google_id: googleId });
  }

  /**
   * Find user by GitHub ID
   */
  static async findByGitHubId(githubId: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ github_id: githubId });
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<IUser | null> {
    await connectToDatabase();
    return User.findOne({ username: username.toLowerCase() });
  }

  /**
   * Find or create user by wallet address
   */
  static async findOrCreateByWallet(walletAddress: string): Promise<IUser> {
    await connectToDatabase();

    const existingUser = await User.findOne({ wallet_address: walletAddress });
    if (existingUser) {
      existingUser.last_activity_at = new Date();
      await existingUser.save();
      return existingUser;
    }
    return this.createUser({
      wallet_address: walletAddress,
      display_name: `User ${walletAddress.slice(0, 6)}`,
    });
  }

  /**
   * Find or create user by Google
   */
  static async findOrCreateByGoogle(
    googleId: string,
    email: string,
    displayName: string,
    avatarUrl?: string
  ): Promise<IUser> {
    await connectToDatabase();

    const existingByGoogle = await User.findOne({ google_id: googleId });
    if (existingByGoogle) {
      existingByGoogle.last_activity_at = new Date();
      await existingByGoogle.save();
      return existingByGoogle;
    }

    // Check if email already exists
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      // Link Google account to existing user and update profile if default
      existingByEmail.google_id = googleId;
      existingByEmail.last_activity_at = new Date();

      // Update display_name if current one is default (starts with "User ")
      if (displayName && existingByEmail.display_name?.startsWith('User ')) {
        existingByEmail.display_name = displayName;
      }

      // Update avatar_url if not set
      if (avatarUrl && !existingByEmail.avatar_url) {
        existingByEmail.avatar_url = avatarUrl;
      }

      await existingByEmail.save();
      return existingByEmail;
    }

    return this.createUser({
      google_id: googleId,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
    });
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, input: UpdateUserInput): Promise<IUser | null> {
    await connectToDatabase();
    return User.findByIdAndUpdate(userId, { $set: input }, { returnDocument: 'after' });
  }

  /**
   * Add XP to user
   */
  static async addXP(userId: string, xpAmount: number): Promise<IUser | null> {
    await connectToDatabase();
    return User.findByIdAndUpdate(userId, { $inc: { total_xp: xpAmount } }, { returnDocument: 'after' }).then(
      async (user) => {
        if (user) {
          // Recalculate level
          user.level = Math.floor(Math.sqrt(user.total_xp / 100));
          await user.save();
        }
        return user;
      }
    );
  }

  /**
   * Link wallet address to existing user
   */
  static async linkWallet(userId: string, walletAddress: string): Promise<IUser | null> {
    await connectToDatabase();

    // Check if wallet is already linked to another account
    const existingWalletUser = await User.findOne({ wallet_address: walletAddress });
    if (existingWalletUser && existingWalletUser._id.toString() !== userId) {
      throw new Error('Wallet is already linked to another account');
    }

    return User.findByIdAndUpdate(
      userId,
      { $set: { wallet_address: walletAddress } },
      { returnDocument: 'after' }
    );
  }

  /**
   * Link Google account to existing user
   */
  static async linkGoogle(
    userId: string,
    googleId: string,
    email: string,
    displayName?: string,
    avatarUrl?: string
  ): Promise<IUser | null> {
    await connectToDatabase();

    // Check if Google ID is already linked to another account
    const existingGoogleUser = await User.findOne({ google_id: googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      throw new Error('Google account is already linked to another user');
    }

    const updateData: Partial<IUser> = { google_id: googleId };

    // Update email, display_name, and avatar_url if they are currently default values
    const currentUser = await User.findById(userId);
    if (currentUser) {
      // ALWAYS set email when linking Google (critical for future OAuth sign-ins to find user)
      if (email && !currentUser.email) {
        updateData.email = email;
      }
      // Update display_name if current one is default (starts with "User ")
      if (displayName && currentUser.display_name?.startsWith('User ')) {
        updateData.display_name = displayName;
      }
      // Update avatar_url if not set or if current one is empty
      if (avatarUrl && !currentUser.avatar_url) {
        updateData.avatar_url = avatarUrl;
      }
    }

    return User.findByIdAndUpdate(userId, { $set: updateData }, { returnDocument: 'after' });
  }

  /**
   * Link GitHub account to existing user
   */
  static async linkGitHub(
    userId: string,
    githubId: string,
    email?: string,
    displayName?: string,
    avatarUrl?: string
  ): Promise<IUser | null> {
    await connectToDatabase();

    // Check if GitHub ID is already linked to another account
    const existingGitHubUser = await User.findOne({ github_id: githubId });
    if (existingGitHubUser && existingGitHubUser._id.toString() !== userId) {
      throw new Error('GitHub account is already linked to another user');
    }

    const updateData: Partial<IUser> = { github_id: githubId };

    // Update email, display_name, and avatar_url if they are currently default values
    const currentUser = await User.findById(userId);
    if (currentUser) {
      if (!currentUser.email && email) {
        updateData.email = email;
      }
      // Update display_name if current one is default (starts with "User ")
      if (displayName && currentUser.display_name?.startsWith('User ')) {
        updateData.display_name = displayName;
      }
      // Update avatar_url if not set or if current one is empty
      if (avatarUrl && !currentUser.avatar_url) {
        updateData.avatar_url = avatarUrl;
      }
    }

    return User.findByIdAndUpdate(userId, { $set: updateData }, { returnDocument: 'after' });
  }

  /**
   * Find or create user by GitHub
   */
  static async findOrCreateByGitHub(
    githubId: string,
    email: string | null,
    displayName: string,
    avatarUrl?: string
  ): Promise<IUser> {
    await connectToDatabase();

    const existingByGitHub = await User.findOne({ github_id: githubId });
    if (existingByGitHub) {
      existingByGitHub.last_activity_at = new Date();
      await existingByGitHub.save();
      return existingByGitHub;
    }

    // Check if email already exists
    if (email) {
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        // Link GitHub account to existing user and update profile if default
        existingByEmail.github_id = githubId;
        existingByEmail.last_activity_at = new Date();

        // Update display_name if current one is default (starts with "User ")
        if (displayName && existingByEmail.display_name?.startsWith('User ')) {
          existingByEmail.display_name = displayName;
        }

        // Update avatar_url if not set
        if (avatarUrl && !existingByEmail.avatar_url) {
          existingByEmail.avatar_url = avatarUrl;
        }

        await existingByEmail.save();
        return existingByEmail;
      }
    }

    return this.createUser({
      github_id: githubId,
      email: email || undefined,
      display_name: displayName,
      avatar_url: avatarUrl,
    });
  }

  /**
   * Unlink provider from user account
   */
  static async unlinkProvider(
    userId: string,
    provider: 'wallet' | 'google' | 'github'
  ): Promise<IUser | null> {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Count how many auth methods are linked
    const linkedMethods = [user.wallet_address, user.google_id, user.github_id].filter(
      Boolean
    ).length;

    if (linkedMethods <= 1) {
      throw new Error('Cannot unlink the last authentication method');
    }

    const updateData: Partial<IUser> = {};
    if (provider === 'wallet') {
      updateData.wallet_address = undefined;
    } else if (provider === 'google') {
      updateData.google_id = undefined;
    } else if (provider === 'github') {
      updateData.github_id = undefined;
    }

    return User.findByIdAndUpdate(userId, { $unset: updateData }, { returnDocument: 'after' });
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    await connectToDatabase();

    const query: Record<string, unknown> = { username: username.toLowerCase() };
    if (excludeUserId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
    }

    const existingUser = await User.findOne(query);
    return !existingUser;
  }

  /**
   * Get user stats summary
   */
  static async getUserStats(userId: string) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return null;

    return {
      total_xp: user.total_xp,
      level: user.level,
      xp_to_next_level: Math.pow(user.level + 1, 2) * 100 - user.total_xp,
      rank: await this.getUserRank(userId),
    };
  }

  /**
   * Get user rank on leaderboard
   */
  static async getUserRank(userId: string): Promise<number> {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || !user.show_on_leaderboard) return 0;

    const rank = await User.countDocuments({
      show_on_leaderboard: true,
      total_xp: { $gt: user.total_xp },
    });

    return rank + 1;
  }
}
