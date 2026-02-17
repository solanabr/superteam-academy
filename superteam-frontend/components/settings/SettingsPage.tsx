import type { IdentityProfile } from "@/lib/identity/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SettingsPage({
  profile,
  walletAddress,
}: {
  profile?: IdentityProfile | null;
  walletAddress: string;
}) {
  const name = profile?.name ?? "";
  const bio = profile?.bio ?? "";
  const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback>
                  {name.slice(0, 2) || shortWallet.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <Button disabled>Change Avatar</Button>
            </div>
            <div>
              <label htmlFor="name">Name</label>
              <Input id="name" defaultValue={name} placeholder="Display name" />
            </div>
            <div>
              <label htmlFor="bio">Bio</label>
              <Textarea id="bio" defaultValue={bio} placeholder="Short bio" />
            </div>
            <div>
              <label htmlFor="twitter">Twitter</label>
              <Input id="twitter" placeholder="https://twitter.com/..." />
            </div>
            <div>
              <label htmlFor="github">GitHub</label>
              <Input id="github" placeholder="https://github.com/..." />
            </div>
            <Button disabled>Save Changes (coming soon)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label>Connected Wallet</label>
              <div className="flex items-center justify-between p-2 bg-muted rounded-md mt-1">
                <span className="font-mono text-sm">{shortWallet}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
