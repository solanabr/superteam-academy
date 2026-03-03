"use client";

import { Award, Download, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const CERTIFICATES = [
    {
        id: "cert-anchor-1",
        title: "Anchor Developer",
        course: "Anchor Basics",
        date: "Oct 24, 2024",
        skills: ["Rust", "Anchor", "Solana CLI"],
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=250",
    },
    {
        id: "cert-nft-1",
        title: "NFT Architect",
        course: "NFTs & Metaplex",
        date: "Nov 02, 2024",
        skills: ["Metaplex Core", "Umi", "Frontend"],
        image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&q=80&w=400&h=250",
    }
];

export default function CertificatesPage() {
    const t = useTranslations("certificates");

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="font-heading text-4xl font-bold mb-4 flex items-center justify-center sm:justify-start gap-3">
                        <Award className="w-10 h-10 text-yellow-400" />
                        {t("title")}
                    </h1>
                    <p className="text-[hsl(var(--muted-foreground))] max-w-2xl">
                        {t("subtitle")}
                    </p>
                </div>

                {CERTIFICATES.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center text-[hsl(var(--muted-foreground))]">
                        <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-heading font-semibold mb-2">{t("no_certificates")}</h3>
                        <p className="mb-6">{t("complete_courses")}</p>
                        <Link
                            href="/courses"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            {t("browse_courses")}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {CERTIFICATES.map((cert) => (
                            <div key={cert.id} className="glass rounded-2xl overflow-hidden group">
                                <Link href={`/certificates/${cert.id}`}>
                                    <div className="relative h-48 sm:h-56 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                                        <img
                                            src={cert.image}
                                            alt={cert.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 right-4 z-20">
                                            <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/10">
                                                Verified on Solana
                                            </span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="font-heading text-2xl font-bold mb-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                                                {cert.title}
                                            </h2>
                                            <p className="text-[hsl(var(--muted-foreground))] text-sm">
                                                {cert.course} • Issued {cert.date}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--primary))] hover:text-white transition-colors" title="Download PDF">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--primary))] hover:text-white transition-colors" title="Share">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {cert.skills.map((skill) => (
                                            <span key={skill} className="px-2.5 py-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md text-xs font-medium text-[hsl(var(--muted-foreground))]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                                        <Link
                                            href={`/certificates/${cert.id}`}
                                            className="text-sm font-semibold text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                                        >
                                            {t("view_details")}
                                        </Link>

                                        <a
                                            href="#"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                        >
                                            View Tx <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
