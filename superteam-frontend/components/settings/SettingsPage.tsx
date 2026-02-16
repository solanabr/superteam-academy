
import { currentUser } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your public profile information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                                                                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button>Change Avatar</Button>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="name">Name</label>
                                                        <Input id="name" defaultValue={currentUser.name} />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="bio">Bio</label>
                                                        <Textarea id="bio" defaultValue={currentUser.bio} />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="twitter">Twitter</label>
                                                        <Input id="twitter" defaultValue={`https://twitter.com/${currentUser.socialLinks.twitter}`} />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="github">GitHub</label>
                                                        <Input id="github" defaultValue={`https://github.com/${currentUser.socialLinks.github}`} />
                                                    </div>
                                                    <Button>Save Changes</Button>
                                                </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Manage your account settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                                                    <label htmlFor="email">Email</label>
                                                    <Input id="email" type="email" defaultValue={currentUser.email} />
                                                </div>
                                                <div>
                                                    <label>Connected Wallets</label>
                                                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                                        <span>solana:xxxx...yyyy</span>
                                                        <Button variant="destructive">Disconnect</Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label>Connected Accounts</label>
                                                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                                        <span>Google</span>
                                                        <Button variant="destructive">Disconnect</Button>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md mt-2">
                                                        <span>GitHub</span>
                                                        <Button variant="destructive">Disconnect</Button>
                                                    </div>
                                                </div>
                                                <Button>Save Changes</Button>
                                            </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="language">Language</label>
                                                        <Select>
                                                            <SelectTrigger id="language">
                                                                <SelectValue placeholder="Select language" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="en">English</SelectItem>
                                                                <SelectItem value="es">Spanish</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label htmlFor="theme">Theme</label>
                                                        <Select>
                                                            <SelectTrigger id="theme">
                                                                <SelectValue placeholder="Select theme" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="light">Light</SelectItem>
                                                                <SelectItem value="dark">Dark</SelectItem>
                                                                <SelectItem value="system">System</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label>Notifications</label>
                                                        <div className="space-y-2 mt-2">
                                                            <div className="flex items-center justify-between">
                                                                <label htmlFor="email-notifications" className="cursor-pointer">Email Notifications</label>
                                                                <Switch id="email-notifications" />
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <label htmlFor="push-notifications" className="cursor-pointer">Push Notifications</label>
                                                                <Switch id="push-notifications" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button>Save Changes</Button>
                                                </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Privacy</CardTitle>
                        <CardDescription>Control your privacy settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="profile-visibility">Profile Visibility</label>
                                                        <Select>
                                                            <SelectTrigger id="profile-visibility">
                                                                <SelectValue placeholder="Select visibility" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="public">Public</SelectItem>
                                                                <SelectItem value="private">Private</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label>Data Export</label>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span>Export your personal data.</span>
                                                            <Button>Export</Button>
                                                        </div>
                                                    </div>
                                                    <Button>Save Changes</Button>
                                                </CardContent>
                </Card>
            </div>
        </div>
    );
}
