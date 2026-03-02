// app/src/app/[locale]/admin/users/page.tsx
import { prisma } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

// Это серверный компонент, он грузит данные напрямую
export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
      orderBy: { lastLogin: 'desc' },
      take: 100 // Ограничиваем для производительности, в идеале нужна пагинация
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">View and analyze your student base.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Recent Users ({users.length})</CardTitle>
            <CardDescription>Sorted by last activity</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Level / XP</TableHead>
                        <TableHead className="text-right">Streak</TableHead>
                        <TableHead className="text-right">Last Login</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.walletAddress}`} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">
                                            {user.username || user.name || "Anonymous"}
                                        </span>
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {user.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : "No Wallet"}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {user.role === "ADMIN" ? (
                                    <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>
                                ) : (
                                    <Badge variant="secondary">User</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="font-medium">Lvl {Math.floor(Math.sqrt(user.xp / 100))}</div>
                                <div className="text-xs text-muted-foreground">{user.xp} XP</div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-500">
                                {user.streak > 0 ? `🔥 ${user.streak}` : "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}