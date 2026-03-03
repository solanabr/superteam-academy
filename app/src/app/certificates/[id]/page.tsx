"use client";

import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
    Award,
    ExternalLink,
    Share2,
    Download,
    Shield,
    Zap,
    BookOpen,
    Calendar,
    CheckCircle,
} from "lucide-react";
import { CredentialService } from "@/services";

export default function CertificatePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const t = useTranslations("certificate");
    const credential = CredentialService.getCredentialById(id);

    if (!credential) {
        // Show demo credential
        return (
            <div className="min-h-screen py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <DemoCertificate t={t} id={id} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <CertificateCard credential={credential} t={t} />
            </div>
        </div>
    );
}

function DemoCertificate({ t, id }: { t: ReturnType<typeof useTranslations<"certificate">>; id: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
        >
            {/* Certificate Card */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-purple-500/30">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0520] via-[#1a0e3e] to-[#0a1628]" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5"
                        style={{
                            backgroundImage: "radial-gradient(circle at 25% 25%, #9945ff 0%, transparent 50%), radial-gradient(circle at 75% 75%, #14f195 0%, transparent 50%)",
                        }}
                    />
                </div>

                <div className="relative p-8 sm:p-12 text-center">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center font-bold text-white">
                            SA
                        </div>
                        <span className="text-xl font-bold text-white">Superteam Academy</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{t("title")}</h1>
                    <div className="w-24 h-0.5 bg-gradient-to-r from-purple-600 to-emerald-500 mx-auto mb-8" />

                    {/* Award Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-emerald-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
                        <Award className="w-10 h-10 text-purple-400" />
                    </div>

                    <p className="text-gray-400 mb-2">{t("awardedTo")}</p>
                    <h2 className="text-2xl font-bold text-white mb-6">Solana Learner</h2>

                    <p className="text-sm text-gray-400 mb-1">Solana Fundamentals</p>
                    <p className="text-sm text-gray-500">
                        {t("completedOn")} {new Date().toLocaleDateString()}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                        <div className="p-3 rounded-xl bg-white/5">
                            <BookOpen className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                            <div className="text-lg font-bold text-white">1</div>
                            <div className="text-xs text-gray-500">{t("coursesCompleted")}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                            <div className="text-lg font-bold text-white">800</div>
                            <div className="text-xs text-gray-500">{t("totalXP")}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <div className="text-lg font-bold text-white">Level 2</div>
                            <div className="text-xs text-gray-500">Level</div>
                        </div>
                    </div>

                    {/* Verification */}
                    <div className="mt-8 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {t("verifiedOnChain")}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                            {t("mintAddress")}: CRD1...xyz
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 mt-6">
                <a
                    href="https://explorer.solana.com/?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary/50 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    {t("viewOnExplorer")}
                </a>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary/50 transition-colors">
                    <Share2 className="w-4 h-4" />
                    {t("share")}
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary/50 transition-colors">
                    <Download className="w-4 h-4" />
                    {t("download")}
                </button>
            </div>
        </motion.div>
    );
}

function CertificateCard({
    credential,
    t,
}: {
    credential: NonNullable<ReturnType<typeof CredentialService.getCredentialById>>;
    t: ReturnType<typeof useTranslations<"certificate">>;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
        >
            <div className="relative overflow-hidden rounded-3xl border-2 border-purple-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0520] via-[#1a0e3e] to-[#0a1628]" />

                <div className="relative p-8 sm:p-12 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center font-bold text-white">SA</div>
                        <span className="text-xl font-bold text-white">Superteam Academy</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{t("title")}</h1>
                    <div className="w-24 h-0.5 bg-gradient-to-r from-purple-600 to-emerald-500 mx-auto mb-8" />

                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-emerald-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
                        <Award className="w-10 h-10 text-purple-400" />
                    </div>

                    <p className="text-gray-400 mb-2">{t("awardedTo")}</p>
                    <h2 className="text-2xl font-bold text-white mb-6">{credential.owner}</h2>

                    <p className="text-sm text-gray-400 mb-1">{credential.trackName}</p>
                    <p className="text-sm text-gray-500">{t("completedOn")} {new Date(credential.issuedAt).toLocaleDateString()}</p>

                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-lg font-bold text-white">{credential.coursesCompleted}</div>
                            <div className="text-xs text-gray-500">{t("coursesCompleted")}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-lg font-bold text-white">{credential.totalXP}</div>
                            <div className="text-xs text-gray-500">{t("totalXP")}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <div className="text-lg font-bold text-white">Level {credential.level}</div>
                            <div className="text-xs text-gray-500">Level</div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {t("verifiedOnChain")}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{t("mintAddress")}: {credential.mintAddress}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
                <a href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary/50 transition-colors">
                    <ExternalLink className="w-4 h-4" /> {t("viewOnExplorer")}
                </a>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary/50 transition-colors">
                    <Share2 className="w-4 h-4" /> {t("share")}
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:bg-secondary/50 transition-colors">
                    <Download className="w-4 h-4" /> {t("download")}
                </button>
            </div>
        </motion.div>
    );
}
