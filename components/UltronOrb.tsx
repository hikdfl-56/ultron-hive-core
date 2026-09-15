"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createOrbScene, type OrbSceneApi } from "@/lib/orbScene";
import { HandTracker, type TrackerStatus } from "@/lib/handTracker";
import gsap from "gsap";

export interface UltronOrbProps {
  isSpeaking?: boolean;
  isProcessing?: boolean;
}

type CameraState = "off" | "starting" | "on" | "error";

const MODE_LABEL: Record<TrackerStatus["mode"], string> = {
  idle: "STANDBY",
  spin: "SPIN",
  zoom: "ZOOM",
};

export default function UltronOrb({
  isSpeaking = false,
  isProcessing = false,
}: UltronOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);

  const [camera, setCamera] = useState<CameraState>("off");
  const [status, setStatus] = useState<TrackerStatus>({ hands: 0, mode: "idle" });
  const [error, setError] = useState<string | null>(null);

  const scaleTweenRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const glowTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = createOrbScene(container);
    sceneRef.current = scene;
    return () => {
      scaleTweenRef.current?.kill();
      colorTweenRef.current?.kill();
      glowTweenRef.current?.kill();
      trackerRef.current?.stop();
      trackerRef.current = null;
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setSpeaking(isSpeaking);
  }, [isSpeaking]);

  useEffect(() => {
    sceneRef.current?.setProcessing(isProcessing);
  }, [isProcessing]);

  // GSAP Visual State Animations
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const orbGroup = scene.getOrbGroup();

    // Kill active tweens before transitioning state
    scaleTweenRef.current?.kill();
    colorTweenRef.current?.kill();
    glowTweenRef.current?.kill();

    if (isProcessing) {
      // 1. PROCESSING STATE (isProcessing === true)
      // Breathing Speed: 3.0s expansion & 3.0s contraction (yoyo: true, repeat: -1, ease: "power1.inOut")
      scaleTweenRef.current = gsap.to(orbGroup.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 3.0,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Color Transition: Smoothly shift material color to rich crimson red (#D62828) over 1.5s
      colorTweenRef.current = scene.animateColor("#D62828", 1.5);
      glowTweenRef.current = scene.animateGlowBrightness(1.5, 1.5);
    } else if (isSpeaking) {
      // 2. SPEAKING STATE (isSpeaking === true)
      // Return scale smoothly back to 1.0 over 0.5s
      scaleTweenRef.current = gsap.to(orbGroup.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.5,
        ease: "power1.out",
      });

      // Pulsing Speed & Intensity Control:
      // Peak brightness (2.5) with smoothed ~0.4s pulse steps (yoyo: true, repeat: -1)
      glowTweenRef.current = gsap.to(scene.getGlowIntensity(), {
        value: 2.5,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Return Color: Transition color smoothly back to default orange (#FF7F11) over 1.0s
      colorTweenRef.current = scene.animateColor("#FF7F11", 1.0);
    } else {
      // 3. IDLE STATE (isProcessing === false, isSpeaking === false)
      // Return scale back to 1.0 over 1.0 second
      scaleTweenRef.current = gsap.to(orbGroup.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 1.0,
        ease: "power1.out",
      });

      // Return material color back to standard default orange (#FF7F11) over 1.0 second
      colorTweenRef.current = scene.animateColor("#FF7F11", 1.0);

      // Return glow brightness back to 1.0 over 1.0 second
      glowTweenRef.current = scene.animateGlowBrightness(1.0, 1.0);
    }
  }, [isProcessing, isSpeaking]);

  const stopGestures = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    setCamera("off");
    setStatus({ hands: 0, mode: "idle" });
  }, []);

  const startGestures = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || trackerRef.current) return;

    setCamera("starting");
    setError(null);

    const tracker = new HandTracker(video, overlay, {
      onRotate: (dt, dp) => sceneRef.current?.rotateBy(dt, dp),
      onZoom: (factor) => sceneRef.current?.zoomBy(factor),
      onStatus: setStatus,
    });
    trackerRef.current = tracker;

    try {
      await tracker.start();
      setCamera("on");
    } catch (err) {
      trackerRef.current = null;
      tracker.stop();
      setCamera("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "CAMERA ACCESS DENIED"
          : "TRACKING INIT FAILED",
      );
    }
  }, []);

  const toggleGestures = useCallback(() => {
    if (trackerRef.current) stopGestures();
    else void startGestures();
  }, [startGestures, stopGestures]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "+":
        case "=":
          sceneRef.current?.zoomIn();
          break;
        case "-":
        case "_":
          sceneRef.current?.zoomOut();
          break;
        case "r":
        case "R":
          sceneRef.current?.resetView();
          break;
        case "g":
        case "G":
          toggleGestures();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleGestures]);

  const cameraOn = camera === "on";

  return (
    <>
      <div ref={containerRef} className="orb-root" />

      <div className="overlay-vignette" />
      <div className="overlay-grain" />
      <div className="overlay-scanlines" />

      <div className="hud hud-title">U.L.T.R.O.N.</div>

      <div className="hud hud-hint">
        <div>
          <span className="key">DRAG</span> spin&nbsp;&nbsp;
          <span className="key">SCROLL</span> zoom
        </div>
        {cameraOn ? (
          <div>
            <span className="key">PINCH + MOVE</span> spin&nbsp;&nbsp;
            <span className="key">PINCH BOTH HANDS ± SPREAD</span> zoom
          </div>
        ) : (
          <div>
            <span className="key">G</span> hand gestures&nbsp;&nbsp;
            <span className="key">R</span> reset&nbsp;&nbsp;
            <span className="key">+/−</span> zoom
          </div>
        )}
      </div>

      <div className="hud hud-controls">
        <div className={`camera-panel${cameraOn ? " visible" : ""}`}>
          <video ref={videoRef} muted playsInline className="camera-video" />
          <canvas ref={overlayRef} width={208} height={156} className="camera-overlay" />
          <div className="camera-status">
            {status.hands > 0
              ? `${status.hands} HAND${status.hands > 1 ? "S" : ""} · ${MODE_LABEL[status.mode]}`
              : "SHOW HANDS"}
          </div>
        </div>

        {error && <div className="hud-error">{error}</div>}

        <div className="hud-row">
          <button
            type="button"
            className="hud-btn"
            aria-pressed={cameraOn}
            onClick={toggleGestures}
            disabled={camera === "starting"}
          >
            {camera === "starting" ? "INITIALIZING…" : cameraOn ? "GESTURES ON" : "GESTURES OFF"}
          </button>
        </div>
        <div className="hud-row">
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.zoomIn()} aria-label="Zoom in">
            +
          </button>
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.zoomOut()} aria-label="Zoom out">
            −
          </button>
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.resetView()}>
            RESET
          </button>
        </div>
      </div>
    </>
  );
}
