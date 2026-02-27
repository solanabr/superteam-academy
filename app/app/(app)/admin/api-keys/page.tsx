"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="space-y-4 sm:space-y-6">
            <PageHeader
                title="API Keys"
                subtitle="Generate admin or client API keys for backend and integrations"
            />

            <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
                <h2 className="font-game text-xl mb-1">Login</h2>
                <p className="font-game text-muted-foreground text-sm mb-4">
                    Use ADMIN_PASSWORD (backend .env) to get a JWT. Required
                    to generate API keys.
                </p>
                {token ? (
                    <div className="flex items-center gap-2">
                        <p className="font-game text-sm text-muted-foreground">
                            Logged in. JWT active.
                        </p>
                        <Button variant="outline" size="sm" className="font-game border-2 border-border" onClick={logout}>
                            Logout
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="space-y-2 w-full min-w-0 sm:min-w-[200px] sm:max-w-[280px]">
                            <Label htmlFor="admin-password" className="font-game">Password</Label>
                            <Input
                                id="admin-password"
                                type="password"
                                placeholder="ADMIN_PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="pixel"
                            className="font-game"
                            onClick={() => login(password)}
                            disabled={loginLoading || !password}
                        >
                            {loginLoading ? "Logging in…" : "Login"}
                        </Button>
                    </div>
                )}
                {loginError && (
                    <p className="font-game text-sm text-destructive mt-2">{loginError}</p>
                )}
            </div>

            <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
                <h2 className="font-game text-xl mb-1">Generate API key</h2>
                <p className="font-game text-muted-foreground text-sm mb-4">
                    New keys can call academy endpoints. Store securely; the
                    key is shown only once.
                </p>
                {token ? (
                    <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="space-y-2 w-full min-w-0 sm:w-28">
                            <Label className="font-game">Role</Label>
                            <Select
                                value={keyRole}
                                onValueChange={(v) =>
                                    setKeyRole(v as "admin" | "client")
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[120px] font-game">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">admin</SelectItem>
                                    <SelectItem value="client">client</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 w-full min-w-0 sm:min-w-[160px] sm:max-w-[220px]">
                            <Label className="font-game">Label (optional)</Label>
                            <Input
                                placeholder="e.g. BFF prod"
                                value={keyLabel}
                                onChange={(e) =>
                                    setKeyLabel(e.target.value)
                                }
                            />
                        </div>
                        <Button
                            variant="pixel"
                            className="font-game"
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
                    <p className="font-game text-sm text-muted-foreground">
                        Login first to generate API keys.
                    </p>
                )}
                {genResult && (
                    <div className="space-y-2 mt-4">
                        {genResult.error ? (
                            <p className="font-game text-sm text-destructive">
                                {genResult.error}
                            </p>
                        ) : (
                            <div className="rounded-xl border-2 border-border bg-muted/50 p-4 font-mono text-sm break-all space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="break-all font-game">
                                        <strong>API Key:</strong>{" "}
                                        {genResult.apiKey}
                                    </span>
                                    <Button
                                        variant="pixel"
                                        size="sm"
                                        className="font-game shrink-0"
                                        onClick={handleCopyKey}
                                    >
                                        {copied ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                                <p className="font-game text-muted-foreground text-sm">
                                    role: {genResult.role}
                                    {genResult.label
                                        ? ` | label: ${genResult.label}`
                                        : ""}
                                </p>
                                <p className="font-game text-muted-foreground text-sm">
                                    Set as BACKEND_API_TOKEN or use for
                                    direct backend calls. Not shown again.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
