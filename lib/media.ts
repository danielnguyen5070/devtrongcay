export const CLOUDINARY_FOLDER = "devtrongcay";

function cloudName() {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!name) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set.");
  }

  return name;
}

export function getDefaultCoverUrl() {
  return `https://res.cloudinary.com/${cloudName()}/image/upload/${CLOUDINARY_FOLDER}/defaults/cover.webp`;
}

export function getCoverUrl(url: string | null | undefined) {
  return url?.trim() || getDefaultCoverUrl();
}
