"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, AlertCircle, Loader2, Camera } from "lucide-react";

/**
 * First-time onboarding dialog.
 * Shown once after a user signs in for the first time.
 * Collects username and optionally an avatar.
 */
export function OnboardingDialog() {
    const { user, updateSession, isAuthenticated } = useAuth();
    const [username, setUsername] = useState(user?.name?.replace(/\s+/g, "_").toLowerCase() ?? "");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Don't show if not authenticated or already onboarded
    if (!isAuthenticated || !user || user.isOnboarded) return null;

    const validate = (name: string): string | null => {
        const trimmed = name.trim();
        if (trimmed.length < 3) return "Username must be at least 3 characters.";
        if (trimmed.length > 24) return "Username must be 24 characters or less.";
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Only letters, numbers, and underscores allowed.";
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validate(username);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.trim(),
                    avatar: user.image ?? null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
                return;
            }

            // Update the NextAuth session
            await updateSession({
                username: data.username,
                image: data.avatar,
                isOnboarded: true,
            } as any);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-generated avatar from the first letter
    const avatarLetter = (username || "?")[0].toUpperCase();
    const hasExternalAvatar = !!user.image;

    return (
        <Dialog open={true}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-solana-purple/15 to-solana-green/15">
                        <Sparkles className="h-7 w-7 text-solana-purple" />
                    </div>
                    <DialogTitle className="font-display text-xl">
                        Welcome to Superteam Academy!
                    </DialogTitle>
                    <DialogDescription>
                        Set up your profile to get started. You can always change these later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* Avatar preview */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            {hasExternalAvatar ? (
                                <img
                                    src={user.image!}
                                    alt="Avatar"
                                    className="h-20 w-20 rounded-full object-cover border-4 border-solana-purple/20"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple to-solana-green border-4 border-solana-purple/20">
                                    <span className="text-2xl font-bold text-white">
                                        {avatarLetter}
                                    </span>
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-border shadow-sm">
                                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {hasExternalAvatar
                                ? "Using your account avatar. You can change it in settings."
                                : "You can add a profile picture in settings later."}
                        </p>
                    </div>

                    {/* Username input */}
                    <div className="space-y-2">
                        <Label htmlFor="onboard-username" className="text-sm font-medium">
                            Username
                        </Label>
                        <Input
                            id="onboard-username"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (error) setError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                            }}
                            placeholder="e.g. solana_dev"
                            className="rounded-xl"
                            maxLength={24}
                            autoFocus
                        />
                        {error && (
                            <p className="flex items-center gap-1.5 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                {error}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            3–24 characters. Letters, numbers, and underscores only.
                        </p>
                    </div>

                    {/* Submit */}
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !username.trim()}
                        className="w-full rounded-xl h-11 bg-gradient-to-r from-solana-purple to-solana-green text-white font-semibold hover:brightness-110"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Get Started
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
