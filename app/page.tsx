import JarvisOrb from "@/components/JarvisOrb";
import HudChatOverlay from "@/components/HudChatOverlay";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black pointer-events-none">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <JarvisOrb />
      </div>

      <div className="fixed top-6 left-6 z-50 pointer-events-auto mt-10">
        <HudChatOverlay />
      </div>
    </main>
  );
}
