import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";

export type ShadowCatExpression =
  | "neutral"
  | "blessed"
  | "suspicious"
  | "broke"
  | "profit"
  | "loss"
  | "sleepy"
  | "facepalm"
  | "thinking"
  | "404";

export interface ShadowCatProps {
  expression?: ShadowCatExpression;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
  interactive?: boolean;
  trackCursor?: boolean;
  reducedMotion?: boolean;
  onCatClick?: () => void;
}

export function ShadowCat({
  expression = "neutral",
  size = 32,
  className = "",
  style,
  title,
  interactive = false,
  trackCursor = false,
  reducedMotion = false,
  onCatClick,
}: ShadowCatProps): ReactElement {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isWinking, setIsWinking] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!trackCursor || reducedMotion) return;
    const handlePointerMove = (e: PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy) || 1;
      const maxOffset = 1.35;
      const factor = Math.min(dist / 280, 1) * maxOffset;
      setOffset({
        x: (dx / dist) * factor,
        y: (dy / dist) * factor,
      });
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [trackCursor, reducedMotion]);

  const activeExpression = isWinking ? "blessed" : expression;

  const handleClick = () => {
    if (interactive) {
      setIsWinking(true);
      setTimeout(() => setIsWinking(false), 500);
      onCatClick?.();
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`shadow-cat-mascot shadow-cat-${activeExpression} ${interactive ? "is-interactive" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title || `Shadow Cat Mascot (${activeExpression})`}
      onClick={interactive ? handleClick : undefined}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        cursor: interactive ? "pointer" : undefined,
        ...style,
      }}
    >
      {title && <title>{title}</title>}
      <g
        transform={
          trackCursor && !reducedMotion && (offset.x !== 0 || offset.y !== 0)
            ? `translate(${offset.x.toFixed(2)}, ${offset.y.toFixed(2)})`
            : undefined
        }
      >
      {/* Base Silhouette: Head & Ears */}
      <polygon
        points="8,12 5,4 12,8"
        fill="#141712"
        stroke="#2a3025"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon points="8,11 6,6 11,8" fill="#d3f17b" opacity="0.3" />
      <polygon
        points="20,8 27,4 24,12"
        fill="#141712"
        stroke="#2a3025"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon points="21,8 26,6 24,11" fill="#d3f17b" opacity="0.3" />

      {/* Head */}
      <circle
        cx="16"
        cy="16"
        r="10"
        fill="#141712"
        stroke="#2a3025"
        strokeWidth="1.2"
      />

      {/* Whiskers */}
      <path
        d="M8 17 L2 16 M8 19 L2 20 M24 17 L30 16 M24 19 L30 20"
        stroke="#3b4233"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Nose & Mouth */}
      <polygon points="15,18 17,18 16,19.2" fill="#f19c65" />
      <path
        d="M14.5 19.8 C15.2 20.6 16 20.6 16 19.8 C16 20.6 16.8 20.6 17.5 19.8"
        stroke="#3b4233"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Expression-Specific Features */}
      {expression === "neutral" && (
        <g className="cat-eyes-neutral">
          <ellipse cx="12" cy="15" rx="2.4" ry="2.2" fill="#d3f17b" />
          <ellipse cx="20" cy="15" rx="2.4" ry="2.2" fill="#d3f17b" />
          <rect x="9.5" y="12.5" width="5" height="1.8" fill="#141712" />
          <rect x="17.5" y="12.5" width="5" height="1.8" fill="#141712" />
          <ellipse cx="12" cy="15.2" rx="0.9" ry="1.8" fill="#11130f" />
          <ellipse cx="20" cy="15.2" rx="0.9" ry="1.8" fill="#11130f" />
        </g>
      )}

      {expression === "blessed" && (
        <g className="cat-eyes-blessed">
          {/* Halo */}
          <ellipse
            cx="16"
            cy="3.2"
            rx="7"
            ry="2.2"
            stroke="#d3f17b"
            strokeWidth="1.2"
            fill="none"
            opacity="0.9"
          />
          {/* Curved Happy Eyes */}
          <path
            d="M10 16 C10.5 13.5 13.5 13.5 14 16"
            stroke="#d3f17b"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M18 16 C18.5 13.5 21.5 13.5 22 16"
            stroke="#d3f17b"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Sparkle */}
          <path
            d="M26 8 L27 10 L29 11 L27 12 L26 14 L25 12 L23 11 L25 10 Z"
            fill="#d3f17b"
            opacity="0.85"
          />
        </g>
      )}

      {expression === "suspicious" && (
        <g className="cat-eyes-suspicious">
          {/* Left eye wide and staring */}
          <ellipse cx="11.5" cy="14.8" rx="2.5" ry="2.5" fill="#d3f17b" />
          <ellipse cx="11.5" cy="14.8" rx="0.8" ry="2.2" fill="#11130f" />
          {/* Right eye squinting */}
          <path
            d="M18 15 Q20.5 13 22.5 15.2"
            stroke="#d3f17b"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Raised eyebrow */}
          <path
            d="M9.5 11 Q12 9.5 14 11.5"
            stroke="#d3f17b"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {expression === "broke" && (
        <g className="cat-eyes-broke">
          {/* Flat line deadpan eyes */}
          <line
            x1="10"
            y1="15"
            x2="14"
            y2="15"
            stroke="#d3f17b"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="18"
            y1="15"
            x2="22"
            y2="15"
            stroke="#d3f17b"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Sweatdrop */}
          <path
            d="M25 11 C26 13 25 15 24 15 C23 15 22 13 23.5 11 Z"
            fill="#7be0f1"
            opacity="0.9"
          />
          {/* Empty coin pouch */}
          <path
            d="M13.5 23 L18.5 23 L17.5 27 L14.5 27 Z"
            fill="none"
            stroke="#858c7e"
            strokeWidth="0.8"
          />
        </g>
      )}

      {expression === "profit" && (
        <g className="cat-eyes-profit">
          {/* Stylized profit shades */}
          <polygon
            points="9.5,13.5 14.5,13.5 13.5,16.5 10.5,16.5"
            fill="#d3f17b"
            opacity="0.95"
          />
          <polygon
            points="17.5,13.5 22.5,13.5 21.5,16.5 18.5,16.5"
            fill="#d3f17b"
            opacity="0.95"
          />
          <line
            x1="14.5"
            y1="14"
            x2="17.5"
            y2="14"
            stroke="#d3f17b"
            strokeWidth="1"
          />
          {/* Upward green tick */}
          <path
            d="M26 6 L29 6 L29 9 M29 6 L24 11"
            stroke="#d3f17b"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {expression === "loss" && (
        <g className="cat-eyes-loss">
          <ellipse cx="12" cy="15.5" rx="2" ry="1.6" fill="#d3f17b" opacity="0.7" />
          <ellipse cx="20" cy="15.5" rx="2" ry="1.6" fill="#d3f17b" opacity="0.7" />
          {/* Red downward tick */}
          <path
            d="M26 11 L26 14 L23 14 M26 14 L22 10"
            stroke="#f17c70"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {expression === "sleepy" && (
        <g className="cat-eyes-sleepy">
          <path
            d="M10 15 Q12 16.5 14 15"
            stroke="#d3f17b"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M18 15 Q20 16.5 22 15"
            stroke="#d3f17b"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <text
            x="24"
            y="9"
            fill="#d3f17b"
            fontFamily="monospace"
            fontSize="5.5"
            fontWeight="bold"
            opacity="0.85"
          >
            z
          </text>
          <text
            x="27"
            y="5"
            fill="#d3f17b"
            fontFamily="monospace"
            fontSize="4"
            opacity="0.6"
          >
            Z
          </text>
        </g>
      )}

      {expression === "facepalm" && (
        <g className="cat-eyes-facepalm">
          <line
            x1="10"
            y1="15"
            x2="14"
            y2="15"
            stroke="#d3f17b"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <ellipse cx="20" cy="15" rx="2.2" ry="2" fill="#d3f17b" />
          {/* Paw over eye */}
          <ellipse
            cx="11"
            cy="17"
            rx="3.5"
            ry="2.5"
            fill="#1c2018"
            stroke="#3b4233"
            strokeWidth="1"
            transform="rotate(-20 11 17)"
          />
        </g>
      )}

      {expression === "thinking" && (
        <g className="cat-eyes-thinking">
          <ellipse cx="12.5" cy="13.8" rx="2.1" ry="2.1" fill="#d3f17b" />
          <ellipse cx="20.5" cy="13.8" rx="2.1" ry="2.1" fill="#d3f17b" />
          <circle cx="13.5" cy="13.2" r="1" fill="#11130f" />
          <circle cx="21.5" cy="13.2" r="1" fill="#11130f" />
          {/* Paw under chin */}
          <ellipse
            cx="16"
            cy="21.5"
            rx="3.2"
            ry="1.8"
            fill="#1c2018"
            stroke="#3b4233"
            strokeWidth="0.9"
          />
          {/* Floating thought bubbles */}
          <circle cx="25" cy="8" r="0.9" fill="#d3f17b" opacity="0.7" />
          <circle cx="27" cy="5" r="1.4" fill="#d3f17b" opacity="0.9" />
        </g>
      )}

      {expression === "404" && (
        <g className="cat-eyes-404">
          <ellipse cx="12" cy="15" rx="2.5" ry="2.5" fill="#d3f17b" />
          <ellipse cx="20" cy="15" rx="2.5" ry="2.5" fill="#d3f17b" />
          <path d="M11 14 L13 16 M13 14 L11 16" stroke="#11130f" strokeWidth="0.8" />
          <path d="M19 14 L21 16 M21 14 L19 16" stroke="#11130f" strokeWidth="0.8" />
          {/* Radar waves */}
          <path
            d="M12 4 Q16 2 20 4"
            stroke="#d3f17b"
            strokeWidth="1"
            strokeDasharray="1.5 1.5"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M10 2 Q16 -1 22 2"
            stroke="#d3f17b"
            strokeWidth="1"
            strokeDasharray="1.5 1.5"
            fill="none"
            opacity="0.5"
          />
        </g>
      )}
      </g>
    </svg>
  );
}
