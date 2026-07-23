"use client";

import { useEffect, useRef, useState } from "react";

export function MiniPreview({
  id,
  fallbackGradient,
  fallbackEmoji,
  height = 120,
}: {
  id: string | number;
  fallbackGradient: string;
  fallbackEmoji?: string;
  height?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [errored, setErrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-gray-950"
      style={{ height: `${height}px` }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 bg-gray-900 px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500/70" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
        <span className="h-2 w-2 rounded-full bg-green-500/70" />
        <div className="mx-2 h-3.5 flex-1 rounded-sm bg-gray-700/60 text-[9px] text-gray-500 flex items-center px-1.5 truncate">
          {String(id).slice(0, 8)}…
        </div>
      </div>

      {(!loaded || errored) && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${fallbackGradient} opacity-75`}
          style={{ top: "26px" }}
        >
          {fallbackEmoji && (
            <span className="text-3xl drop-shadow">{fallbackEmoji}</span>
          )}
        </div>
      )}

      {visible && !errored && (
        <div
          className="absolute overflow-hidden"
          style={{ top: "26px", left: 0, right: 0, bottom: 0 }}
        >
          <iframe
            src={`/api/apps/${id}/preview`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "500%",
              height: "470px",
              transform: "scale(0.2)",
              transformOrigin: "top left",
              pointerEvents: "none",
              border: "none",
            }}
            sandbox="allow-scripts"
            tabIndex={-1}
            aria-hidden
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        </div>
      )}
    </div>
  );
}
