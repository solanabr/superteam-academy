
"use client";

import { currentUser, leaderboardUsers, courses as allCourses } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const mockUsers = [
    {
        ...currentUser,
                socialLinks: {
                    ...currentUser.socialLinks,
                    linkedin: "lucas-ferreira-dev",
                },
                id: "1",
                avatar: "/avatars/01.png",
        skills: {
            rust: 75,
            anchor: 60,
            frontend: 85,
            security: 40,
        },
        achievements: [
            { id: "1", name: "Solana Starter" },
            { id: "2", name: "Anchor Pro" },
        ],
        onChainCredentials: [
            { id: "1", name: "Solana Certified Developer" },
        ],
        completedCourses: allCourses.slice(0, 2),
        publicProfile: true,
    },
    ...leaderboardUsers.map((user, index) => ({
        ...user,
        id: (index + 2).toString(),
        bio: "Solana enthusiast",
        joinDate: "2023-10-01",
        socialLinks: {
                    twitter: "#",
                    github: "#",
                    linkedin: "#",
                    website: "#",
                },
        skills: {
            rust: Math.floor(Math.random() * 100),
            anchor: Math.floor(Math.random() * 100),
            frontend: Math.floor(Math.random() * 100),
            security: Math.floor(Math.random() * 100),
        },
        achievements: [
            { id: "1", name: "Solana Starter" },
        ],
        onChainCredentials: [],
        completedCourses: allCourses.slice(0, 1),
        publicProfile: true,
    }))
];

const chartConfig = {
    value: {
        label: "Value",
        color: "hsl(var(--chart-1))",
    },
    rust: {
        label: "Rust",
        color: "hsl(var(--chart-1))",
    },
    anchor: {
        label: "Anchor",
        color: "hsl(var(--chart-2))",
    },
    frontend: {
        label: "Frontend",
        color: "hsl(var(--chart-3))",
    },
    security: {
        label: "Security",
        color: "hsl(var(--chart-4))",
    },
} satisfies ChartConfig;


export default function ProfilePageComponent({ username }: { username?: string }) {
    const user = username ? mockUsers.find(u => u.username === username) : mockUsers[0];

    if (!user) {
        return <div>User not found</div>;
    }

    const chartData = [
        { skill: "Rust", value: user.skills.rust },
        { skill: "Anchor", value: user.skills.anchor },
        { skill: "Frontend", value: user.skills.frontend },
        { skill: "Security", value: user.skills.security },
    ];

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader className="text-center">
                            <Avatar className="w-24 h-24 mx-auto">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="mt-4">{user.name}</CardTitle>
                            <p className="text-muted-foreground">{user.bio}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center space-x-4 mb-4">
                                                            {user.socialLinks?.twitter && (
                                                                <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">
                                                                    <Button variant="outline" size="sm">Twitter</Button>
                                                                </a>
                                                            )}
                                                            {user.socialLinks?.github && (
                                                                <a href={`https://github.com/${user.socialLinks.github}`} target="_blank" rel="noopener noreferrer">
                                                                    <Button variant="outline" size="sm">GitHub</Button>
                                                                </a>
                                                            )}
                                                            {user.socialLinks?.linkedin && (
                                                                <a href={`https://linkedin.com/in/${user.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer">
                                                                    <Button variant="outline" size="sm">LinkedIn</Button>
                                                                </a>
                                                            )}
                                                            {user.socialLinks?.website && (
                                                                <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                                                    <Button variant="outline" size="sm">Website</Button>
                                                                </a>
                                                            )}
                                                        </div>
                            <p className="text-sm text-muted-foreground">Joined on {user.joinDate}</p>
                            <div className="flex items-center justify-between mt-4">
                                <span>Public Profile</span>
                                <Button variant="outline" size="sm">{user.publicProfile ? "Public" : "Private"}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="w-full h-64">
                                <RadarChart data={chartData}>
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <PolarAngleAxis dataKey="skill" />
                                    <PolarGrid />
                                    <Radar name={user.name} dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.6} />
                                </RadarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Achievements</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4">
                            {user.achievements.map(achievement => (
                                <Badge key={achievement.id} variant="secondary">{achievement.name}</Badge>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>On-Chain Credentials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul>
                                {user.onChainCredentials.map(credential => (
                                    <li key={credential.id}>{credential.name}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed Courses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul>
                                {user.completedCourses.map(course => (
                                    <li key={course.slug}>{course.title}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
