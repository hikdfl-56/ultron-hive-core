"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HudChatOverlay() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "ULTRON CORE ONLINE. System telemetry operational. State your query.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      console.warn("API request failed or endpoint unavailable:", err);
      // Fallback mock response so UI never breaks
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hud-chat-panel border-amber-500/40 bg-black/80 backdrop-blur-md font-mono text-amber-400 w-80 sm:w-96 rounded-md border shadow-lg overflow-hidden flex flex-col transition-all duration-300">
      {/* Header Bar */}
      <div className="hud-chat-header flex items-center justify-between px-3 py-2 border-b border-amber-500/30 bg-amber-950/20 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#ffaa30]" />
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase drop-shadow-[0_0_6px_rgba(255,170,48,0.6)]">
            ULTRON AI HUD
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-xs text-amber-400 hover:text-amber-200 px-1.5 py-0.5 border border-amber-500/40 rounded bg-amber-950/30 hover:bg-amber-900/40 transition-colors"
          aria-label={isMinimized ? "Expand HUD Chat" : "Minimize HUD Chat"}
        >
          {isMinimized ? "[+]" : "[−]"}
        </button>
      </div>

      {/* Main Body (Collapsed vs Expanded) */}
      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className="hud-chat-messages flex-1 max-h-64 sm:max-h-72 overflow-y-auto p-3 space-y-2.5 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-[10px] tracking-wider opacity-60 mb-0.5 text-amber-400/80">
                  {msg.role === "user" ? "> USER" : "[ULTRON CORE]"}
                </span>
                <div
                  className={`p-2 rounded border max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                      : "bg-black/60 border-amber-500/30 text-amber-400 shadow-[inset_0_0_8px_rgba(255,170,48,0.1)]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] tracking-wider opacity-60 mb-0.5 text-amber-400/80">
                  [ULTRON CORE]
                </span>
                <div className="p-2 rounded border border-amber-500/30 bg-black/60 text-amber-400/90 animate-pulse text-xs tracking-wider">
                  ANALYZING INPUT...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Glowing Input Bar & Send Button */}
          <form
            onSubmit={handleSend}
            className="hud-chat-input-row flex items-center p-2 border-t border-amber-500/30 bg-amber-950/10 gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter directive..."
              disabled={isLoading}
              className="hud-chat-input flex-1 bg-black/60 border border-amber-500/40 rounded px-2.5 py-1.5 text-xs text-amber-300 placeholder-amber-600/70 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 shadow-[inset_0_0_6px_rgba(255,170,48,0.15)] font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="hud-chat-send-btn px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/50 rounded hover:bg-amber-900/60 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_0_10px_rgba(255,170,48,0.2)]"
            >
              SEND
            </button>
          </form>
        </>
      )}
    </div>
  );
}
