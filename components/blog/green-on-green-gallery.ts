export type BentoGalleryImage = {
  src: string;
  alt: string;
};

/**
 * Images for the green-on-green scrubbed bento gallery.
 * Layout expects exactly 3 images:
 * 1) wide top-left
 * 2) top-right highlight (zooms to center on scroll)
 * 3) full-width bottom
 */
export const greenOnGreenGalleryImages: BentoGalleryImage[] = [
  {
    src: "/images/blog/thumnail.webp",
    alt: "Green on green — thumbnail",
  },
  {
    src: "/images/blog/green-on-green.webp",
    alt: "Green on green — highlight leaf",
  },
  {
    src: "/images/blog/green-on-green-1.webp",
    alt: "Green on green — full plant",
  },
];
