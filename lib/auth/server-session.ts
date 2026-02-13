import { createHmac, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserById } from '@/lib/auth/server-store';
import { AuthSessionUser } from '@/lib/auth/server-types';

const SESSION_COOKIE = 'superteam_auth_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function secretKey(): string {
  return process.env.AUTH_SECRET ?? 'superteam-dev-secret-change-me';
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf-8');
}

function signPart(value: string): string {
  return createHmac('sha256', secretKey()).update(value).digest('base64url');
}

function packSignedPayload(payload: Record<string, unknown>): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = signPart(encoded);
  return `${encoded}.${signature}`;
}

function unpackSignedPayload<T>(raw: string): T | null {
  const [encoded, signature] = raw.split('.');
  if (!encoded || !signature) {
    return null;
  }

  const expected = signPart(encoded);
  if (expected !== signature) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encoded)) as T;
  } catch {
    return null;
  }
}

interface SessionPayload {
  userId: string;
  exp: number;
}

export interface ServerSession {
  user: AuthSessionUser;
  expiresAt: number;
}

export function randomNonce(size = 24): string {
  return randomBytes(size).toString('base64url');
}

export function buildSignedStateCookie(payload: Record<string, unknown>): string {
  return packSignedPayload(payload);
}

export function readSignedStateCookie<T>(raw: string | undefined): T | null {
  if (!raw) {
    return null;
  }
  return unpackSignedPayload<T>(raw);
}

function buildSessionCookieValue(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return packSignedPayload({
    userId,
    exp
  } satisfies SessionPayload);
}

function parseSessionCookie(raw: string | undefined): SessionPayload | null {
  if (!raw) {
    return null;
  }
  return unpackSignedPayload<SessionPayload>(raw);
}

export async function getSessionFromRequest(request: NextRequest): Promise<ServerSession | null> {
  const token = parseSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);
  if (!token) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (token.exp <= now) {
    return null;
  }

  const user = await getSessionUserById(token.userId);
  if (!user) {
    return null;
  }

  return {
    user,
    expiresAt: token.exp
  };
}

export function clearSession(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0)
  });
}

export function setSession(response: NextResponse, userId: string): void {
  const value = buildSessionCookieValue(userId);
  response.cookies.set({
    name: SESSION_COOKIE,
    value,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS
  });
}
