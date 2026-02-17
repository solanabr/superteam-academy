import { UserProfile } from '@/contexts/AuthContext';
import { LocalStorageManager } from './storage';

export class LocalUserService {
    static getUserProfile(userId: string): UserProfile | null {
        return LocalStorageManager.getItem<UserProfile>(`user_${userId}`);
    }

    static saveUserProfile(user: UserProfile): void {
        if (!user.id) return;
        LocalStorageManager.setItem(`user_${user.id}`, user);
    }

    static updateXP(userId: string, amount: number): UserProfile | null {
        const user = this.getUserProfile(userId);
        if (!user) return null;

        user.xp = (user.xp || 0) + amount;
        user.level = Math.floor(Math.sqrt(user.xp / 100));

        this.saveUserProfile(user);
        return user;
    }
}
