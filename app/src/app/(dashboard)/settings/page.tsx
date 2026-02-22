"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { publicKey } = useWallet();
  const { userDb } = useUser(); // Берем данные из хука (он читает из БД)
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    twitter: "",
    github: ""
  });

  // Заполняем форму данными из БД при загрузке
  useEffect(() => {
    if (userDb) {
      setFormData({
        username: userDb.username || "",
        bio: userDb.bio || "",
        twitter: userDb.twitter || "",
        github: userDb.github || ""
      });
    }
  }, [userDb]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          ...formData
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="SolanaEnjoyer" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                placeholder="Tell us about yourself" 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter Handle</Label>
                    <Input 
                        id="twitter" 
                        placeholder="@username" 
                        value={formData.twitter}
                        onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="github">GitHub Username</Label>
                    <Input 
                        id="github" 
                        placeholder="username" 
                        value={formData.github}
                        onChange={(e) => setFormData({...formData, github: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}