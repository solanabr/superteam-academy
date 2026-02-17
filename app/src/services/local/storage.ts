export class LocalStorageManager {
    static getItem<T>(key: string): T | null {
        if (typeof window === 'undefined') return null;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Error reading ${key} from localStorage`, e);
            return null;
        }
    }

    static setItem<T>(key: string, value: T): void {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error writing ${key} to localStorage`, e);
        }
    }

    static removeItem(key: string): void {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.removeItem(key);
        } catch (e) {
            console.error(`Error removing ${key} from localStorage`, e);
        }
    }
}
