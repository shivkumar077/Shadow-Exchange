import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import {
  getSutoContent,
  getSutoStatus,
  initiateSutoGoogleSignIn,
  type SutoContent,
} from "../api";
import { navigateTo } from "../router";
import "../suto.css";

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

interface ButterflyParticle {
  id: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  scale: number;
  initRot: number;
  targetRot: number;
  duration: number;
  delay: number;
  flutter: number;
  color: string;
  wingColor: string;
}

const BUTTERFLY_PARTICLES: ButterflyParticle[] = [
  // Left side of "Hello Baby"
  { id: 1, startX: 18, startY: 42, dx: -220, dy: -420, scale: 1.1, initRot: -12, targetRot: -35, duration: 2.4, delay: 0.12, flutter: 0.16, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 2, startX: 24, startY: 52, dx: -310, dy: -520, scale: 0.95, initRot: -20, targetRot: -48, duration: 2.7, delay: 0.22, flutter: 0.14, color: "#F5A623", wingColor: "#FFFECB" },
  { id: 3, startX: 15, startY: 35, dx: -160, dy: -380, scale: 0.85, initRot: -5, targetRot: -22, duration: 2.3, delay: 0.08, flutter: 0.18, color: "#D97706", wingColor: "#FCD3DE" },
  { id: 4, startX: 28, startY: 46, dx: -260, dy: -480, scale: 1.25, initRot: -15, targetRot: -40, duration: 2.8, delay: 0.35, flutter: 0.15, color: "#F5B81C", wingColor: "#FFFDF0" },
  { id: 5, startX: 21, startY: 58, dx: -380, dy: -590, scale: 1.05, initRot: -28, targetRot: -55, duration: 3.0, delay: 0.45, flutter: 0.13, color: "#E68A0D", wingColor: "#FFFECB" },
  { id: 6, startX: 12, startY: 48, dx: -190, dy: -440, scale: 0.8, initRot: -8, targetRot: -28, duration: 2.2, delay: 0.18, flutter: 0.19, color: "#F5B81C", wingColor: "#FAD2E1" },

  // Center-left "Hello"
  { id: 7, startX: 34, startY: 40, dx: -120, dy: -490, scale: 1.15, initRot: -8, targetRot: -24, duration: 2.5, delay: 0.15, flutter: 0.15, color: "#F5A623", wingColor: "#FFFECB" },
  { id: 8, startX: 38, startY: 55, dx: -80, dy: -540, scale: 1.0, initRot: -4, targetRot: -16, duration: 2.6, delay: 0.28, flutter: 0.17, color: "#F5B81C", wingColor: "#FFFDF0" },
  { id: 9, startX: 42, startY: 36, dx: -40, dy: -610, scale: 1.3, initRot: 2, targetRot: -10, duration: 2.9, delay: 0.38, flutter: 0.14, color: "#C97F0A", wingColor: "#FFFECB" },
  { id: 10, startX: 36, startY: 62, dx: -140, dy: -450, scale: 0.9, initRot: -10, targetRot: -30, duration: 2.4, delay: 0.42, flutter: 0.18, color: "#F5B81C", wingColor: "#FCD3DE" },

  // Center "Baby"
  { id: 11, startX: 48, startY: 45, dx: 15, dy: -640, scale: 1.2, initRot: 0, targetRot: 12, duration: 2.8, delay: 0.1, flutter: 0.15, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 12, startX: 52, startY: 58, dx: 45, dy: -580, scale: 1.05, initRot: 6, targetRot: 18, duration: 2.6, delay: 0.25, flutter: 0.16, color: "#E68A0D", wingColor: "#FFFDF0" },
  { id: 13, startX: 46, startY: 32, dx: -20, dy: -520, scale: 0.85, initRot: -2, targetRot: -8, duration: 2.3, delay: 0.18, flutter: 0.2, color: "#F5A623", wingColor: "#FFFECB" },
  { id: 14, startX: 54, startY: 65, dx: 80, dy: -600, scale: 1.1, initRot: 10, targetRot: 25, duration: 2.7, delay: 0.32, flutter: 0.14, color: "#D97706", wingColor: "#FAD2E1" },

  // Center-right
  { id: 15, startX: 60, startY: 38, dx: 110, dy: -510, scale: 1.15, initRot: 8, targetRot: 26, duration: 2.5, delay: 0.14, flutter: 0.16, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 16, startX: 64, startY: 54, dx: 170, dy: -560, scale: 0.95, initRot: 14, targetRot: 32, duration: 2.7, delay: 0.24, flutter: 0.17, color: "#F5A623", wingColor: "#FFFDF0" },
  { id: 17, startX: 58, startY: 64, dx: 140, dy: -460, scale: 1.25, initRot: 12, targetRot: 28, duration: 2.9, delay: 0.4, flutter: 0.13, color: "#C97F0A", wingColor: "#FFFECB" },
  { id: 18, startX: 66, startY: 44, dx: 210, dy: -490, scale: 0.9, initRot: 18, targetRot: 38, duration: 2.4, delay: 0.3, flutter: 0.18, color: "#F5B81C", wingColor: "#FCD3DE" },

  // Right side "Baby"
  { id: 19, startX: 72, startY: 42, dx: 240, dy: -430, scale: 1.2, initRot: 16, targetRot: 42, duration: 2.6, delay: 0.16, flutter: 0.15, color: "#E68A0D", wingColor: "#FFFECB" },
  { id: 20, startX: 78, startY: 56, dx: 330, dy: -530, scale: 1.0, initRot: 22, targetRot: 50, duration: 2.8, delay: 0.26, flutter: 0.16, color: "#F5B81C", wingColor: "#FFFDF0" },
  { id: 21, startX: 84, startY: 36, dx: 280, dy: -390, scale: 0.85, initRot: 20, targetRot: 44, duration: 2.2, delay: 0.12, flutter: 0.19, color: "#F5A623", wingColor: "#FFFECB" },
  { id: 22, startX: 75, startY: 62, dx: 360, dy: -570, scale: 1.3, initRot: 25, targetRot: 54, duration: 3.1, delay: 0.44, flutter: 0.14, color: "#D97706", wingColor: "#FAD2E1" },
  { id: 23, startX: 88, startY: 48, dx: 390, dy: -470, scale: 0.95, initRot: 28, targetRot: 58, duration: 2.5, delay: 0.36, flutter: 0.17, color: "#F5B81C", wingColor: "#FFFECB" },

  // High-fliers and sky stragglers
  { id: 24, startX: 20, startY: 40, dx: -280, dy: -660, scale: 0.8, initRot: -18, targetRot: -45, duration: 3.2, delay: 0.5, flutter: 0.15, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 25, startX: 32, startY: 60, dx: -190, dy: -630, scale: 1.05, initRot: -12, targetRot: -36, duration: 3.0, delay: 0.56, flutter: 0.14, color: "#E68A0D", wingColor: "#FFFDF0" },
  { id: 26, startX: 50, startY: 38, dx: 30, dy: -700, scale: 0.9, initRot: 2, targetRot: 15, duration: 3.3, delay: 0.6, flutter: 0.16, color: "#F5A623", wingColor: "#FFFECB" },
  { id: 27, startX: 68, startY: 60, dx: 270, dy: -640, scale: 1.1, initRot: 18, targetRot: 46, duration: 3.1, delay: 0.54, flutter: 0.13, color: "#F5B81C", wingColor: "#FCD3DE" },
  { id: 28, startX: 80, startY: 44, dx: 370, dy: -650, scale: 0.85, initRot: 24, targetRot: 52, duration: 3.2, delay: 0.62, flutter: 0.18, color: "#C97F0A", wingColor: "#FFFECB" },
];

function ButterflySvg({ color, wingColor }: { color: string; wingColor: string }) {
  return (
    <svg
      viewBox="0 0 32 28"
      className="suto-butterfly-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left upper wing */}
      <path d="M16 13 C12 6 3 2 1 7 C-1 12 5 19 16 15 Z" fill={wingColor} />
      {/* Left lower wing */}
      <path d="M16 14 C12 17 6 21 4 24 C3 26 9 27 16 17 Z" fill={color} opacity={0.9} />
      {/* Right upper wing */}
      <path d="M16 13 C20 6 29 2 31 7 C33 12 27 19 16 15 Z" fill={wingColor} />
      {/* Right lower wing */}
      <path d="M16 14 C20 17 26 21 28 24 C29 26 23 27 16 17 Z" fill={color} opacity={0.9} />
      {/* Butterfly body */}
      <ellipse cx="16" cy="15" rx="1.2" ry="5.5" fill="#C97F0A" />
      {/* Antennae */}
      <path
        d="M15.5 10 C14.5 7 12 5.5 10 5 M16.5 10 C17.5 7 20 5.5 22 5"
        stroke="#C97F0A"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface TransitionPetalParticle {
  id: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  scale: number;
  initRot: number;
  targetRot: number;
  delay: number;
  swayAmp: number;
  color: string;
  strokeColor?: string;
}

const PETAL_TRANSITION_PARTICLES: TransitionPetalParticle[] = [
  // Upper-left cluster
  { id: 1, startX: 24, startY: 38, dx: -150, dy: 440, scale: 1.1, initRot: -15, targetRot: 140, delay: 0.05, swayAmp: 22, color: "#FFD1DC" },
  { id: 2, startX: 30, startY: 42, dx: -90, dy: 520, scale: 0.9, initRot: 10, targetRot: -120, delay: 0.12, swayAmp: 18, color: "#FDE8EF" },
  { id: 3, startX: 20, startY: 46, dx: -190, dy: 390, scale: 1.25, initRot: -25, targetRot: 160, delay: 0.08, swayAmp: 26, color: "#FFB6C1" },
  { id: 4, startX: 35, startY: 36, dx: -60, dy: 480, scale: 0.85, initRot: 5, targetRot: -140, delay: 0.18, swayAmp: 20, color: "#FFF0F5" },

  // Center-left cluster
  { id: 5, startX: 38, startY: 48, dx: -110, dy: 540, scale: 1.05, initRot: -8, targetRot: 180, delay: 0.14, swayAmp: 24, color: "#FFC0CB" },
  { id: 6, startX: 42, startY: 40, dx: -40, dy: 580, scale: 1.2, initRot: 18, targetRot: -90, delay: 0.22, swayAmp: 28, color: "#FAD2E1" },
  { id: 7, startX: 36, startY: 56, dx: -130, dy: 460, scale: 0.95, initRot: -12, targetRot: 130, delay: 0.10, swayAmp: 16, color: "#FDE8EF" },
  { id: 8, startX: 44, startY: 52, dx: -20, dy: 510, scale: 1.15, initRot: 22, targetRot: -160, delay: 0.26, swayAmp: 25, color: "#FFD1DC" },

  // Center cluster
  { id: 9, startX: 48, startY: 38, dx: 15, dy: 600, scale: 1.3, initRot: 0, targetRot: 190, delay: 0.06, swayAmp: 30, color: "#FFE4E1" },
  { id: 10, startX: 52, startY: 45, dx: -15, dy: 570, scale: 1.0, initRot: -10, targetRot: -150, delay: 0.16, swayAmp: 22, color: "#FFC0CB" },
  { id: 11, startX: 50, startY: 58, dx: 25, dy: 530, scale: 1.1, initRot: 15, targetRot: 170, delay: 0.28, swayAmp: 27, color: "#FDE8EF" },
  { id: 12, startX: 46, startY: 62, dx: -35, dy: 490, scale: 0.85, initRot: -18, targetRot: -110, delay: 0.20, swayAmp: 19, color: "#FFD1DC" },

  // Center-right cluster
  { id: 13, startX: 56, startY: 40, dx: 50, dy: 560, scale: 1.2, initRot: -5, targetRot: 140, delay: 0.15, swayAmp: 24, color: "#FFB6C1" },
  { id: 14, startX: 62, startY: 48, dx: 110, dy: 500, scale: 0.95, initRot: 20, targetRot: -130, delay: 0.24, swayAmp: 21, color: "#FAD2E1" },
  { id: 15, startX: 58, startY: 54, dx: 70, dy: 540, scale: 1.15, initRot: 12, targetRot: 160, delay: 0.12, swayAmp: 26, color: "#FDE8EF" },
  { id: 16, startX: 64, startY: 38, dx: 130, dy: 470, scale: 0.9, initRot: -15, targetRot: -100, delay: 0.30, swayAmp: 18, color: "#FFC0CB" },

  // Right side cluster
  { id: 17, startX: 68, startY: 44, dx: 160, dy: 510, scale: 1.25, initRot: 25, targetRot: 190, delay: 0.10, swayAmp: 29, color: "#FFD1DC" },
  { id: 18, startX: 74, startY: 52, dx: 210, dy: 440, scale: 1.0, initRot: -20, targetRot: -150, delay: 0.22, swayAmp: 23, color: "#FDE8EF" },
  { id: 19, startX: 72, startY: 36, dx: 180, dy: 460, scale: 0.85, initRot: 8, targetRot: 120, delay: 0.16, swayAmp: 17, color: "#FFE4E1" },
  { id: 20, startX: 78, startY: 48, dx: 240, dy: 410, scale: 1.1, initRot: -12, targetRot: -170, delay: 0.32, swayAmp: 25, color: "#FFC0CB" },

  // Gentle trailing floaters
  { id: 21, startX: 32, startY: 52, dx: -80, dy: 620, scale: 0.8, initRot: -5, targetRot: 160, delay: 0.36, swayAmp: 20, color: "#FFF0F5" },
  { id: 22, startX: 48, startY: 48, dx: 10, dy: 650, scale: 1.05, initRot: 14, targetRot: -140, delay: 0.40, swayAmp: 32, color: "#FFD1DC" },
  { id: 23, startX: 65, startY: 56, dx: 120, dy: 590, scale: 0.9, initRot: -16, targetRot: 150, delay: 0.38, swayAmp: 22, color: "#FDE8EF" },
  { id: 24, startX: 54, startY: 36, dx: 30, dy: 630, scale: 1.15, initRot: 18, targetRot: -180, delay: 0.42, swayAmp: 26, color: "#FFB6C1" },
];

const FINALE_BUTTERFLY_PARTICLES: ButterflyParticle[] = [
  // Left side upward flyers
  { id: 101, startX: 18, startY: 68, dx: -90, dy: -680, scale: 1.15, initRot: -10, targetRot: -28, duration: 2.5, delay: 0.08, flutter: 0.15, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 102, startX: 26, startY: 74, dx: -140, dy: -740, scale: 0.95, initRot: -18, targetRot: -38, duration: 2.8, delay: 0.20, flutter: 0.14, color: "#F5A623", wingColor: "#FFFDF0" },
  { id: 103, startX: 22, startY: 62, dx: -60, dy: -640, scale: 1.05, initRot: -6, targetRot: -22, duration: 2.4, delay: 0.14, flutter: 0.16, color: "#D97706", wingColor: "#FCD3DE" },
  { id: 104, startX: 32, startY: 80, dx: -180, dy: -800, scale: 1.25, initRot: -15, targetRot: -35, duration: 3.0, delay: 0.32, flutter: 0.13, color: "#F5B81C", wingColor: "#FFFECB" },

  // Center-left upward flyers
  { id: 105, startX: 38, startY: 66, dx: -40, dy: -710, scale: 1.1, initRot: -5, targetRot: -16, duration: 2.6, delay: 0.12, flutter: 0.16, color: "#E68A0D", wingColor: "#FFFECB" },
  { id: 106, startX: 44, startY: 76, dx: -20, dy: -770, scale: 0.9, initRot: 2, targetRot: -10, duration: 2.7, delay: 0.24, flutter: 0.17, color: "#F5B81C", wingColor: "#FFFDF0" },

  // Center upward sky drifters
  { id: 107, startX: 49, startY: 70, dx: 15, dy: -820, scale: 1.3, initRot: 0, targetRot: 12, duration: 2.9, delay: 0.06, flutter: 0.14, color: "#C97F0A", wingColor: "#FFFECB" },
  { id: 108, startX: 53, startY: 78, dx: 35, dy: -790, scale: 1.0, initRot: 6, targetRot: 18, duration: 2.8, delay: 0.26, flutter: 0.15, color: "#F5B81C", wingColor: "#FAD2E1" },

  // Center-right upward flyers
  { id: 109, startX: 58, startY: 65, dx: 60, dy: -730, scale: 1.15, initRot: 8, targetRot: 24, duration: 2.5, delay: 0.16, flutter: 0.16, color: "#F5A623", wingColor: "#FFFECB" },
  { id: 110, startX: 64, startY: 75, dx: 90, dy: -780, scale: 0.95, initRot: 14, targetRot: 30, duration: 2.7, delay: 0.28, flutter: 0.15, color: "#D97706", wingColor: "#FFFDF0" },

  // Right side upward flyers
  { id: 111, startX: 70, startY: 68, dx: 120, dy: -700, scale: 1.2, initRot: 16, targetRot: 36, duration: 2.6, delay: 0.10, flutter: 0.14, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 112, startX: 78, startY: 74, dx: 160, dy: -760, scale: 1.05, initRot: 20, targetRot: 42, duration: 2.9, delay: 0.22, flutter: 0.16, color: "#E68A0D", wingColor: "#FCD3DE" },
  { id: 113, startX: 84, startY: 64, dx: 140, dy: -660, scale: 0.85, initRot: 12, targetRot: 28, duration: 2.3, delay: 0.18, flutter: 0.18, color: "#F5A623", wingColor: "#FFFDF0" },
  { id: 114, startX: 74, startY: 82, dx: 190, dy: -820, scale: 1.25, initRot: 22, targetRot: 46, duration: 3.1, delay: 0.36, flutter: 0.13, color: "#F5B81C", wingColor: "#FFFECB" },

  // Outer ambient floaters
  { id: 115, startX: 14, startY: 72, dx: -120, dy: -720, scale: 0.85, initRot: -14, targetRot: -32, duration: 2.6, delay: 0.38, flutter: 0.17, color: "#F5B81C", wingColor: "#FFFECB" },
  { id: 116, startX: 86, startY: 70, dx: 170, dy: -710, scale: 0.9, initRot: 18, targetRot: 40, duration: 2.7, delay: 0.40, flutter: 0.16, color: "#C97F0A", wingColor: "#FFFECB" },
];

const FINALE_PETAL_PARTICLES: TransitionPetalParticle[] = [
  // Upper-left falling petals
  { id: 201, startX: 20, startY: 22, dx: -80, dy: 660, scale: 1.15, initRot: -12, targetRot: 150, delay: 0.06, swayAmp: 24, color: "#FFD1DC" },
  { id: 202, startX: 28, startY: 28, dx: -40, dy: 720, scale: 0.95, initRot: 15, targetRot: -130, delay: 0.16, swayAmp: 20, color: "#FDE8EF" },
  { id: 203, startX: 16, startY: 34, dx: -110, dy: 620, scale: 1.25, initRot: -22, targetRot: 170, delay: 0.10, swayAmp: 28, color: "#FFB6C1" },

  // Upper center-left
  { id: 204, startX: 36, startY: 20, dx: -30, dy: 740, scale: 1.05, initRot: 8, targetRot: -110, delay: 0.14, swayAmp: 22, color: "#FFF0F5" },
  { id: 205, startX: 42, startY: 30, dx: -10, dy: 700, scale: 1.2, initRot: -16, targetRot: 160, delay: 0.22, swayAmp: 26, color: "#FFC0CB" },

  // Center falling cascade
  { id: 206, startX: 48, startY: 18, dx: 15, dy: 780, scale: 1.3, initRot: 0, targetRot: 190, delay: 0.05, swayAmp: 30, color: "#FFE4E1" },
  { id: 207, startX: 52, startY: 26, dx: -15, dy: 750, scale: 1.0, initRot: -10, targetRot: -140, delay: 0.18, swayAmp: 24, color: "#FFD1DC" },
  { id: 208, startX: 46, startY: 36, dx: 20, dy: 680, scale: 1.1, initRot: 12, targetRot: 175, delay: 0.26, swayAmp: 27, color: "#FDE8EF" },

  // Upper center-right
  { id: 209, startX: 58, startY: 22, dx: 35, dy: 730, scale: 1.15, initRot: -8, targetRot: 145, delay: 0.12, swayAmp: 25, color: "#FFB6C1" },
  { id: 210, startX: 64, startY: 32, dx: 60, dy: 690, scale: 0.95, initRot: 18, targetRot: -125, delay: 0.24, swayAmp: 21, color: "#FAD2E1" },

  // Upper-right falling petals
  { id: 211, startX: 72, startY: 20, dx: 90, dy: 720, scale: 1.25, initRot: 22, targetRot: 180, delay: 0.08, swayAmp: 29, color: "#FFD1DC" },
  { id: 212, startX: 80, startY: 28, dx: 120, dy: 660, scale: 1.0, initRot: -18, targetRot: -150, delay: 0.20, swayAmp: 23, color: "#FDE8EF" },
  { id: 213, startX: 86, startY: 34, dx: 140, dy: 630, scale: 0.85, initRot: 10, targetRot: 130, delay: 0.15, swayAmp: 18, color: "#FFE4E1" },

  // Trailing soft cascade
  { id: 214, startX: 30, startY: 38, dx: -50, dy: 650, scale: 0.85, initRot: -6, targetRot: 155, delay: 0.32, swayAmp: 19, color: "#FFF0F5" },
  { id: 215, startX: 50, startY: 40, dx: 10, dy: 710, scale: 1.05, initRot: 14, targetRot: -145, delay: 0.35, swayAmp: 28, color: "#FFD1DC" },
  { id: 216, startX: 68, startY: 38, dx: 80, dy: 670, scale: 0.9, initRot: -14, targetRot: 140, delay: 0.34, swayAmp: 22, color: "#FDE8EF" },
  { id: 217, startX: 24, startY: 44, dx: -70, dy: 610, scale: 1.1, initRot: 16, targetRot: -160, delay: 0.38, swayAmp: 25, color: "#FFB6C1" },
  { id: 218, startX: 76, startY: 42, dx: 105, dy: 620, scale: 0.95, initRot: -20, targetRot: 165, delay: 0.36, swayAmp: 20, color: "#FFC0CB" },
];

function SakuraPetalSvg({ color, strokeColor }: { color: string; strokeColor?: string }) {
  return (
    <svg viewBox="0 0 24 28" className="suto-transition-petal-svg" fill="none">
      <path
        d="M12 2C8 6 3 12 3 18C3 23 7 26 12 26C17 26 21 23 21 18C21 12 16 6 12 2Z"
        fill={color}
        stroke={strokeColor || "rgba(229, 148, 173, 0.65)"}
        strokeWidth="0.8"
      />
      {/* Subtle inner delicate vein */}
      <path
        d="M12 6C12 12 12 20 12 24"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function computeButterflyStyle(
  b: ButterflyParticle,
  p: number,
  reducedMotion: boolean
): React.CSSProperties {
  if (reducedMotion) {
    return { display: "none" };
  }

  // Butterfly flight phase: starts around 0.05 - 0.13, ends around 0.28 - 0.38
  const startP = 0.05 + (b.delay / 0.65) * 0.08;
  const endP = Math.min(0.38, startP + 0.18 + (b.duration / 3.3) * 0.09);

  if (p <= startP) {
    return {
      left: `${b.startX}%`,
      top: `${b.startY}%`,
      opacity: 0,
      transform: `translate3d(0px, 0px, 0px) scale(${b.scale}) rotate(${b.initRot}deg)`,
      pointerEvents: "none",
      "--flutter-speed": `${b.flutter}s`,
    } as React.CSSProperties;
  }

  if (p >= endP) {
    return {
      left: `${b.startX}%`,
      top: `${b.startY}%`,
      opacity: 0,
      transform: `translate3d(${b.dx}px, ${b.dy}px, 0px) scale(${b.scale * 0.7}) rotate(${b.targetRot}deg)`,
      pointerEvents: "none",
      "--flutter-speed": `${b.flutter}s`,
    } as React.CSSProperties;
  }

  const t = (p - startP) / (endP - startP);
  const curX = b.dx * easeOutCubic(t);
  const curY = b.dy * easeOutQuad(t);
  const curRot = b.initRot + (b.targetRot - b.initRot) * easeOutQuad(t);
  const curScale = b.scale * (1 - 0.3 * easeOutQuad(t));

  let opacity = 1;
  if (t < 0.14) {
    opacity = t / 0.14;
  } else if (t > 0.75) {
    opacity = Math.max(0, 1 - (t - 0.75) / 0.25);
  }

  return {
    left: `${b.startX}%`,
    top: `${b.startY}%`,
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0px) scale(${curScale.toFixed(2)}) rotate(${curRot.toFixed(1)}deg)`,
    pointerEvents: "none",
    "--flutter-speed": `${b.flutter}s`,
  } as React.CSSProperties;
}

function computeHeadingStyle(p: number, reducedMotion: boolean): React.CSSProperties {
  if (reducedMotion) {
    const opacity = p < 0.25 ? 1 : Math.max(0, 1 - (p - 0.25) / 0.10);
    return {
      opacity,
      pointerEvents: opacity > 0.1 ? "auto" : "none",
    };
  }

  if (p <= 0.03) {
    return {
      opacity: 1,
      transform: "translate3d(0px, 0px, 0px) scale(1)",
      pointerEvents: "auto",
    };
  }

  if (p >= 0.32) {
    return {
      opacity: 0,
      transform: "translate3d(0px, -16px, 0px) scale(1.04)",
      filter: "blur(14px) brightness(1.8)",
      pointerEvents: "none",
    };
  }

  if (p <= 0.12) {
    const t = (p - 0.03) / 0.09;
    const glow = Math.round(t * 35);
    const bright = (1 + t * 0.35).toFixed(2);
    const lift = (-4 * t).toFixed(1);
    const sc = (1 + 0.015 * t).toFixed(3);
    return {
      opacity: 1,
      filter: `drop-shadow(0 0 ${glow}px rgba(245, 184, 28, 0.85)) brightness(${bright})`,
      transform: `translate3d(0px, ${lift}px, 0px) scale(${sc})`,
      pointerEvents: "auto",
    };
  }

  const t = (p - 0.12) / 0.20;
  const easeT = easeOutQuad(t);
  const opacity = Math.max(0, 1 - easeT);
  const blur = (easeT * 12).toFixed(1);
  const bright = (1.35 + (1 - easeT) * 0.25).toFixed(2);
  const lift = (-4 - easeT * 12).toFixed(1);
  const sc = (1.015 + easeT * 0.035).toFixed(3);

  return {
    opacity: Math.round(opacity * 1000) / 1000,
    filter: `drop-shadow(0 0 45px rgba(245, 184, 28, 0.9)) blur(${blur}px) brightness(${bright})`,
    transform: `translate3d(0px, ${lift}px, 0px) scale(${sc})`,
    pointerEvents: opacity > 0.05 ? "auto" : "none",
  };
}

function computeAccentsStyle(p: number, reducedMotion: boolean): React.CSSProperties {
  if (reducedMotion) {
    return { opacity: p < 0.20 ? 1 : 0 };
  }
  if (p <= 0.08) {
    return { opacity: 1, transform: "scale(1)" };
  }
  if (p >= 0.26) {
    return { opacity: 0, transform: "scale(0.3) rotate(45deg)" };
  }
  const t = (p - 0.08) / 0.18;
  const opacity = Math.max(0, 1 - t);
  const sc = (1 + Math.sin(t * Math.PI) * 0.25 - t * 0.5).toFixed(2);
  const rot = (t * 35).toFixed(0);
  return {
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `scale(${sc}) rotate(${rot}deg)`,
  };
}

export function computePartOneStyle(p: number, reducedMotion: boolean): React.CSSProperties {
  if (reducedMotion) {
    if (p < 0.16) {
      return { opacity: 0, pointerEvents: "none" };
    }
    if (p <= 0.44) {
      return { opacity: 1, pointerEvents: "auto" };
    }
    const fadeOut = Math.max(0, 1 - (p - 0.44) / 0.10);
    return {
      opacity: fadeOut,
      pointerEvents: fadeOut > 0.1 ? "auto" : "none",
    };
  }

  // Phase 1: Before entrance (p <= 0.16)
  if (p <= 0.16) {
    return {
      opacity: 0,
      transform: "translate3d(0px, 28px, 0px) scale(0.96)",
      pointerEvents: "none",
    };
  }

  // Phase 2: Entrance from butterflies (0.16 to 0.24)
  if (p < 0.24) {
    const t = (p - 0.16) / 0.08;
    const easeT = easeOutCubic(t);
    const opacity = easeOutQuad(t);
    const translateY = (28 * (1 - easeT)).toFixed(1);
    const scale = (0.96 + 0.04 * easeT).toFixed(3);
    return {
      opacity: Math.round(opacity * 1000) / 1000,
      transform: `translate3d(0px, ${translateY}px, 0px) scale(${scale})`,
      filter: "none",
      pointerEvents: opacity > 0.2 ? "auto" : "none",
    };
  }

  // Phase 3: Peaceful, stable reading plateau (0.24 to 0.42)
  if (p <= 0.42) {
    return {
      opacity: 1,
      transform: "translate3d(0px, 0px, 0px) scale(1)",
      filter: "none",
      pointerEvents: "auto",
    };
  }

  // Phase 4: Dissolves into falling cherry-blossom petals (0.42 to 0.54)
  if (p < 0.54) {
    const t = (p - 0.42) / 0.12;
    const easeT = easeOutQuad(t);
    const opacity = Math.max(0, 1 - easeT);
    const translateY = (-10 * easeT).toFixed(1);
    const blur = (10 * easeT).toFixed(1);
    const bright = (1 + 0.3 * (1 - easeT)).toFixed(2);
    const scale = (1 + 0.02 * easeT).toFixed(3);
    return {
      opacity: Math.round(opacity * 1000) / 1000,
      transform: `translate3d(0px, ${translateY}px, 0px) scale(${scale})`,
      filter: `drop-shadow(0 0 24px rgba(255, 182, 193, 0.85)) blur(${blur}px) brightness(${bright})`,
      pointerEvents: opacity > 0.1 ? "auto" : "none",
    };
  }

  // Phase 5: Fully dissolved into Part Two
  return {
    opacity: 0,
    transform: "translate3d(0px, -10px, 0px) scale(1.02)",
    filter: "blur(10px)",
    pointerEvents: "none",
  };
}

export const computeBodyStyle = computePartOneStyle;

function computePetalStyle(
  petal: TransitionPetalParticle,
  p: number,
  reducedMotion: boolean
): React.CSSProperties {
  if (reducedMotion) {
    return { display: "none" };
  }

  const startP = 0.41 + (petal.delay / 0.45) * 0.05; // 0.41 to 0.46
  const endP = Math.min(0.57, startP + 0.09 + (petal.scale / 1.35) * 0.03); // 0.50 to 0.57

  if (p <= startP) {
    return {
      left: `${petal.startX}%`,
      top: `${petal.startY}%`,
      opacity: 0,
      transform: `translate3d(0px, 0px, 0px) scale(${petal.scale}) rotate(${petal.initRot}deg)`,
      pointerEvents: "none",
    } as React.CSSProperties;
  }

  if (p >= endP) {
    return {
      left: `${petal.startX}%`,
      top: `${petal.startY}%`,
      opacity: 0,
      transform: `translate3d(${petal.dx}px, ${petal.dy}px, 0px) scale(${petal.scale * 0.75}) rotate(${petal.targetRot}deg)`,
      pointerEvents: "none",
    } as React.CSSProperties;
  }

  const t = (p - startP) / (endP - startP);
  const curX = petal.dx * easeOutQuad(t) + Math.sin(t * Math.PI * 2.5) * petal.swayAmp;
  const curY = petal.dy * easeOutQuad(t);
  const curRot = petal.initRot + (petal.targetRot - petal.initRot) * t;
  const curScale = petal.scale * (1 - 0.25 * easeOutQuad(t));

  let opacity = 1;
  if (t < 0.15) {
    opacity = t / 0.15;
  } else if (t > 0.75) {
    opacity = Math.max(0, 1 - (t - 0.75) / 0.25);
  }

  return {
    left: `${petal.startX}%`,
    top: `${petal.startY}%`,
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0px) scale(${curScale.toFixed(2)}) rotate(${curRot.toFixed(1)}deg)`,
    pointerEvents: "none",
  } as React.CSSProperties;
}

export function computePartTwoStyle(p: number, reducedMotion: boolean): React.CSSProperties {
  if (reducedMotion) {
    if (p <= 0.46) {
      return { opacity: 0, pointerEvents: "none" };
    }
    if (p <= 0.72) {
      return { opacity: 1, pointerEvents: "auto" };
    }
    const fadeOut = Math.max(0, 1 - (p - 0.72) / 0.10);
    return {
      opacity: fadeOut,
      pointerEvents: fadeOut > 0.1 ? "auto" : "none",
    };
  }

  // Phase 1: Before entrance (p <= 0.46)
  if (p <= 0.46) {
    return {
      opacity: 0,
      transform: "translate3d(0px, 30px, 0px) scale(0.96)",
      pointerEvents: "none",
    };
  }

  // Phase 2: Entrance as petals descend (0.46 to 0.55)
  if (p < 0.55) {
    const t = (p - 0.46) / 0.09;
    const easeT = easeOutCubic(t);
    const opacity = easeOutQuad(t);
    const translateY = (30 * (1 - easeT)).toFixed(1);
    const scale = (0.96 + 0.04 * easeT).toFixed(3);
    return {
      opacity: Math.round(opacity * 1000) / 1000,
      transform: `translate3d(0px, ${translateY}px, 0px) scale(${scale})`,
      filter: "none",
      pointerEvents: opacity > 0.2 ? "auto" : "none",
    };
  }

  // Phase 3: Peaceful, stable reading plateau (0.55 to 0.72)
  if (p <= 0.72) {
    return {
      opacity: 1,
      transform: "translate3d(0px, 0px, 0px) scale(1)",
      filter: "none",
      pointerEvents: "auto",
    };
  }

  // Phase 4: Dissolves as finale sequence begins (0.72 to 0.84)
  if (p < 0.84) {
    const t = (p - 0.72) / 0.12;
    const easeT = easeOutQuad(t);
    const opacity = Math.max(0, 1 - easeT);
    const translateY = (-10 * easeT).toFixed(1);
    const blur = (10 * easeT).toFixed(1);
    const bright = (1 + 0.3 * (1 - easeT)).toFixed(2);
    const scale = (1 + 0.02 * easeT).toFixed(3);
    return {
      opacity: Math.round(opacity * 1000) / 1000,
      transform: `translate3d(0px, ${translateY}px, 0px) scale(${scale})`,
      filter: `drop-shadow(0 0 24px rgba(255, 182, 193, 0.85)) blur(${blur}px) brightness(${bright})`,
      pointerEvents: opacity > 0.1 ? "auto" : "none",
    };
  }

  // Phase 5: Fully dissolved into finale signature
  return {
    opacity: 0,
    transform: "translate3d(0px, -10px, 0px) scale(1.02)",
    filter: "blur(10px)",
    pointerEvents: "none",
  };
}

function computeFinaleButterflyStyle(
  b: ButterflyParticle,
  p: number,
  reducedMotion: boolean
): React.CSSProperties {
  if (reducedMotion) {
    return { display: "none" };
  }

  // Finale butterfly flight phase: starts around 0.72 - 0.78, ends around 0.88 - 0.94
  const startP = 0.72 + (b.delay / 0.65) * 0.06;
  const endP = Math.min(0.94, startP + 0.16 + (b.duration / 3.3) * 0.04);

  if (p <= startP) {
    return {
      left: `${b.startX}%`,
      top: `${b.startY}%`,
      opacity: 0,
      transform: `translate3d(0px, 0px, 0px) scale(${b.scale}) rotate(${b.initRot}deg)`,
      pointerEvents: "none",
      "--flutter-speed": `${b.flutter}s`,
    } as React.CSSProperties;
  }

  if (p >= endP) {
    return {
      left: `${b.startX}%`,
      top: `${b.startY}%`,
      opacity: 0,
      transform: `translate3d(${b.dx}px, ${b.dy}px, 0px) scale(${b.scale * 0.7}) rotate(${b.targetRot}deg)`,
      pointerEvents: "none",
      "--flutter-speed": `${b.flutter}s`,
    } as React.CSSProperties;
  }

  const t = (p - startP) / (endP - startP);
  const curX = b.dx * easeOutCubic(t);
  const curY = b.dy * easeOutQuad(t); // b.dy is negative, so it flies upward!
  const curRot = b.initRot + (b.targetRot - b.initRot) * easeOutQuad(t);
  const curScale = b.scale * (1 - 0.3 * easeOutQuad(t));

  let opacity = 1;
  if (t < 0.14) {
    opacity = t / 0.14;
  } else if (t > 0.75) {
    opacity = Math.max(0, 1 - (t - 0.75) / 0.25);
  }

  return {
    left: `${b.startX}%`,
    top: `${b.startY}%`,
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0px) scale(${curScale.toFixed(2)}) rotate(${curRot.toFixed(1)}deg)`,
    pointerEvents: "none",
    "--flutter-speed": `${b.flutter}s`,
  } as React.CSSProperties;
}

function computeFinalePetalStyle(
  petal: TransitionPetalParticle,
  p: number,
  reducedMotion: boolean
): React.CSSProperties {
  if (reducedMotion) {
    return { display: "none" };
  }

  // Finale petal cascade phase: starts around 0.72 - 0.78, ends around 0.88 - 0.95
  const startP = 0.72 + (petal.delay / 0.5) * 0.06;
  const endP = Math.min(0.95, startP + 0.16 + (petal.scale / 1.35) * 0.04);

  if (p <= startP) {
    return {
      left: `${petal.startX}%`,
      top: `${petal.startY}%`,
      opacity: 0,
      transform: `translate3d(0px, 0px, 0px) scale(${petal.scale}) rotate(${petal.initRot}deg)`,
      pointerEvents: "none",
    } as React.CSSProperties;
  }

  if (p >= endP) {
    return {
      left: `${petal.startX}%`,
      top: `${petal.startY}%`,
      opacity: 0,
      transform: `translate3d(${petal.dx}px, ${petal.dy}px, 0px) scale(${petal.scale * 0.75}) rotate(${petal.targetRot}deg)`,
      pointerEvents: "none",
    } as React.CSSProperties;
  }

  const t = (p - startP) / (endP - startP);
  const curX = petal.dx * easeOutQuad(t) + Math.sin(t * Math.PI * 2.5) * petal.swayAmp;
  const curY = petal.dy * easeOutQuad(t); // petal.dy is positive, so it falls downward!
  const curRot = petal.initRot + (petal.targetRot - petal.initRot) * t;
  const curScale = petal.scale * (1 - 0.25 * easeOutQuad(t));

  let opacity = 1;
  if (t < 0.15) {
    opacity = t / 0.15;
  } else if (t > 0.75) {
    opacity = Math.max(0, 1 - (t - 0.75) / 0.25);
  }

  return {
    left: `${petal.startX}%`,
    top: `${petal.startY}%`,
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0px) scale(${curScale.toFixed(2)}) rotate(${curRot.toFixed(1)}deg)`,
    pointerEvents: "none",
  } as React.CSSProperties;
}

export function computeSignatureStyle(p: number, reducedMotion: boolean): React.CSSProperties {
  if (reducedMotion) {
    if (p <= 0.80) {
      return { opacity: 0, pointerEvents: "none" };
    }
    const opacity = Math.min(1, (p - 0.80) / 0.10);
    return {
      opacity: Math.round(opacity * 1000) / 1000,
      pointerEvents: opacity > 0.1 ? "auto" : "none",
    };
  }

  // Phase 1: Before entrance (p <= 0.78)
  if (p <= 0.78) {
    return {
      opacity: 0,
      transform: "translate3d(0px, 25px, 0px) scale(0.96)",
      pointerEvents: "none",
    };
  }

  // Phase 2: Entrance beneath upward butterflies + downward petals (0.78 to 0.88)
  if (p < 0.88) {
    const t = (p - 0.78) / 0.10;
    const easeT = easeOutCubic(t);
    const opacity = easeOutQuad(t);
    const translateY = (25 * (1 - easeT)).toFixed(1);
    const scale = (0.96 + 0.04 * easeT).toFixed(3);
    return {
      opacity: Math.round(opacity * 1000) / 1000,
      transform: `translate3d(0px, ${translateY}px, 0px) scale(${scale})`,
      pointerEvents: opacity > 0.2 ? "auto" : "none",
    };
  }

  // Phase 3: Peaceful final signature resting plateau (0.88 to 1.00)
  return {
    opacity: 1,
    transform: "translate3d(0px, 0px, 0px) scale(1)",
    pointerEvents: "auto",
  };
}

function computeScrollCueStyle(p: number): React.CSSProperties {
  if (p <= 0.015) {
    return { opacity: 1, pointerEvents: "auto" };
  }
  if (p >= 0.06) {
    return { opacity: 0, pointerEvents: "none" };
  }
  const opacity = 1 - (p - 0.015) / 0.045;
  return {
    opacity: Math.round(opacity * 1000) / 1000,
    pointerEvents: opacity > 0.1 ? "auto" : "none",
  };
}

export function SutoExperience() {
  const [viewState, setViewState] = useState<"loading" | "unauthenticated" | "unauthorized" | "authorized">("loading");
  const [, setContent] = useState<SutoContent | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Continuous, reversible scroll progress: 0 (top / "Hello Baby") to 1 (scrolled / "This is the body")
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Detect user prefers-reduced-motion accessibility setting
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Continuous scroll-progress tracking: handles wheel, trackpad, touch swipe, keyboard, and scrollbar
  useEffect(() => {
    if (viewState !== "authorized") return;

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const track = scrollTrackRef.current;
        if (!track) return;

        const container = containerRef.current;
        const viewportHeight = window.innerHeight || 800;
        const trackHeight = track.offsetHeight;
        const maxScroll = trackHeight - viewportHeight;

        if (maxScroll <= 0) {
          setScrollProgress(0);
          return;
        }

        const windowScroll =
          (typeof window !== "undefined"
            ? window.scrollY ??
              window.pageYOffset ??
              document.documentElement?.scrollTop ??
              document.body?.scrollTop
            : 0) ?? 0;
        const containerScroll = container ? container.scrollTop : 0;
        const rect = track.getBoundingClientRect();
        const currentScroll = Math.max(windowScroll, containerScroll, -rect.top);

        const rawP = currentScroll / maxScroll;
        setScrollProgress(clamp(rawP, 0, 1));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Measure initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [viewState]);

  // Smooth scroll helper for scroll cue button: glides directly into center of Part One reading plateau
  const handleScrollCueClick = useCallback(() => {
    const track = scrollTrackRef.current;
    const container = containerRef.current;
    const viewportHeight = window.innerHeight || 800;
    const trackHeight = track ? track.offsetHeight : viewportHeight * 5.8;
    const maxScroll = trackHeight - viewportHeight;
    const targetY = maxScroll * 0.33; // Centered at p = 0.33 within Part One plateau

    window.scrollTo({ top: targetY, behavior: "smooth" });
    if (container && container.scrollHeight > container.clientHeight) {
      container.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }, []);

  // Probe server-side authorization on mount
  useEffect(() => {
    let cancelled = false;

    async function checkAuthorization() {
      try {
        const privateContent = await getSutoContent();
        if (!cancelled) {
          setContent(privateContent);
          setViewState("authorized");
        }
      } catch (err: unknown) {
        if (cancelled) return;

        // Check if 401 (unauthenticated) vs 403 (unauthorized) via status probe
        try {
          const status = await getSutoStatus();
          if (!cancelled) {
            if (!status.authenticated) {
              setViewState("unauthenticated");
            } else if (!status.authorized) {
              setViewState("unauthorized");
            } else {
              // Retry fetching content once if status probe reported authorized
              try {
                const retryContent = await getSutoContent();
                if (!cancelled) {
                  setContent(retryContent);
                  setViewState("authorized");
                }
              } catch {
                setViewState("unauthorized");
              }
            }
          }
        } catch {
          if (!cancelled) {
            setViewState("unauthenticated");
          }
        }
      }
    }

    void checkAuthorization();

    return () => {
      cancelled = true;
    };
  }, []);

  // Falling cherry blossom petals animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface Petal {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      angle: number;
      angularSpeed: number;
      opacity: number;
      petalColor: string;
    }

    const petalColors = [
      "rgba(255, 235, 242, 0.9)", // soft white-pink
      "rgba(255, 215, 230, 0.8)", // cherry blossom pink
      "rgba(252, 228, 236, 0.85)", // pale blush rose
      "rgba(255, 245, 248, 0.95)", // pure rose cream
    ];

    const PETAL_COUNT = Math.min(36, Math.floor(window.innerWidth / 36));
    const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: 9 + Math.random() * 10,
      speedX: 0.5 + Math.random() * 1.3,
      speedY: 0.8 + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.03,
      opacity: 0.55 + Math.random() * 0.4,
      petalColor: petalColors[Math.floor(Math.random() * petalColors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.x += Math.sin(p.angle) * 0.8 + p.speedX;
        p.y += p.speedY;
        p.angle += p.angularSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) {
          p.x = -20;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.petalColor;

        // Draw organic sakura petal shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size / 2, -p.size, 0, -p.size * 1.2);
        ctx.bezierCurveTo(p.size / 2, -p.size, p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Spawn gentle floral sparkles on interactive garden click
  const handleGardenClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input")) return;

    const newSparkle: Sparkle = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };
    setSparkles((prev) => [...prev.slice(-8), newSparkle]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
    }, 800);
  }, []);

  const handleReturnToTerminal = () => {
    navigateTo("/");
  };

  const headingStyle = computeHeadingStyle(scrollProgress, prefersReducedMotion);
  const accentsStyle = computeAccentsStyle(scrollProgress, prefersReducedMotion);
  const partOneStyle = computePartOneStyle(scrollProgress, prefersReducedMotion);
  const partTwoStyle = computePartTwoStyle(scrollProgress, prefersReducedMotion);
  const signatureStyle = computeSignatureStyle(scrollProgress, prefersReducedMotion);
  const scrollCueStyle = computeScrollCueStyle(scrollProgress);

  return (
    <div
      className="suto-experience"
      ref={containerRef}
      onClick={handleGardenClick}
      role="main"
      aria-label="Suto"
      tabIndex={0}
    >
      {/* Falling cherry blossoms canvas */}
      <canvas ref={canvasRef} className="suto-petals-canvas" aria-hidden="true" />

      {/* View State: Loading */}
      {viewState === "loading" && (
        <div className="suto-loading-container" role="status" aria-label="Opening">
          <div className="suto-loading-flower" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
              <circle cx="32" cy="32" r="8" fill="#F5D77F" />
              <path d="M32 10C32 10 38 20 32 26C26 20 32 10 32 10Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
              <path d="M54 32C54 32 44 38 38 32C44 26 54 32 54 32Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
              <path d="M32 54C32 54 26 44 32 38C38 44 32 54 32 54Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
              <path d="M10 32C10 32 20 26 26 32C20 38 10 32 10 32Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="suto-loading-text">Loading…</div>
        </div>
      )}

      {/* View State: Unauthenticated visitor */}
      {viewState === "unauthenticated" && (
        <div className="suto-auth-container">
          <div className="suto-envelope-card" role="region" aria-label="Sign in">
            <h1 className="suto-auth-title">A Secret World</h1>
            <p className="suto-auth-subtitle">
              Please sign in with Google to enter.
            </p>

            <button
              type="button"
              className="suto-google-btn"
              onClick={initiateSutoGoogleSignIn}
              id="suto-google-signin-btn"
            >
              <svg className="suto-google-g-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      )}

      {/* View State: Unauthorized Visitor (Mischievous Cat) */}
      {viewState === "unauthorized" && (
        <div className="suto-unauthorized-container">
          <div className="suto-cat-card" role="alert" aria-label="Access denied">
            <div className="suto-mischief-cat-stage" aria-hidden="true">
              <svg className="suto-mischief-cat-svg" viewBox="0 0 200 200" fill="none">
                <ellipse cx="100" cy="180" rx="72" ry="14" fill="#6E2837" opacity="0.3" />
                <g className="suto-cat-tail-swish">
                  <path
                    d="M48 140C30 135 22 110 32 95C38 85 50 88 48 100C45 115 56 128 65 132"
                    stroke="#223628"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                </g>
                <ellipse cx="100" cy="138" rx="42" ry="34" fill="#223628" />
                <path d="M88 126C95 134 105 134 112 126C110 142 90 142 88 126Z" fill="#FDFBF7" />
                <circle cx="100" cy="85" r="32" fill="#223628" />
                <path d="M72 65L82 42L95 62Z" fill="#223628" />
                <path d="M77 62L83 48L91 60Z" fill="#FDE8EF" />
                <path d="M128 65L118 42L105 62Z" fill="#223628" />
                <path d="M123 62L117 48L109 60Z" fill="#FDE8EF" />
                <circle cx="82" cy="56" r="5" fill="#E594AD" />
                <circle cx="82" cy="56" r="2" fill="#F5D77F" />
                <circle cx="118" cy="56" r="5" fill="#E594AD" />
                <circle cx="118" cy="56" r="2" fill="#F5D77F" />
                <circle cx="100" cy="52" r="6" fill="#FDE8EF" />
                <circle cx="100" cy="52" r="2.5" fill="#E594AD" />
                <path d="M84 82C87 78 92 78 95 82" stroke="#FDFBF7" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="112" cy="82" r="4.5" fill="#FDFBF7" />
                <circle cx="112" cy="82" r="2.5" fill="#223628" />
                <circle cx="113.5" cy="80.5" r="1" fill="#FFFFFF" />
                <polygon points="100,90 96,86 104,86" fill="#E594AD" />
                <path d="M96 92C98 95 100 95 100 92C100 95 102 95 104 92" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round" />
                <line x1="70" y1="88" x2="86" y2="89" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="68" y1="94" x2="86" y2="92" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="130" y1="88" x2="114" y2="89" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="132" y1="94" x2="114" y2="92" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <ellipse cx="80" cy="158" rx="9" ry="7" fill="#223628" />
                <ellipse cx="80" cy="157" rx="6" ry="4" fill="#FDE8EF" opacity="0.6" />
                <g className="suto-cat-paw-shoo">
                  <path d="M125 130C135 125 145 110 148 100" stroke="#223628" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="148" cy="100" r="9" fill="#223628" />
                  <ellipse cx="148" cy="100" rx="5" ry="4" fill="#FDE8EF" />
                  <circle cx="145" cy="94" r="2" fill="#E594AD" />
                  <circle cx="149" cy="93" r="2" fill="#E594AD" />
                  <circle cx="153" cy="95" r="2" fill="#E594AD" />
                </g>
              </svg>
            </div>

            <h2 className="suto-unauth-copy">
              “No, no, no. You're not invited here. Shoo, go away!”
            </h2>
            <p className="suto-unauth-desc">
              This little sanctuary is kept private for someone very special.
            </p>

            <button
              type="button"
              className="suto-return-btn"
              onClick={handleReturnToTerminal}
              id="suto-return-to-terminal-btn"
            >
              <span>← Return to Shadow Exchange Terminal</span>
            </button>
          </div>
        </div>
      )}

      {/* View State: Authorized Experience — Reversible, Scroll-Linked Butterfly Transformation */}
      {viewState === "authorized" && (
        <div className="suto-authorized-flow">
          <div className="suto-scroll-track" ref={scrollTrackRef}>
            <div className="suto-sticky-stage">
              {/* Heading Layer: "Hello Baby" heading with specimen accents */}
              <div
                className="suto-hero-stage suto-heading-layer"
                style={{
                  opacity: headingStyle.opacity,
                  pointerEvents: headingStyle.pointerEvents,
                }}
              >
                <div
                  className="suto-heading-cluster"
                  style={{
                    filter: headingStyle.filter,
                    transform: headingStyle.transform,
                  }}
                >
                  {/* Top decorative accents inspired by specimen reference */}
                  <span
                    className="suto-accent-decor suto-star-1"
                    style={accentsStyle}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="suto-svg-star">
                      <path d="M12 0 C12 7.5 16.5 12 24 12 C16.5 12 12 16.5 12 24 C12 16.5 7.5 12 0 12 C7.5 12 12 7.5 12 0 Z" fill="#C97F0A" />
                    </svg>
                  </span>

                  <span
                    className="suto-accent-decor suto-heart-1"
                    style={accentsStyle}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="suto-svg-heart">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="#FFFECB"
                        stroke="#F5B81C"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </span>

                  <span
                    className="suto-accent-decor suto-star-2"
                    style={accentsStyle}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="suto-svg-star">
                      <path d="M12 0 C12 7.5 16.5 12 24 12 C16.5 12 12 16.5 12 24 C12 16.5 7.5 12 0 12 C7.5 12 12 7.5 12 0 Z" fill="#E29012" />
                    </svg>
                  </span>

                  <h1 className="suto-hello-baby" data-text="Hello Baby">
                    Hello Baby
                  </h1>

                  {/* Bottom decorative accents */}
                  <span
                    className="suto-accent-decor suto-star-3"
                    style={accentsStyle}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="suto-svg-star">
                      <path d="M12 0 C12 7.5 16.5 12 24 12 C16.5 12 12 16.5 12 24 C12 16.5 7.5 12 0 12 C7.5 12 12 7.5 12 0 Z" fill="#C97F0A" />
                    </svg>
                  </span>

                  <span
                    className="suto-accent-decor suto-heart-2"
                    style={accentsStyle}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="suto-svg-heart">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="#FFFECB"
                        stroke="#F5B81C"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </span>

                  <span
                    className="suto-accent-decor suto-star-4"
                    style={accentsStyle}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" className="suto-svg-star">
                      <path d="M12 0 C12 7.5 16.5 12 24 12 C16.5 12 12 16.5 12 24 C12 16.5 7.5 12 0 12 C7.5 12 12 7.5 12 0 Z" fill="#E29012" />
                    </svg>
                  </span>

                  {/* Butterfly Particles Swarm: Emerge from heading and fly outward */}
                  <div className="suto-butterflies-swarm" aria-hidden="true">
                    {BUTTERFLY_PARTICLES.map((b) => (
                      <span
                        key={b.id}
                        className="suto-butterfly-particle"
                        style={computeButterflyStyle(b, scrollProgress, prefersReducedMotion)}
                      >
                        <span className="suto-butterfly-inner">
                          <ButterflySvg color={b.color} wingColor={b.wingColor} />
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gentle scroll indicator on opening screen */}
                <button
                  type="button"
                  className="suto-scroll-cue"
                  style={scrollCueStyle}
                  onClick={handleScrollCueClick}
                  aria-label="Scroll down to explore"
                >
                  <span className="suto-scroll-cue-text">Scroll</span>
                  <svg
                    className="suto-scroll-cue-arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 10L12 15L17 10"
                      stroke="#F5B81C"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Part One Section: Love letter paragraph */}
              <div
                className="suto-body-stage suto-body-layer suto-part-one-stage"
                style={partOneStyle}
              >
                <div className="suto-body-content suto-part-one-content">
                  <p className="suto-body-text suto-part-one-text">
                    Babu, you know, I would not have been able to do it if it was not for you. I know you don't give yourself the credit that you deserve, I think whatever I am, however I am, is all because of you. Really thankful I got to have you, my Babu.
                  </p>
                </div>

                {/* Delicate Falling Cherry-Blossom Petals Swarm (Part One -> Part Two Transition) */}
                <div className="suto-petals-transition-swarm" aria-hidden="true">
                  {PETAL_TRANSITION_PARTICLES.map((petal) => (
                    <span
                      key={petal.id}
                      className="suto-transition-petal"
                      style={computePetalStyle(petal, scrollProgress, prefersReducedMotion)}
                    >
                      <span className="suto-transition-petal-inner">
                        <SakuraPetalSvg color={petal.color} strokeColor={petal.strokeColor} />
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Part Two Section: Miss Sunshine love letter */}
              <div
                className="suto-body-stage suto-body-layer suto-part-two-stage"
                style={partTwoStyle}
              >
                <div className="suto-body-content suto-part-two-content">
                  <p className="suto-body-text suto-part-two-text">
                    You know, when I call you my Miss Sunshine. That was not like a flirty line. It was kind of a flirty line. I won't say wasn't a flirty line, but, like, it was more of the, like, you brighten up my day, and you brighten up everything. You are my sun. You are my brightest star. I love you. I love you. I love you so much. You are my pyaara bachcha.
                  </p>
                </div>
              </div>

              {/* Finale Ending Sequence: Upward Butterflies + Downward Petals */}
              <div className="suto-finale-particles-container" aria-hidden="true">
                {FINALE_BUTTERFLY_PARTICLES.map((b) => (
                  <span
                    key={`finale-b-${b.id}`}
                    className="suto-finale-butterfly-particle"
                    style={computeFinaleButterflyStyle(b, scrollProgress, prefersReducedMotion)}
                  >
                    <span className="suto-butterfly-inner">
                      <ButterflySvg color={b.color} wingColor={b.wingColor} />
                    </span>
                  </span>
                ))}
                {FINALE_PETAL_PARTICLES.map((petal) => (
                  <span
                    key={`finale-p-${petal.id}`}
                    className="suto-finale-petal-particle"
                    style={computeFinalePetalStyle(petal, scrollProgress, prefersReducedMotion)}
                  >
                    <span className="suto-transition-petal-inner">
                      <SakuraPetalSvg color={petal.color} strokeColor={petal.strokeColor} />
                    </span>
                  </span>
                ))}
              </div>

              {/* Final Signature Section: "With love, by your boyfriend" */}
              <div
                className="suto-signature-stage suto-signature-layer"
                style={signatureStyle}
              >
                <div className="suto-signature-content">
                  <p className="suto-signature-text">
                    With love, by your boyfriend
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive floral click sparkles */}
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="suto-click-sparkle"
          style={{ left: sparkle.x, top: sparkle.y }}
          aria-hidden="true"
        >
          🌸
        </span>
      ))}
    </div>
  );
}
