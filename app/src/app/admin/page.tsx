"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSES, TRACKS } from "@/data/mock";
import {
  Settings,
  BookOpen,
  Users,
  Zap,
  Plus,
  RotateCcw,
  Shield,
  Activity,
} from "lucide-react";

export default function AdminPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Platform management. Requires authority wallet signature.
          </p>
        </div>
        <Badge variant="outline" className="text-orange-400 border-orange-400/30">
          Devnet
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Courses", value: COURSES.filter(c => c.isActive).length, icon: BookOpen, color: "text-primary" },
          { label: "Total Enrollments", value: "12.1K", icon: Users, color: "text-solana-blue" },
          { label: "XP Minted", value: "4.2M", icon: Zap, color: "text-solana-green" },
          { label: "Active Learners", value: "3,847", icon: Activity, color: "text-orange-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Config PDA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Current Season", value: "1" },
              { label: "Season Status", value: "Active" },
              { label: "Max Daily XP", value: "2,000" },
              { label: "Max Achievement XP", value: "1,000" },
              { label: "Backend Signer", value: "7xKX...gAsU" },
              { label: "Authority (Multisig)", value: "Sqds...3mKp" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-mono font-medium">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" size="sm" disabled>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate Backend Signer
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create Season
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Courses
          </CardTitle>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {COURSES.map((course) => {
              const track = TRACKS.find((t) => t.id === course.trackId);
              return (
                <div
                  key={course.slug}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded bg-gradient-to-br ${course.thumbnailGradient} flex items-center justify-center`}
                    >
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {track?.display} | {course.lessonCount} lessons |{" "}
                        {course.xpTotal} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {course.totalEnrollments} enrolled
                    </span>
                    <Badge
                      variant={course.isActive ? "default" : "secondary"}
                      className={course.isActive ? "bg-solana-green text-black" : ""}
                    >
                      {course.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notice */}
      <Card className="border-orange-400/20 bg-orange-400/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Admin actions require the platform authority wallet (Squads multisig)
            to sign transactions. All management instructions are gated on-chain.
            This interface is read-only until connected with the authority wallet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
