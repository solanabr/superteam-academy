import { sign, verify } from "jsonwebtoken";
import clientPromise from '../lib/mongodb';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret_for_development";
const JWT_EXPIRES_IN = "7d";

export interface UserDBRecord {
   id: string; // Internal DB Primary Key
   email?: string;
   publicKey?: string; // Base58 Solana wallet address
   name?: string;
   avatar?: string;
   level?: number;
   rank?: number;
   xp?: number;
   streak?: number;
   lastActivityDate?: string | Date;
   activityHistory?: string[];
   bio?: string;
   twitter?: string;
   github?: string;
   website?: string;
   skills?: Record<string, number>;
   createdAt: Date;
   updatedAt: Date;
}

export interface UserSessionPayload {
   userId: string;
   email?: string;
   publicKey?: string;
}

export interface XPLedgerRecord {
   id: string;
   userId: string;
   wallet?: string;
   courseId: string;
   xpAmount: number;
   timestamp: string; // ISO Date String
}

export class UserService {
   private async getCollection(colName: string) {
      const client = await clientPromise;
      const db = client.db();
      return db.collection(colName);
   }

   public async getUser(id: string): Promise<UserDBRecord | null> {
      const col = await this.getCollection('users');
      return await col.findOne({ id }) as unknown as UserDBRecord | null;
   }

   public async getUserByEmail(email: string): Promise<UserDBRecord | null> {
      const col = await this.getCollection('users');
      return await col.findOne({ email }) as unknown as UserDBRecord | null;
   }

   public async getUserByWallet(publicKey: string): Promise<UserDBRecord | null> {
      const col = await this.getCollection('users');
      return await col.findOne({ publicKey }) as unknown as UserDBRecord | null;
   }

   public async getAllUsers(): Promise<UserDBRecord[]> {
      const col = await this.getCollection('users');
      return await col.find({}).toArray() as unknown as UserDBRecord[];
   }

   public async getAllXpHistory(): Promise<XPLedgerRecord[]> {
      const col = await this.getCollection('xpHistory');
      return await col.find({}).toArray() as unknown as XPLedgerRecord[];
   }

   private async dbCreateUser(data: Partial<UserDBRecord>): Promise<UserDBRecord> {
      const col = await this.getCollection('users');
      const newUser: UserDBRecord = {
         id: `usr_${Date.now()}`,
         level: 0,
         rank: 0,
         xp: 0,
         streak: 0,
         skills: {},
         ...data,
         createdAt: new Date(),
         updatedAt: new Date(),
      } as UserDBRecord;

      await col.insertOne(newUser);
      return newUser;
   }

   public async updateUser(id: string, data: Partial<UserDBRecord>): Promise<UserDBRecord> {
      const col = await this.getCollection('users');

      const updatedDoc = await col.findOneAndUpdate(
         { id },
         {
            $set: {
               ...data,
               updatedAt: new Date(),
            }
         },
         { returnDocument: 'after' }
      );

      if (!updatedDoc) {
         throw new Error(`User with ID ${id} not found`);
      }

      return updatedDoc as unknown as UserDBRecord;
   }

   public async trackActivity(userId: string): Promise<UserDBRecord> {
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");

      const now = new Date();
      const todayString = now.toISOString().split("T")[0];

      let newStreak = user.streak || 0;
      let lastActivityDateStr = "";
      let activityHistory = user.activityHistory || [];

      if (user.lastActivityDate) {
         const lastDate = new Date(user.lastActivityDate);
         lastActivityDateStr = lastDate.toISOString().split("T")[0];
      }

      if (lastActivityDateStr === todayString) {
         // Already tracked today
         return user;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split("T")[0];

      if (lastActivityDateStr === yesterdayString) {
         newStreak += 1;
      } else {
         newStreak = 1;
      }

      if (!activityHistory.includes(todayString)) {
         activityHistory.push(todayString);
      }

      // Keep only last 60 days to prevent unbounded DB growth
      if (activityHistory.length > 60) {
         activityHistory = activityHistory.slice(-60);
      }

      return await this.updateUser(userId, {
         streak: newStreak,
         lastActivityDate: now,
         activityHistory,
      });
   }


   // ─── AUTHENTICATION FLOWS ──────────────────────────────────────────────────

   /**
    * Handles a Web2 OAuth Login (Google/Github)
    */
   public async handleOAuthLogin(email: string, name?: string, avatar?: string, github?: string, token?: string): Promise<{ user: UserDBRecord, token: string }> {
      let user: UserDBRecord | null = null;

      if (token) {
         const decoded = this.verifyToken(token);
         if (decoded?.userId) {
            const user = await this.getUser(decoded.userId);
            if (user) return { user: await this.linkOAuth(user.id, email, name, avatar, github), token };
         }
      }

      user = await this.getUserByEmail(email) || await this.dbCreateUser({ email, name, avatar, github })
      if (github && !user.github)
         user = await this.updateUser(user.id, { github });

      const newToken = this.generateToken(user);
      return { user, token: newToken };
   }

   /**
    * Handles a Web3 SIWS (Sign-In With Solana) Login
    */
   public async handleWalletLogin(publicKey: string, token?: string): Promise<{ user: UserDBRecord, token: string }> {
      let user: UserDBRecord | null = null;

      // 1. Try to link to existing session if token is provided
      if (token) {
         const decoded = this.verifyToken(token);
         if (decoded?.userId) {
            user = await this.getUser(decoded.userId);
            if (user) {
               console.log(`[UserService] Token detected. Linking Wallet ${publicKey} to existing user ${user.id}`);
               return { user: await this.linkWallet(user.id, publicKey), token };
            }
         }
      }

      // 2. If no valid token / user not found, try to find by wallet
      user = await this.getUserByWallet(publicKey) || await this.dbCreateUser({ publicKey });

      const newToken = this.generateToken(user);
      return { user, token: newToken };
   }

   /**
    * Links a Wallet to an existing Web2 User account
    */
   public async linkWallet(userId: string, publicKey: string): Promise<UserDBRecord> {
      console.log(`[UserService] Linking wallet ${publicKey} to user ${userId}`);
      const user = await this.getUser(userId);
      if (!user) throw new Error(`[UserService] User ${userId} not found during wallet link`);
      return await this.updateUser(userId, { publicKey });
   }

   /**
    * Links an Email (OAuth) to an existing Web3 User account
    */
   public async linkOAuth(userId: string, email: string, name?: string, avatar?: string, github?: string): Promise<UserDBRecord> {
      console.log(`[UserService] Linking OAuth identity ${email} to user ${userId}`);

      const user = await this.getUser(userId);
      if (!user) throw new Error(`[UserService] User ${userId} not found during OAuth link`);

      const updateData: Partial<UserDBRecord> = { email };

      // Only attach these properties if the existing user does NOT already have them
      if (name && !user.name) updateData.name = name;
      if (avatar && !user.avatar) updateData.avatar = avatar;
      if (github && !user.github) updateData.github = github;

      return await this.updateUser(userId, updateData);
   }
   // ─── JWT MANAGEMENT ────────────────────────────────────────────────────────

   /**
    * Generates a stateless JWT for the authenticated user session
    */
   public generateToken(user: UserDBRecord): string {
      const payload: UserSessionPayload = {
         userId: user.id,
         email: user.email,
         publicKey: user.publicKey,
      };

      return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
   }

   /**
    * Verifies and decodes a user's JWT session token
    */
   public verifyToken(token: string): UserSessionPayload | null {
      try {
         const decoded = verify(token, JWT_SECRET) as UserSessionPayload;
         return decoded;
      } catch (error) {
         console.error("[UserService] JWT Verification Failed:", error);
         return null;
      }
   }

   /**
    * RECORDS XP EVENT TO THE LEDGER
    */
   public async trackXpReward(userId: string, courseId: string, xpAmount: number, wallet?: string): Promise<XPLedgerRecord> {
      const col = await this.getCollection('xpHistory');

      const record: XPLedgerRecord = {
         id: `xp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
         userId,
         wallet,
         courseId,
         xpAmount,
         timestamp: new Date().toISOString()
      };

      await col.insertOne(record);

      console.log(`[XP Ledger] Mined ${xpAmount} XP for user ${userId} in course ${courseId}`);
      return record;
   }
}

// Export a singleton instance
export const userService = new UserService();
