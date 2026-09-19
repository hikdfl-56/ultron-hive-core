"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface UseUltronChatOptions {
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function useUltronChat({
  onSpeakingChange,
  onProcessingChange,
}: UseUltronChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "ULTRON CORE ONLINE. System telemetry operational. State your query.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    onProcessingChange?.(isLoading);
  }, [isLoading, onProcessingChange]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        onSpeakingChange?.(false);
      }
    };
  }, [onSpeakingChange]);

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.7;
      utterance.rate = 0.9;

      utterance.onstart = () => {
        onSpeakingChange?.(true);
      };

      utterance.onend = () => {
        onSpeakingChange?.(false);
      };

      utterance.onerror = (err) => {
        console.warn("Speech synthesis error:", err);
        onSpeakingChange?.(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [onSpeakingChange]
  );

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const replyContent =
        data.response ||
        data.message ||
        "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyContent },
      ]);
      speakText(replyContent);
    } catch (err) {
      console.warn("API request failed or endpoint unavailable:", err);
      const fallbackContent =
        "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackContent,
        },
      ]);
      speakText(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSend,
    messagesEndRef,
    scrollToBottom,
  };
}
