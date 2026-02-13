import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  try {
    const [algorithm, salt, storedHex] = encodedHash.split(':');
    if (algorithm !== 'scrypt' || !salt || !storedHex) {
      return false;
    }

    const stored = Buffer.from(storedHex, 'hex');
    const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

    if (stored.length !== derived.length) {
      return false;
    }

    return timingSafeEqual(stored, derived);
  } catch {
    return false;
  }
}
