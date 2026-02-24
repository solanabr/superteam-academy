"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { githubAuth } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-context";
import { motion } from "framer-motion";
import { Github, Loader2, AlertCircle } from "lucide-react";

function GitHubCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");

        if (!code) {
            setError("No authorization code received from GitHub.");
            return;
        }

        (async () => {
            try {
                const result = await githubAuth(code);
                login(result.token, result.user);
                // Redirect back to auth page (linking step)
                router.push("/dashboard");
            } catch (err) {
                setError(err instanceof Error ? err.message : "GitHub authentication failed");
            }
        })();
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen bg-[#020408] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
            >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-zinc-400 to-zinc-600 p-[1px]">
                    <div className="w-full h-full rounded-2xl bg-[#080c14] flex items-center justify-center">
                        <Github className="w-8 h-8 text-white" />
                    </div>
                </div>

                {error ? (
                    <>
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                        <button
                            onClick={() => router.push("/auth")}
                            className="text-sm text-zinc-500 hover:text-white transition-colors underline"
                        >
                            Back to sign in
                        </button>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
                        <p className="text-sm text-zinc-500">Authenticating with GitHub...</p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function GitHubCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#020408] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                </div>
            }
        >
            <GitHubCallbackContent />
        </Suspense>
    );
}
