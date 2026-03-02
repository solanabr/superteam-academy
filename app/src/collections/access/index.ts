import type { Access, FieldAccess } from "payload";

type UserWithRole = { role?: string };

export const isAdmin: Access = ({ req }) => {
  const user = req.user as UserWithRole | null;
  return user?.role === "admin";
};

export const isAdminOrEditor: Access = ({ req }) => {
  const user = req.user as UserWithRole | null;
  return user?.role === "admin" || user?.role === "editor";
};

export const isAuthenticated: Access = ({ req }) => {
  return !!req.user;
};

export const allowPublicRead: Access = () => true;

export const adminFieldUpdate: FieldAccess = ({ req }) => {
  const user = req.user as UserWithRole | null;
  return user?.role === "admin";
};
