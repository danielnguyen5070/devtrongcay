/**
 * One-time import of the MDX blog (content/blogs/{vi,en}) and its images
 * (public/images/blog) into Supabase.
 *
 *   npm run content:import              # write to Supabase
 *   npm run content:import -- --dry-run # parse and validate only
 *
 * Requires in .env.local (local only):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
 *
 * Idempotent: rows are upserted on their natural keys (slugs, locale, media
 * position) and images are uploaded with upsert, so re-running never creates
 * duplicates. Re-running does overwrite imported rows with the MDX values,
 * including setting those posts back to `published`. Nothing is deleted.
 */
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
const BUCKET = "blog-media";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_COVER_SOURCE = "/images/blog/green-on-green.webp";
const DEFAULT_COVER_PATH = "defaults/cover.webp";

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

function postImagePath(slug: string, src: string) {
  return `posts/${slug}/${path.posix.basename(src)}`;
}

type Upload = { storagePath: string; file: string; contentType: string };

function planUpload(uploads: Map<string, Upload>, storagePath: string, src: string) {
  const file = localImageFile(src);
  if (!fs.existsSync(file)) {
    warn(`Missing image ${src}, skipping ${storagePath}`);
    return false;
  }

  const contentType = MIME_BY_EXT[path.extname(file).toLowerCase()];
  if (!contentType) {
    throw new Error(`${src}: unsupported image type`);
  }

  const size = fs.statSync(file).size;
  if (size > MAX_FILE_BYTES) {
    throw new Error(`${src}: ${size} bytes exceeds the 5 MB bucket limit`);
  }

  uploads.set(storagePath, { storagePath, file, contentType });
  return true;
}

async function main() {
  loadEnv();

  const { posts, categories, categoryOrder } = buildModel();

  const uploads = new Map<string, Upload>();
  planUpload(uploads, DEFAULT_COVER_PATH, DEFAULT_COVER_SOURCE);

  const coverPaths = new Map<string, string | null>();
  const mediaRows = new Map<string, { position: number; storagePath: string; alt: string }[]>();

  for (const post of posts) {
    let coverPath: string | null = null;
    if (post.coverImage) {
      const storagePath = postImagePath(post.slug, post.coverImage);
      if (planUpload(uploads, storagePath, post.coverImage)) coverPath = storagePath;
    } else {
      warn(`${post.slug}: no cover image, the default cover will be used`);
    }
    coverPaths.set(post.slug, coverPath);

    const gallery = GALLERIES[post.slug] ?? [];
    const rows: { position: number; storagePath: string; alt: string }[] = [];
    gallery.forEach((image, position) => {
      const storagePath = postImagePath(post.slug, image.src);
      if (planUpload(uploads, storagePath, image.src)) {
        rows.push({ position, storagePath, alt: image.alt });
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
        `  ${post.slug}  ${post.publishedAt.slice(0, 10)}  [${post.translations.map((t) => t.locale).join(",")}]  ${post.categorySlug ?? "-"}  ${coverPaths.get(post.slug) ?? "(default cover)"}  media=${mediaRows.get(post.slug)?.length ?? 0}`,
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

  console.log(`Uploading ${uploads.size} images to "${BUCKET}"...`);
  for (const upload of uploads.values()) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(upload.storagePath, fs.readFileSync(upload.file), {
        contentType: upload.contentType,
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`Upload ${upload.storagePath}: ${error.message}`);
  }

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
      posts.map((post) => ({
        slug: post.slug,
        status: "published" as const,
        published_at: post.publishedAt,
        category_id: post.categorySlug ? (categoryIds.get(post.categorySlug) ?? null) : null,
        cover_image_path: coverPaths.get(post.slug) ?? null,
      })),
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
      storage_path: row.storagePath,
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
