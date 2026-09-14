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
    <div
      className="hud-chat-panel border border-amber-500/60 bg-black/90 backdrop-blur-xl font-mono w-80 sm:w-96 rounded-md shadow-[0_0_20px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col transition-all duration-300"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        borderColor: "rgba(245, 158, 11, 0.6)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 25px rgba(245, 158, 11, 0.25), inset 0 0 15px rgba(245, 158, 11, 0.05)",
      }}
    >
      {/* Header Bar */}
      <div
        className="hud-chat-header flex items-center justify-between px-3.5 py-2.5 border-b border-amber-500/40 bg-amber-950/40 select-none"
        style={{
          borderBottomColor: "rgba(245, 158, 11, 0.4)",
          backgroundColor: "rgba(69, 26, 3, 0.4)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"
            style={{
              backgroundColor: "#f59e0b",
              boxShadow: "0 0 10px #f59e0b, 0 0 4px #fbbf24",
            }}
          />
          <span
            className="text-xs font-bold tracking-widest text-amber-400 font-mono uppercase"
            style={{
              color: "#fbbf24",
              textShadow: "0 0 8px rgba(245, 158, 11, 0.8)",
            }}
          >
            ULTRON AI HUD
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-xs text-amber-400 hover:text-amber-200 font-bold px-2 py-0.5 border border-amber-500/50 rounded bg-amber-950/60 hover:bg-amber-900/80 transition-colors"
          style={{
            color: "#fbbf24",
            borderColor: "rgba(245, 158, 11, 0.5)",
            backgroundColor: "rgba(69, 26, 3, 0.6)",
          }}
          aria-label={isMinimized ? "Expand HUD Chat" : "Minimize HUD Chat"}
        >
          {isMinimized ? "[+]" : "[−]"}
        </button>
      </div>

      {/* Main Body (Collapsed vs Expanded) */}
      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div
            className="hud-chat-messages flex-1 max-h-64 sm:max-h-72 overflow-y-auto p-3.5 space-y-3 text-xs bg-black/40"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span
                  className="text-[10px] tracking-wider font-bold mb-1"
                  style={{
                    color: msg.role === "user" ? "#38bdf8" : "#fbbf24",
                    textShadow: msg.role === "user" ? "0 0 6px rgba(56, 189, 248, 0.5)" : "0 0 6px rgba(245, 158, 11, 0.5)",
                  }}
                >
                  {msg.role === "user" ? "> USER" : "[ULTRON CORE]"}
                </span>
                <div
                  className={`p-2.5 rounded border max-w-[90%] whitespace-pre-wrap leading-relaxed font-mono ${
                    msg.role === "user"
                      ? "text-white bg-zinc-900/90 border-zinc-700"
                      : "text-amber-200 bg-amber-950/60 border-amber-500/40"
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          color: "#ffffff",
                          backgroundColor: "rgba(24, 24, 27, 0.95)",
                          borderColor: "rgba(63, 63, 70, 0.9)",
                          boxShadow: "0 0 10px rgba(0, 0, 0, 0.6)",
                        }
                      : {
                          color: "#fef08a",
                          backgroundColor: "rgba(69, 26, 3, 0.65)",
                          borderColor: "rgba(245, 158, 11, 0.45)",
                          boxShadow: "inset 0 0 10px rgba(245, 158, 11, 0.1), 0 0 8px rgba(0, 0, 0, 0.5)",
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                <span
                  className="text-[10px] tracking-wider font-bold mb-1"
                  style={{ color: "#fbbf24" }}
                >
                  [ULTRON CORE]
                </span>
                <div
                  className="p-2.5 rounded border text-amber-300 bg-amber-950/60 border-amber-500/40 animate-pulse text-xs tracking-wider font-mono font-bold"
                  style={{
                    color: "#fde047",
                    backgroundColor: "rgba(69, 26, 3, 0.65)",
                    borderColor: "rgba(245, 158, 11, 0.45)",
                  }}
                >
                  ANALYZING INPUT...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Glowing Input Bar & Send Button */}
          <form
            onSubmit={handleSend}
            className="hud-chat-input-row flex items-center p-2.5 border-t border-amber-500/40 bg-black/90 gap-2"
            style={{
              borderTopColor: "rgba(245, 158, 11, 0.4)",
              backgroundColor: "rgba(0, 0, 0, 0.95)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter directive..."
              disabled={isLoading}
              className="hud-chat-input flex-1 bg-black/95 text-amber-100 placeholder-amber-600/70 border border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded px-3 py-2 text-xs font-mono"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                color: "#fef3c7",
                borderColor: "rgba(245, 158, 11, 0.5)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="hud-chat-send-btn px-4 py-2 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 tracking-wider"
              style={{
                backgroundColor: isLoading || !input.trim() ? "rgba(245, 158, 11, 0.4)" : "#f59e0b",
                color: "#000000",
                boxShadow: isLoading || !input.trim() ? "none" : "0 0 12px rgba(245, 158, 11, 0.5)",
              }}
            >
              SEND
            </button>
          </form>
        </>
      )}
    </div>
  );
}
