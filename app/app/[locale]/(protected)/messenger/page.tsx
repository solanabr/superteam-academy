"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    ArrowLeft,
    Search,
    MessageCircle,
    Clock,
    Zap,
    Flame,
} from "lucide-react";

// Mock conversation data
const mockContacts = [
    {
        id: "f1",
        username: "sol_queen",
        displayName: "Maria Gonzalez",
        isOnline: true,
        lastActive: "Now",
        streak: 45,
        level: 28,
    },
    {
        id: "f2",
        username: "chain_dev",
        displayName: "James Park",
        isOnline: true,
        lastActive: "5 min ago",
        streak: 32,
        level: 26,
    },
    {
        id: "f3",
        username: "rust_wizard",
        displayName: "Elena Petrova",
        isOnline: false,
        lastActive: "2 hours ago",
        streak: 28,
        level: 24,
    },
    {
        id: "f4",
        username: "defi_builder",
        displayName: "Raj Patel",
        isOnline: false,
        lastActive: "1 day ago",
        streak: 0,
        level: 23,
    },
    {
        id: "f5",
        username: "anchor_pro",
        displayName: "Lisa Wang",
        isOnline: false,
        lastActive: "3 days ago",
        streak: 0,
        level: 22,
    },
];

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isOwn: boolean;
}

// Mock messages per contact
const mockMessages: Record<string, Message[]> = {
    f1: [
        { id: "m1", senderId: "f1", text: "Hey! Have you started the Token Engineering course yet?", timestamp: new Date(Date.now() - 3600000 * 2), isOwn: false },
        { id: "m2", senderId: "me", text: "Yes! I'm on module 3. It's really in-depth.", timestamp: new Date(Date.now() - 3600000 * 1.5), isOwn: true },
        { id: "m3", senderId: "f1", text: "Nice! Let me know when you get to the AMM section, we can do it together 🚀", timestamp: new Date(Date.now() - 3600000), isOwn: false },
    ],
    f2: [
        { id: "m4", senderId: "f2", text: "Wanna play token tower later today?", timestamp: new Date(Date.now() - 86400000), isOwn: false },
        { id: "m5", senderId: "me", text: "Sure! Let me finish this lesson first.", timestamp: new Date(Date.now() - 86400000 + 60000), isOwn: true },
    ],
    f3: [
        { id: "m6", senderId: "me", text: "How's the security course going?", timestamp: new Date(Date.now() - 172800000), isOwn: true },
        { id: "m7", senderId: "f3", text: "Really challenging but learning a lot! The audit exercises are great.", timestamp: new Date(Date.now() - 172000000), isOwn: false },
    ],
    f4: [],
    f5: [],
};

function formatTime(date: Date) {
    return date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatMessageDate(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayMs = 86400000;

    if (diff < dayMs && now.getDate() === date.getDate()) return "Today";
    if (diff < dayMs * 2) return "Yesterday";
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function MessengerPage() {
    const t = useTranslations("Messenger");
    const searchParams = useSearchParams();
    const initialUserId = searchParams.get("userId");

    const [activeContactId, setActiveContactId] = useState<string | null>(initialUserId);
    const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
    const [inputValue, setInputValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSidebar, setShowSidebar] = useState(!initialUserId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeContact = mockContacts.find((c) => c.id === activeContactId);
    const activeMessages = activeContactId ? (messages[activeContactId] || []) : [];

    const filteredContacts = mockContacts.filter(
        (c) =>
            c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeMessages.length]);

    const handleSend = () => {
        if (!inputValue.trim() || !activeContactId) return;

        const newMessage: Message = {
            id: `m-${Date.now()}`,
            senderId: "me",
            text: inputValue.trim(),
            timestamp: new Date(),
            isOwn: true,
        };

        setMessages((prev) => ({
            ...prev,
            [activeContactId]: [...(prev[activeContactId] || []), newMessage],
        }));
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectContact = (id: string) => {
        setActiveContactId(id);
        setShowSidebar(false);
    };

    // Last message preview for sidebar
    const getLastMessage = (contactId: string) => {
        const msgs = messages[contactId] || [];
        return msgs.length > 0 ? msgs[msgs.length - 1] : null;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-16">
                <div className="h-[calc(100vh-64px)] flex">
                    {/* === SIDEBAR === */}
                    <div
                        className={`${showSidebar ? "flex" : "hidden md:flex"
                            } w-full md:w-80 lg:w-96 flex-col border-r border-border/60 bg-card/50 shrink-0`}
                    >
                        {/* Sidebar header */}
                        <div className="p-4 border-b border-border/60">
                            <h2 className="font-display text-lg font-bold flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-solana-purple" />
                                {t("title")}
                            </h2>
                            <div className="mt-3 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8 pl-8 text-sm"
                                />
                            </div>
                        </div>

                        {/* Contact list */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredContacts.map((contact) => {
                                const lastMsg = getLastMessage(contact.id);
                                const isActive = contact.id === activeContactId;

                                return (
                                    <button
                                        key={contact.id}
                                        onClick={() => selectContact(contact.id)}
                                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50 ${isActive ? "bg-accent/70 border-l-2 border-solana-purple" : ""
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple/15 to-solana-green/15 text-sm font-bold text-solana-purple">
                                                {contact.displayName[0]}
                                            </div>
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${contact.isOnline ? "bg-emerald-500" : "bg-muted-foreground/30"
                                                    }`}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold truncate">{contact.displayName}</h3>
                                                {lastMsg && (
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {formatTime(lastMsg.timestamp)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {lastMsg
                                                    ? `${lastMsg.isOwn ? "You: " : ""}${lastMsg.text}`
                                                    : `@${contact.username}`}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* === CHAT AREA === */}
                    <div
                        className={`${showSidebar ? "hidden md:flex" : "flex"
                            } flex-1 flex-col bg-background`}
                    >
                        {activeContact ? (
                            <>
                                {/* Chat header */}
                                <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-card/50">
                                    {/* Back button (mobile) */}
                                    <button
                                        onClick={() => setShowSidebar(true)}
                                        className="md:hidden shrink-0 p-1 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>

                                    <div className="relative">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple/15 to-solana-green/15 text-sm font-bold text-solana-purple">
                                            {activeContact.displayName[0]}
                                        </div>
                                        <span
                                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${activeContact.isOnline ? "bg-emerald-500" : "bg-muted-foreground/30"
                                                }`}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold truncate">{activeContact.displayName}</h3>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <span className={activeContact.isOnline ? "text-emerald-500 font-medium" : ""}>
                                                {activeContact.isOnline ? t("online") : t("lastSeen", { time: activeContact.lastActive })}
                                            </span>
                                            {activeContact.streak > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    <Flame className="h-3 w-3 text-orange-500" />
                                                    {activeContact.streak}d
                                                </span>
                                            )}
                                            <span className="flex items-center gap-0.5">
                                                Lv.{activeContact.level}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                                    {activeMessages.length === 0 && (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-muted-foreground">
                                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm">No messages yet. Say hi! 👋</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeMessages.map((msg, idx) => {
                                        const showDate =
                                            idx === 0 ||
                                            formatMessageDate(msg.timestamp) !== formatMessageDate(activeMessages[idx - 1].timestamp);

                                        return (
                                            <div key={msg.id}>
                                                {showDate && (
                                                    <div className="flex items-center justify-center my-4">
                                                        <span className="text-[10px] text-muted-foreground bg-accent/50 px-3 py-0.5 rounded-full">
                                                            {formatMessageDate(msg.timestamp)}
                                                        </span>
                                                    </div>
                                                )}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} mb-1`}
                                                >
                                                    <div
                                                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.isOwn
                                                                ? "bg-gradient-to-r from-solana-purple to-solana-green text-white rounded-br-md"
                                                                : "bg-accent/70 rounded-bl-md"
                                                            }`}
                                                    >
                                                        <p>{msg.text}</p>
                                                        <p
                                                            className={`text-[10px] mt-1 ${msg.isOwn ? "text-white/60" : "text-muted-foreground"
                                                                }`}
                                                        >
                                                            {formatTime(msg.timestamp)}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input area */}
                                <div className="p-4 border-t border-border/60 bg-card/50">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={t("placeholder")}
                                            className="flex-1 h-10"
                                        />
                                        <Button
                                            onClick={handleSend}
                                            disabled={!inputValue.trim()}
                                            className="h-10 w-10 rounded-full p-0 bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110 shrink-0"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty state */
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-15" />
                                    <p className="font-medium">{t("emptyState")}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
