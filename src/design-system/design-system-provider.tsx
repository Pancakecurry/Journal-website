"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.2, 0.75, 0.25, 1] }}>
      {children}
    </MotionConfig>
  );
}
