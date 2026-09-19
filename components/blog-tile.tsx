import { Link } from "@/i18n/navigation";
import { getPostCover } from "@/lib/blog";
import type { BlogPostMeta } from "@/types/blog";
import { BlogImage } from "./blog-image";

type BlogTileProps = {
  post: BlogPostMeta;
  priority?: boolean;
};

function BlogTile({ post, priority = false }: BlogTileProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="blog-tile"
      aria-label={post.title}
    >
      <BlogImage src={getPostCover(post)} alt={post.title} priority={priority} />
      <div className="blog-tile-label">
        <span>{post.title}</span>
      </div>
    </Link>
  );
}

export { BlogTile };
