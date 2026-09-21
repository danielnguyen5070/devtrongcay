"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type ProximityScaleGridProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

const MAX_SCALE = 1.42;
const DURATION = 0.35;

function ProximityScaleGrid({
  children,
  className,
  "aria-label": ariaLabel,
}: ProximityScaleGridProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      // Touch devices: keep the static grid (no proximity tracking).
      if (window.matchMedia("(pointer: coarse)").matches) {
        return;
      }

      const images = gsap.utils.toArray<HTMLElement>(".blog-image", stage);
      if (images.length === 0) return;

      images.forEach((img, index) => {
        gsap.set(img, {
          transformOrigin: "center center",
          rotation: index % 2 === 1 ? 3 : 0,
          scale: 1,
        });
      });

      const getRadius = () => {
        const tile = stage.querySelector(".blog-tile");
        if (!tile) return 200;
        const { width, height } = tile.getBoundingClientRect();
        return Math.max(width, height) * 1.4;
      };

      const onMove = (event: MouseEvent) => {
        const radius = getRadius();

        for (let index = 0; index < images.length; index += 1) {
          const img = images[index];
          const rect = img.getBoundingClientRect();
          const distance = Math.hypot(
            event.clientX - (rect.left + rect.width / 2),
            event.clientY - (rect.top + rect.height / 2),
          );
          const proximity = gsap.utils.clamp(
            0,
            1,
            gsap.utils.mapRange(0, radius, 1, 0, distance),
          );
          const baseRotation = index % 2 === 1 ? 3 : 0;

          gsap.to(img, {
            scale: 1 + (MAX_SCALE - 1) * proximity,
            rotation: baseRotation + (index % 2 === 1 ? 2 : -2) * proximity,
            duration: DURATION,
            overwrite: "auto",
            ease: "power2.out",
          });
        }
      };

      const onLeave = () => {
        images.forEach((img, index) => {
          gsap.to(img, {
            scale: 1,
            rotation: index % 2 === 1 ? 3 : 0,
            duration: DURATION * 1.2,
            overwrite: "auto",
            ease: "power2.out",
          });
        });
      };

      stage.addEventListener("mousemove", onMove);
      stage.addEventListener("mouseleave", onLeave);

      return () => {
        stage.removeEventListener("mousemove", onMove);
        stage.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: stageRef },
  );

  return (
    <div
      ref={stageRef}
      className={cn("blog-grid proximity-scale-grid", className)}
      role="region"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export { ProximityScaleGrid };
