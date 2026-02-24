"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAdminLogin, useGenerateApiKey } from "@/hooks/useAdminAuth";

export default function AdminApiKeysPage() {
    const { login, logout, token, loading: loginLoading, error: loginError } =
        useAdminLogin();
    const {
        generate,
        result: genResult,
        loading: genLoading,
        clear: clearGen,
    } = useGenerateApiKey();
    const [password, setPassword] = useState("");
    const [keyRole, setKeyRole] = useState<"admin" | "client">("client");
    const [keyLabel, setKeyLabel] = useState("");
    const [copied, setCopied] = useState(false);

    const handleCopyKey = async () => {
        if (!genResult?.apiKey) return;
        await navigator.clipboard.writeText(genResult.apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="API Keys"
                subtitle="Generate admin or client API keys for backend and integrations"
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Login</CardTitle>
                    <CardDescription>
                        Use ADMIN_PASSWORD (backend .env) to get a JWT. Required
                        to generate API keys.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {token ? (
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                Logged in. JWT active.
                            </p>
                            <Button variant="outline" size="sm" onClick={logout}>
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-2 min-w-[240px]">
                                <Label htmlFor="admin-password">Password</Label>
                                <Input
                                    id="admin-password"
                                    type="password"
                                    placeholder="ADMIN_PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => login(password)}
                                disabled={loginLoading || !password}
                            >
                                {loginLoading ? "Logging in…" : "Login"}
                            </Button>
                        </div>
                    )}
                    {loginError && (
                        <p className="text-sm text-destructive">{loginError}</p>
                    )}
                </CardContent>
            </Card>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Generate API key</CardTitle>
                    <CardDescription>
                        New keys can call academy endpoints. Store securely; the
                        key is shown only once.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {token ? (
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={keyRole}
                                    onValueChange={(v) =>
                                        setKeyRole(v as "admin" | "client")
                                    }
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">admin</SelectItem>
                                        <SelectItem value="client">client</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 min-w-[200px]">
                                <Label>Label (optional)</Label>
                                <Input
                                    placeholder="e.g. BFF prod"
                                    value={keyLabel}
                                    onChange={(e) =>
                                        setKeyLabel(e.target.value)
                                    }
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    clearGen();
                                    generate(token, {
                                        role: keyRole,
                                        label: keyLabel || undefined,
                                    });
                                }}
                                disabled={genLoading}
                            >
                                {genLoading ? "Generating…" : "Generate"}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Login first to generate API keys.
                        </p>
                    )}
                    {genResult && (
                        <div className="space-y-2">
                            {genResult.error ? (
                                <p className="text-sm text-destructive">
                                    {genResult.error}
                                </p>
                            ) : (
                                <div className="rounded-md border border-border bg-muted/50 p-3 font-mono text-sm break-all space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="break-all">
                                            <strong>API Key:</strong>{" "}
                                            {genResult.apiKey}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyKey}
                                            className="shrink-0"
                                        >
                                            {copied ? "Copied" : "Copy"}
                                        </Button>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        role: {genResult.role}
                                        {genResult.label
                                            ? ` | label: ${genResult.label}`
                                            : ""}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        Set as BACKEND_API_TOKEN or use for
                                        direct backend calls. Not shown again.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
