"use client";

import { Header } from "./header";
import { HeaderStats } from "@/components/gamification/header-stats";

/** Header with gamification stats — requires WalletProvider + LearningProgressProvider */
export function AppHeader() {
  return <Header appSlot={<HeaderStats />} />;
}
