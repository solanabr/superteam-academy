import { describe, it, expect } from 'vitest';
import {
  getUserRole,
  getPermissions,
  hasPermission,
  isAdmin,
  isInstructor,
  type UserRole,
  type Permission,
} from '@/lib/rbac';

const ADMIN_WALLET = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const ADMIN_WALLET_2 = 'GpXHXs5KfzfXbNKcMLNbAMsJsgPsBE7y5GtwVoiuxYvH';
const RANDOM_WALLET = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0';

describe('getUserRole', () => {
  it('returns learner for null wallet', () => {
    expect(getUserRole(null)).toBe('learner');
  });

  it('returns learner for undefined wallet', () => {
    expect(getUserRole(undefined)).toBe('learner');
  });

  it('returns learner for empty string', () => {
    expect(getUserRole('')).toBe('learner');
  });

  it('returns admin for admin wallet 1', () => {
    expect(getUserRole(ADMIN_WALLET)).toBe('admin');
  });

  it('returns admin for admin wallet 2', () => {
    expect(getUserRole(ADMIN_WALLET_2)).toBe('admin');
  });

  it('returns learner for random wallet', () => {
    expect(getUserRole(RANDOM_WALLET)).toBe('learner');
  });
});

describe('getPermissions', () => {
  it('learner can view and learn content', () => {
    const perms = getPermissions('learner');
    expect(perms.viewContent).toBe(true);
    expect(perms.learnContent).toBe(true);
  });

  it('learner cannot create or publish courses', () => {
    const perms = getPermissions('learner');
    expect(perms.createCourses).toBe(false);
    expect(perms.publishCourses).toBe(false);
  });

  it('learner has no admin or system access', () => {
    const perms = getPermissions('learner');
    expect(perms.adminAccess).toBe(false);
    expect(perms.systemConfig).toBe(false);
  });

  it('instructor can create and publish courses', () => {
    const perms = getPermissions('instructor');
    expect(perms.createCourses).toBe(true);
    expect(perms.publishCourses).toBe(true);
  });

  it('instructor has no admin access', () => {
    const perms = getPermissions('instructor');
    expect(perms.adminAccess).toBe(false);
    expect(perms.systemConfig).toBe(false);
  });

  it('admin has all permissions', () => {
    const perms = getPermissions('admin');
    expect(perms.viewContent).toBe(true);
    expect(perms.learnContent).toBe(true);
    expect(perms.createCourses).toBe(true);
    expect(perms.publishCourses).toBe(true);
    expect(perms.adminAccess).toBe(true);
    expect(perms.systemConfig).toBe(true);
  });
});

describe('hasPermission', () => {
  it('admin has all permissions', () => {
    expect(hasPermission(ADMIN_WALLET, 'viewContent')).toBe(true);
    expect(hasPermission(ADMIN_WALLET, 'adminAccess')).toBe(true);
    expect(hasPermission(ADMIN_WALLET, 'systemConfig')).toBe(true);
  });

  it('learner has viewContent', () => {
    expect(hasPermission(RANDOM_WALLET, 'viewContent')).toBe(true);
  });

  it('learner does not have adminAccess', () => {
    expect(hasPermission(RANDOM_WALLET, 'adminAccess')).toBe(false);
  });

  it('null wallet has learner permissions', () => {
    expect(hasPermission(null, 'viewContent')).toBe(true);
    expect(hasPermission(null, 'adminAccess')).toBe(false);
  });
});

describe('isAdmin', () => {
  it('returns true for admin wallets', () => {
    expect(isAdmin(ADMIN_WALLET)).toBe(true);
    expect(isAdmin(ADMIN_WALLET_2)).toBe(true);
  });

  it('returns false for random wallet', () => {
    expect(isAdmin(RANDOM_WALLET)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdmin(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe('isInstructor', () => {
  it('admins are also instructors', () => {
    expect(isInstructor(ADMIN_WALLET)).toBe(true);
  });

  it('returns false for random wallet', () => {
    expect(isInstructor(RANDOM_WALLET)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isInstructor(null)).toBe(false);
  });
});
