import { connectDB } from "./mongodb";
import { User, type IUser } from "./models/user";

export async function ensureUser(wallet: string): Promise<IUser> {
  await connectDB();
  let user = await User.findOne({ wallet });
  if (!user) {
    user = await User.create({ wallet });
  }
  return user;
}

export function getUtcDay(timestamp?: number): number {
  const ts = timestamp ?? Date.now() / 1000;
  return Math.floor(ts / 86400);
}

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}
