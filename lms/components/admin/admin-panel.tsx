"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Shield,
  Trophy,
  Coins,
  Settings,
  LogOut,
} from "lucide-react";
import { AdminLogin } from "./admin-login";
import { OverviewTab } from "./tabs/overview-tab";
import { CoursesTab } from "./tabs/courses-tab";
import { SeasonsTab } from "./tabs/seasons-tab";
import { MintersTab } from "./tabs/minters-tab";
import { AchievementsTab } from "./tabs/achievements-tab";
import { XpTab } from "./tabs/xp-tab";
import { ConfigTab } from "./tabs/config-tab";

export function AdminPanel() {
  const [secret, setSecret] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("admin-secret");
    if (stored) setSecret(stored);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("admin-secret");
    setSecret(null);
  }, []);

  if (!mounted) return null;
  if (!secret) return <AdminLogin onAuth={setSecret} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">
            Superteam Academy Admin
          </h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="seasons">
              <Calendar className="mr-1.5 h-4 w-4" />
              Seasons
            </TabsTrigger>
            <TabsTrigger value="minters">
              <Shield className="mr-1.5 h-4 w-4" />
              Minters
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="mr-1.5 h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="xp">
              <Coins className="mr-1.5 h-4 w-4" />
              XP
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="mr-1.5 h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab adminSecret={secret} />
          </TabsContent>
          <TabsContent value="courses">
            <CoursesTab adminSecret={secret} />
          </TabsContent>
          <TabsContent value="seasons">
            <SeasonsTab adminSecret={secret} />
          </TabsContent>
          <TabsContent value="minters">
            <MintersTab adminSecret={secret} />
          </TabsContent>
          <TabsContent value="achievements">
            <AchievementsTab adminSecret={secret} />
          </TabsContent>
          <TabsContent value="xp">
            <XpTab adminSecret={secret} />
          </TabsContent>
          <TabsContent value="config">
            <ConfigTab adminSecret={secret} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
