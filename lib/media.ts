export const MEDIA_BUCKET = "blog-media";

export const DEFAULT_COVER_PATH = "defaults/cover.webp";

function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  return url.replace(/\/$/, "");
}

/** Public URL for an object path inside the `blog-media` bucket. */
export function getMediaUrl(path: string) {
  const encoded = path
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${supabaseUrl()}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}

export function getCoverUrl(path: string | null | undefined) {
  return getMediaUrl(path?.trim() || DEFAULT_COVER_PATH);
}
