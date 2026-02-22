"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp: number;
}

const IMAGE_URL_RE =
  /https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^\s"'<>]*)?/gi;
const MARKDOWN_IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

function extractImages(text: string): { cleanText: string; images: string[] } {
  const images: string[] = [];

  // Extract markdown images
  let cleaned = text.replace(MARKDOWN_IMG_RE, (_m, _alt, url) => {
    if (!images.includes(url)) images.push(url);
    return "";
  });

  // Extract bare image URLs not already captured
  const bareMatches = cleaned.match(IMAGE_URL_RE);
  if (bareMatches) {
    for (const url of bareMatches) {
      if (!images.includes(url)) {
        images.push(url);
        cleaned = cleaned.replace(url, "");
      }
    }
  }

  // Clean up leftover blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return { cleanText: cleaned, images };
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId: sessionRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      sessionRef.current = data.sessionId;

      const raw =
        typeof data.response === "string"
          ? data.response
          : JSON.stringify(data.response);
      const { cleanText, images } = extractImages(raw);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanText,
        images: images.length > 0 ? images : undefined,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionRef.current = null;
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
