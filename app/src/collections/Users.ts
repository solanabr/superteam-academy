import type { CollectionConfig, PayloadRequest } from "payload";
import { isAuthenticated, isAdmin, adminFieldUpdate } from "./access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "displayName", "role", "updatedAt"],
  },
  access: {
    read: isAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: ({ req }: { req: PayloadRequest }): boolean => {
      const role = (req.user as { role?: string } | null)?.role;
      return role === "admin" || role === "editor";
    },
  },
  hooks: {
    afterLogin: [
      ({ req, user }) => {
        req.payload.logger.info(
          `[auth] Login: ${user.email} (role: ${user.role})`,
        );
      },
    ],
    afterLogout: [
      ({ req }) => {
        req.payload.logger.info("[auth] Logout");
      },
    ],
  },
  fields: [
    {
      name: "displayName",
      type: "text",
      admin: { description: "Display name for audit logs" },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      access: { update: adminFieldUpdate },
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
  ],
};
