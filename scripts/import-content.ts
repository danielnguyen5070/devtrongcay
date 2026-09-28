/**
 * One-time import of the MDX blog (content/blogs/{vi,en}) into Supabase and
 * its images (public/images/blog) into Cloudinary.
 *
 *   npm run content:import              # upload and write
 *   npm run content:import -- --dry-run # parse and validate only
 *
 * Requires in .env.local (local only):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY,
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Idempotent: rows are upserted on their natural keys (slugs, locale, media
 * position) and images use fixed Cloudinary public IDs with overwrite=false,
 * so re-running returns the existing assets and never creates duplicates.
 * Re-running does overwrite imported rows with the MDX values, including
 * setting those posts back to `published`. Nothing is deleted.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import type { Database } from "../types/database";

type Locale = Database["public"]["Enums"]["app_locale"];

const LOCALES: Locale[] = ["vi", "en"];
const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content/blogs");
const PUBLIC_DIR = path.join(ROOT, "public");
const CLOUDINARY_FOLDER = "devtrongcay";
const CLOUDINARY_ALLOWED_FORMATS = "webp,jpg,png,avif";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_COVER_SOURCE = "/images/blog/green-on-green.webp";
// Must match getDefaultCoverUrl() in lib/media.ts.
const DEFAULT_COVER_PUBLIC_ID = `${CLOUDINARY_FOLDER}/defaults/cover`;

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

/** Galleries that lived in components/blog/green-on-green-gallery.ts. */
const GALLERIES: Record<string, { src: string; alt: string }[]> = {
  "green-on-green": [
    { src: "/images/blog/thumnail.webp", alt: "Green on green — thumbnail" },
    {
      src: "/images/blog/green-on-green.webp",
      alt: "Green on green — highlight leaf",
    },
    {
      src: "/images/blog/green-on-green-1.webp",
      alt: "Green on green — full plant",
    },
  ],
};

type ParsedTranslation = {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  date: string;
  coverImage: string | null;
  category: string | null;
  body: string;
};

type ParsedPost = {
  slug: string;
  publishedAt: string;
  coverImage: string | null;
  categorySlug: string | null;
  translations: ParsedTranslation[];
};

const dryRun = process.argv.includes("--dry-run");
const warnings: string[] = [];

function warn(message: string) {
  warnings.push(message);
  console.warn(`  ! ${message}`);
}

function loadEnv() {
  const envFile = path.join(ROOT, ".env.local");
  if (fs.existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local.`);
  }
  return value;
}

function optionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIsoDate(value: string, file: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${file}: invalid date "${value}"`);
  }
  return parsed.toISOString();
}

function looksLikeMdx(body: string) {
  return (
    /^\s*(import|export)\s/m.test(body) ||
    /<\/?[A-Za-z][\w.-]*(\s[^>]*)?\/?>/.test(body) ||
    /\{[^}]*\}/.test(body)
  );
}

function readTranslations(locale: Locale): ParsedTranslation[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) {
    warn(`No content directory for "${locale}"`);
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .sort()
    .map((file) => {
      const relative = path.join("content/blogs", locale, file);
      const { data, content } = matter(
        fs.readFileSync(path.join(dir, file), "utf8"),
      );
      const fileSlug = file.replace(/\.mdx?$/, "");
      const slug = optionalString(data.slug) ?? fileSlug;
      const title = optionalString(data.title);
      const date = optionalString(data.date);

      if (!title) throw new Error(`${relative}: missing title`);
      if (!date) throw new Error(`${relative}: missing date`);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(`${relative}: invalid slug "${slug}"`);
      }

      const body = content.trim();
      if (looksLikeMdx(body)) {
        warn(`${relative}: body contains JSX/expressions; it will render as plain Markdown`);
      }

      return {
        locale,
        slug,
        title,
        description: optionalString(data.description) ?? "",
        date,
        coverImage: optionalString(data.coverImage),
        category: optionalString(data.category),
        body,
      };
    });
}

function buildModel() {
  const bySlug = new Map<string, ParsedTranslation[]>();
  for (const locale of LOCALES) {
    for (const translation of readTranslations(locale)) {
      const list = bySlug.get(translation.slug) ?? [];
      if (list.some((item) => item.locale === locale)) {
        throw new Error(`Duplicate slug "${translation.slug}" in ${locale}`);
      }
      list.push(translation);
      bySlug.set(translation.slug, list);
    }
  }

  const categories = new Map<string, Partial<Record<Locale, string>>>();
  const posts: ParsedPost[] = [];

  for (const [slug, translations] of bySlug) {
    const byLocale = Object.fromEntries(
      translations.map((item) => [item.locale, item]),
    ) as Partial<Record<Locale, ParsedTranslation>>;

    for (const locale of LOCALES) {
      if (!byLocale[locale]) warn(`${slug}: no ${locale} translation`);
    }

    const primary = byLocale.en ?? byLocale.vi ?? translations[0];
    const dates = new Set(translations.map((item) => item.date));
    const covers = new Set(translations.map((item) => item.coverImage));
    if (dates.size > 1) warn(`${slug}: dates differ between locales, using ${primary.locale}`);
    if (covers.size > 1) warn(`${slug}: cover images differ between locales, using ${primary.locale}`);

    let categorySlug: string | null = null;
    const categoryKey = byLocale.en?.category ?? primary.category;
    if (categoryKey) {
      categorySlug = slugify(categoryKey);
      const names = categories.get(categorySlug) ?? {};
      for (const translation of translations) {
        if (!translation.category) continue;
        const existing = names[translation.locale];
        if (existing && existing !== translation.category) {
          warn(
            `${slug}: category "${categorySlug}" is "${existing}" and "${translation.category}" in ${translation.locale}, keeping "${existing}"`,
          );
          continue;
        }
        names[translation.locale] = translation.category;
      }
      categories.set(categorySlug, names);
    }

    posts.push({
      slug,
      publishedAt: toIsoDate(primary.date, `${primary.locale}/${slug}`),
      coverImage: primary.coverImage,
      categorySlug,
      translations,
    });
  }

  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  // Category order follows the first (newest) post that uses each category.
  const categoryOrder = [
    ...new Set(posts.map((post) => post.categorySlug).filter(Boolean)),
  ] as string[];

  return { posts, categories, categoryOrder };
}

function localImageFile(src: string) {
  if (!src.startsWith("/")) {
    throw new Error(`Unsupported image source "${src}" (expected a /public path)`);
  }
  const file = path.join(PUBLIC_DIR, src);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    throw new Error(`Image path escapes public/: "${src}"`);
  }
  return file;
}

function postImagePublicId(slug: string, src: string) {
  const name = path.posix.basename(src, path.posix.extname(src));
  return `${CLOUDINARY_FOLDER}/posts/${slug}/${name}`;
}

type Upload = { publicId: string; file: string; contentType: string };

function planUpload(uploads: Map<string, Upload>, publicId: string, src: string) {
  const file = localImageFile(src);
  if (!fs.existsSync(file)) {
    warn(`Missing image ${src}, skipping ${publicId}`);
    return false;
  }

  const contentType = MIME_BY_EXT[path.extname(file).toLowerCase()];
  if (!contentType) {
    throw new Error(`${src}: unsupported image type`);
  }

  const size = fs.statSync(file).size;
  if (size > MAX_FILE_BYTES) {
    throw new Error(`${src}: ${size} bytes exceeds the 5 MB limit`);
  }

  uploads.set(publicId, { publicId, file, contentType });
  return true;
}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

/** Signed upload via the REST API; returns the delivery `secure_url`. */
async function uploadToCloudinary(config: CloudinaryConfig, upload: Upload) {
  const params: Record<string, string> = {
    allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
    overwrite: "false",
    public_id: upload.publicId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + config.apiSecret).digest("hex");

  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append("api_key", config.apiKey);
  form.append("signature", signature);
  form.append(
    "file",
    new Blob([fs.readFileSync(upload.file)], { type: upload.contentType }),
    path.basename(upload.file),
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const body = (await response.json()) as {
    secure_url?: string;
    error?: { message: string };
  };

  if (!response.ok || !body.secure_url) {
    throw new Error(
      `Cloudinary upload ${upload.publicId}: ${body.error?.message ?? response.status}`,
    );
  }
  if (!body.secure_url.startsWith(`https://res.cloudinary.com/${config.cloudName}/image/upload/`)) {
    throw new Error(`Cloudinary upload ${upload.publicId}: unexpected URL ${body.secure_url}`);
  }

  return body.secure_url;
}

async function main() {
  loadEnv();

  const { posts, categories, categoryOrder } = buildModel();

  const uploads = new Map<string, Upload>();
  planUpload(uploads, DEFAULT_COVER_PUBLIC_ID, DEFAULT_COVER_SOURCE);

  const coverIds = new Map<string, string | null>();
  const mediaRows = new Map<string, { position: number; publicId: string; alt: string }[]>();

  for (const post of posts) {
    let coverId: string | null = null;
    if (post.coverImage) {
      const publicId = postImagePublicId(post.slug, post.coverImage);
      if (planUpload(uploads, publicId, post.coverImage)) coverId = publicId;
    } else {
      warn(`${post.slug}: no cover image, the default cover will be used`);
    }
    coverIds.set(post.slug, coverId);

    const gallery = GALLERIES[post.slug] ?? [];
    const rows: { position: number; publicId: string; alt: string }[] = [];
    gallery.forEach((image, position) => {
      const publicId = postImagePublicId(post.slug, image.src);
      if (planUpload(uploads, publicId, image.src)) {
        rows.push({ position, publicId, alt: image.alt });
      }
    });
    mediaRows.set(post.slug, rows);
  }

  console.log(
    `Parsed ${posts.length} posts, ${posts.reduce((n, p) => n + p.translations.length, 0)} translations, ${categories.size} categories, ${uploads.size} images.`,
  );

  if (dryRun) {
    for (const post of posts) {
      console.log(
        `  ${post.slug}  ${post.publishedAt.slice(0, 10)}  [${post.translations.map((t) => t.locale).join(",")}]  ${post.categorySlug ?? "-"}  ${coverIds.get(post.slug) ?? "(default cover)"}  media=${mediaRows.get(post.slug)?.length ?? 0}`,
      );
    }
    console.log(`Dry run complete with ${warnings.length} warning(s). Nothing was written.`);
    return;
  }

  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const cloudinary: CloudinaryConfig = {
    cloudName: requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
  };

  console.log(`Uploading ${uploads.size} images to Cloudinary "${cloudinary.cloudName}"...`);
  const urls = new Map<string, string>();
  for (const upload of uploads.values()) {
    urls.set(upload.publicId, await uploadToCloudinary(cloudinary, upload));
  }
  const urlFor = (publicId: string) => {
    const url = urls.get(publicId);
    if (!url) throw new Error(`No Cloudinary URL for ${publicId}`);
    return url;
  };

  console.log("Upserting categories...");
  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      categoryOrder.map((slug, index) => ({ slug, sort_order: index })),
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (categoryError) throw new Error(`categories: ${categoryError.message}`);

  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

  const categoryTranslations = categoryOrder.flatMap((slug) =>
    LOCALES.flatMap((locale) => {
      const name = categories.get(slug)?.[locale];
      const categoryId = categoryIds.get(slug);
      return name && categoryId ? [{ category_id: categoryId, locale, name }] : [];
    }),
  );
  const { error: categoryTranslationError } = await supabase
    .from("category_translations")
    .upsert(categoryTranslations, { onConflict: "category_id,locale" });
  if (categoryTranslationError) {
    throw new Error(`category_translations: ${categoryTranslationError.message}`);
  }

  console.log("Upserting posts...");
  const { data: postRows, error: postError } = await supabase
    .from("posts")
    .upsert(
      posts.map((post) => {
        const coverId = coverIds.get(post.slug);
        return {
          slug: post.slug,
          status: "published" as const,
          published_at: post.publishedAt,
          category_id: post.categorySlug ? (categoryIds.get(post.categorySlug) ?? null) : null,
          cover_image_url: coverId ? urlFor(coverId) : null,
        };
      }),
      { onConflict: "slug" },
    )
    .select("id, slug");
  if (postError) throw new Error(`posts: ${postError.message}`);

  const postIds = new Map(postRows.map((row) => [row.slug, row.id]));
  const postId = (slug: string) => {
    const id = postIds.get(slug);
    if (!id) throw new Error(`posts: no id returned for "${slug}"`);
    return id;
  };

  const { error: translationError } = await supabase.from("post_translations").upsert(
    posts.flatMap((post) =>
      post.translations.map((translation) => ({
        post_id: postId(post.slug),
        locale: translation.locale,
        title: translation.title,
        description: translation.description,
        body: translation.body,
      })),
    ),
    { onConflict: "post_id,locale" },
  );
  if (translationError) throw new Error(`post_translations: ${translationError.message}`);

  const media = posts.flatMap((post) =>
    (mediaRows.get(post.slug) ?? []).map((row) => ({
      post_id: postId(post.slug),
      position: row.position,
      image_url: urlFor(row.publicId),
      alt: row.alt,
    })),
  );
  if (media.length > 0) {
    const { error: mediaError } = await supabase
      .from("post_media")
      .upsert(media, { onConflict: "post_id,position" });
    if (mediaError) throw new Error(`post_media: ${mediaError.message}`);
  }

  console.log("Verifying...");
  const counts = await Promise.all(
    (["categories", "category_translations", "posts", "post_translations", "post_media"] as const).map(
      async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        if (error) throw new Error(`count ${table}: ${error.message}`);
        return `${table}=${count}`;
      },
    ),
  );
  console.log(`  ${counts.join("  ")}`);

  const cloudinaryPrefix = "https://res.cloudinary.com/%";
  const [{ count: legacyCovers, error: legacyCoverError }, { count: legacyMedia, error: legacyMediaError }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .not("cover_image_url", "like", cloudinaryPrefix),
      supabase
        .from("post_media")
        .select("id", { count: "exact", head: true })
        .not("image_url", "like", cloudinaryPrefix),
    ]);
  if (legacyCoverError) throw new Error(`legacy covers: ${legacyCoverError.message}`);
  if (legacyMediaError) throw new Error(`legacy media: ${legacyMediaError.message}`);
  console.log(`  Non-Cloudinary image values left: posts=${legacyCovers} post_media=${legacyMedia}`);

  const expectedTranslations = posts.reduce((n, p) => n + p.translations.length, 0);
  const anon = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { count: publicCount, error: publicError } = await anon
    .from("published_post_cards")
    .select("slug", { count: "exact", head: true })
    .in("slug", posts.map((post) => post.slug));
  if (publicError) throw new Error(`public read: ${publicError.message}`);
  console.log(
    `  Publicly readable imported translations: ${publicCount}/${expectedTranslations}`,
  );

  console.log(`Import complete with ${warnings.length} warning(s).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
