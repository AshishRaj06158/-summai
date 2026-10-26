"use client";

import React, { useEffect, useState } from "react";

export function ReadingProgress() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setCompletion(Math.min(100, Math.max(0, (scrollY / scrollHeight) * 100)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (completion === 0) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page reading progress"
      aria-valuenow={Math.round(completion)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-primary-action via-secondary to-tertiary-action transition-all duration-150 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
        style={{ width: `${completion}%` }}
      />
    </div>
  );
}
