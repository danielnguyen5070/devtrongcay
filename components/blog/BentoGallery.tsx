"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ExpoScaleEase } from "gsap/EasePack";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { BentoGalleryImage } from "./green-on-green-gallery";

gsap.registerPlugin(Flip, ScrollTrigger, ExpoScaleEase);

type BentoGalleryProps = {
  images: BentoGalleryImage[];
  className?: string;
};

function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function BentoGallery({ images, className }: BentoGalleryProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const gallery = galleryRef.current;
      const wrap = wrapRef.current;
      if (!gallery || !wrap || images.length === 0) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      let flipCtx: gsap.Context | undefined;
      let cancelled = false;

      const createTween = () => {
        flipCtx?.revert();

        const items = gsap.utils.toArray<HTMLElement>(
          ".bento-gallery__item",
          gallery,
        );
        if (items.length === 0) return;

        gallery.classList.remove("bento-gallery--final");
        gsap.set(items, { clearProps: "all" });

        flipCtx = gsap.context(() => {
          gallery.classList.add("bento-gallery--final");
          const flipState = Flip.getState(items);
          gallery.classList.remove("bento-gallery--final");

          const flip = Flip.to(flipState, {
            simple: true,
            absolute: true,
            ease: "expoScale(1, 5)",
          });

          const bottom = gallery.querySelector<HTMLElement>(
            ".bento-gallery__item--3",
          );

          if (bottom) {
            gsap.set(bottom, { autoAlpha: 1 });
          }

          gsap
            .timeline({
              scrollTrigger: {
                trigger: wrap,
                start: "center center",
                end: "+=100%",
                scrub: true,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate(self) {
                  if (!bottom) return;
                  // Hide bottom image once zoom passes 90%.
                  gsap.set(bottom, {
                    autoAlpha: self.progress > 0.9 ? 0 : 1,
                  });
                },
              },
            })
            .add(flip);

          return () => {
            gsap.set(items, { clearProps: "all" });
          };
        }, gallery);
      };

      void waitForImages(gallery).then(() => {
        if (cancelled) return;
        createTween();
        ScrollTrigger.refresh();
      });

      if (!contextSafe) {
        return () => {
          cancelled = true;
          flipCtx?.revert();
        };
      }

      const onResize = contextSafe(() => {
        createTween();
        ScrollTrigger.refresh();
      });

      window.addEventListener("resize", onResize);

      return () => {
        cancelled = true;
        window.removeEventListener("resize", onResize);
        flipCtx?.revert();
      };
    },
    { scope: wrapRef, dependencies: [images] },
  );

  if (images.length === 0) return null;

  const items = images.slice(0, 3);
  const count = items.length;

  return (
    <div
      ref={wrapRef}
      className={cn("bento-gallery-wrap", className)}
      data-count={count}
    >
      <div
        ref={galleryRef}
        className="bento-gallery"
        role="list"
        aria-label="Image gallery"
      >
        {items.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            className={`bento-gallery__item bento-gallery__item--${index + 1}`}
            role="listitem"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 42rem"
              className="object-cover object-center"
              priority={index < 2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export { BentoGallery };
export type { BentoGalleryProps };
