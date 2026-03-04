import { useState, useCallback } from "react";
import type { ChatMessage } from "./lesson-ai-mentor";

interface FailedMessage {
  message: string;
  code: string;
}

export function useAiChat(
  lessonTitle: string,
  currentLocale: string,
  t: (key: string) => string
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<FailedMessage | null>(null);

  const sendChatMessage = useCallback(async (message: string, code: string) => {
    if (!message.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsAiLoading(true);
    setLastFailedMessage(null);
    
    try {
      let prompt = message;
      
      if (message.startsWith('/hint')) {
        prompt = `Give a hint for this coding challenge. Don't give the full answer. Focus on the specific issue. Lesson: ${lessonTitle}. Code:\n\n${code}`;
      } else if (message.startsWith('/fix')) {
        prompt = `Fix the errors in this code and explain the issues:\n\n${code}`;
      } else if (message.startsWith('/explain')) {
        prompt = `Explain this code:\n\n${code}`;
      } else {
        prompt = `Question about lesson "${lessonTitle}":\n\nCode:\n${code}\n\nQuestion: ${message}`;
      }
      
      const res = await fetch("/api/ai-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, error: prompt, locale: currentLocale }),
      });
      const data = await res.json();
      
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: data.explanation || t("aiFailed"),
        isError: data.error || false
      };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      if (data.error) {
        setLastFailedMessage({ message, code });
      }
    } catch {
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: t("aiFailed"),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setLastFailedMessage({ message, code });
    } finally {
      setIsAiLoading(false);
    }
  }, [lessonTitle, currentLocale, t]);

  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage) return;
    await sendChatMessage(lastFailedMessage.message, lastFailedMessage.code);
  }, [lastFailedMessage, sendChatMessage]);

  const handleChatSubmit = useCallback((e: React.FormEvent, code: string = "") => {
    e.preventDefault();
    sendChatMessage(chatInput, code);
  }, [chatInput, sendChatMessage]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setChatInput("");
    setLastFailedMessage(null);
  }, []);

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    sendChatMessage,
    retryLastMessage,
    handleChatSubmit,
    clearChat,
  };
}
