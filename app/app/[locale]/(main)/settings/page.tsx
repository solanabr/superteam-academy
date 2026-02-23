import type { Metadata } from "next";
import SettingsPage from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your theme, language, notifications, privacy, and connected accounts on Superteam Academy.",
};

export default function Page() {
  return <SettingsPage />;
}
