"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const MOCK_REPLIES = [
  {
    id: "r1",
    author: "user_xyz1",
    body: "You can derive PDAs using `PublicKey.findProgramAddressSync()` with your seed buffers. Make sure to pass the program ID as the second argument.",
    isSolution: true,
    createdAt: "2026-02-28T11:00:00Z",
  },
  {
    id: "r2",
    author: "user_abc2",
    body: "Here's an example:\n\n```\nconst [pda] = PublicKey.findProgramAddressSync(\n  [Buffer.from(\"course\"), Buffer.from(courseId)],\n  PROGRAM_ID\n);\n```",
    isSolution: false,
    createdAt: "2026-02-28T12:30:00Z",
  },
  {
    id: "r3",
    author: "user_def3",
    body: "Don't forget to store the bump in your account struct so you don't have to recalculate it every time.",
    isSolution: false,
    createdAt: "2026-02-28T14:00:00Z",
  },
];

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const locale = useLocale();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Link
        href={`/${locale}/community`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Community
      </Link>

      {/* Thread */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarFallback>UA</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">
                How to derive PDAs in Anchor?
              </h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span>@user_abc1</span>
                <Badge variant="outline" className="text-[10px]">
                  anchor-fundamentals
                </Badge>
                <Badge variant="outline" className="bg-superteam-green/10 text-superteam-green border-superteam-green/20 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Solved
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                I&apos;m working through the Anchor Fundamentals course and I&apos;m confused
                about how PDA derivation works. Can someone explain the difference
                between `findProgramAddressSync` and `createProgramAddressSync`?
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {MOCK_REPLIES.length} Replies
        </h3>

        {MOCK_REPLIES.map((reply) => (
          <Card
            key={reply.id}
            className={reply.isSolution ? "border-superteam-green/40" : ""}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {reply.author.slice(5, 7).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">@{reply.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                    {reply.isSolution && (
                      <Badge className="bg-superteam-green/10 text-superteam-green border-superteam-green/20 text-[10px]">
                        Solution
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Reply Input */}
      <Card>
        <CardContent className="p-4">
          <textarea
            placeholder="Write a reply..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[100px] mb-3"
          />
          <Button>Post Reply</Button>
        </CardContent>
      </Card>
    </div>
  );
}
