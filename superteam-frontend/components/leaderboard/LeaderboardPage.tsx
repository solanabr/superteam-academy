
"use client";

import { useState } from "react";
import { leaderboardUsers, currentUser } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LeaderboardPage() {
    const [filter, setFilter] = useState("all-time");

    const weeklyUsers = [...leaderboardUsers].sort(() => Math.random() - 0.5).map((user, index) => ({ ...user, rank: index + 1 }));
    const monthlyUsers = [...leaderboardUsers].sort(() => Math.random() - 0.5).map((user, index) => ({ ...user, rank: index + 1 }));

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
            <Tabs defaultValue="all-time" onValueChange={setFilter}>
                <TabsList>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="all-time">All-Time</TabsTrigger>
                </TabsList>
                <TabsContent value="weekly">
                    <LeaderboardTable users={weeklyUsers} currentUser={currentUser} />
                </TabsContent>
                <TabsContent value="monthly">
                    <LeaderboardTable users={monthlyUsers} currentUser={currentUser} />
                </TabsContent>
                <TabsContent value="all-time">
                    <LeaderboardTable users={leaderboardUsers} currentUser={currentUser} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function LeaderboardTable({ users, currentUser }: { users: any[], currentUser: any }) {
    const currentUserInList = users.find(u => u.username === currentUser.username);

    return (
        <Card>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>XP</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Streak</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.username} className={user.username === currentUser.username ? "bg-primary/10" : ""}>
                                <TableCell>{user.rank}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.avatar}</AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.xp}</TableCell>
                                <TableCell>{user.level}</TableCell>
                                <TableCell>{user.streak}</TableCell>
                            </TableRow>
                        ))}
                        {!currentUserInList && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-4 border-b border-dashed"></TableCell>
                                </TableRow>
                                <TableRow className="bg-primary/10">
                                    <TableCell>{currentUser.rank}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={currentUser.avatar} />
                                                <AvatarFallback>{currentUser.avatar}</AvatarFallback>
                                            </Avatar>
                                            <span>{currentUser.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{currentUser.xp}</TableCell>
                                    <TableCell>{currentUser.level}</TableCell>
                                    <TableCell>{currentUser.streak}</TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
