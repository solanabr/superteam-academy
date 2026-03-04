import { prisma } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const t = await getTranslations("AdminUsers");

  const users = await prisma.user.findMany({ orderBy: { lastLogin: "desc" }, take: 100 });

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card className="border-white/10 bg-black/25 backdrop-blur-md">
        <CardHeader>
          <CardTitle>{t("recentUsers", { count: users.length })}</CardTitle>
          <CardDescription>{t("sortedBy")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("user")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead className="text-right">{t("levelXp")}</TableHead>
                <TableHead className="text-right">{t("streak")}</TableHead>
                <TableHead className="text-right">{t("lastLogin")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.walletAddress}`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.username || user.name || t("anonymous")}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {user.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : t("noWallet")}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === "ADMIN" ? <Badge className="bg-purple-500 hover:bg-purple-600">{t("admin")}</Badge> : <Badge variant="secondary">{t("userRole")}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{t("level")} {Math.floor(Math.sqrt(user.xp / 100))}</div>
                    <div className="text-xs text-muted-foreground">{user.xp} XP</div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-orange-500">{user.streak > 0 ? `🔥 ${user.streak}` : "-"}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
