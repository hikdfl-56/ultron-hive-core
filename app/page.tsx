"use client";

import { useState } from "react";
import UltronOrb from "@/components/UltronOrb";
import HudChatOverlay from "@/components/HudChatOverlay";

export default function Home() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [themeColor, setThemeColor] = useState<"orange" | "red">("orange");

  const toggleThemeColor = () => {
    setThemeColor((prev) => (prev === "orange" ? "red" : "orange"));
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black pointer-events-none">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <UltronOrb
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          themeColor={themeColor}
        />
      </div>

      <div className="fixed top-6 left-6 z-50 pointer-events-auto mt-10">
        <HudChatOverlay
          onSpeakingChange={setIsSpeaking}
          onProcessingChange={setIsProcessing}
          themeColor={themeColor}
          onToggleThemeColor={toggleThemeColor}
        />
      </div>
    </main>
  );
}
