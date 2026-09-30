import { Link } from "@/i18n/navigation";
import type { BlogPostMeta } from "@/types/blog";
import { BlogImage } from "./blog-image";

type BlogTileProps = {
  post: BlogPostMeta;
  priority?: boolean;
};

function BlogTile({ post, priority = false }: BlogTileProps) {
  const label = post.scientificNameShort || post.title;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="blog-tile"
      aria-label={label}
    >
      <BlogImage src={post.coverImage} alt={post.title} priority={priority} />
      <div className="blog-tile-label">
        <span>{label}</span>
      </div>
    </Link>
  );
}

export { BlogTile };
