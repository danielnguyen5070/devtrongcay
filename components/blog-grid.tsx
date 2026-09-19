import type { BlogPostMeta } from "@/types/blog";
import { BlogTile } from "./blog-tile";

type BlogGridProps = {
  posts: BlogPostMeta[];
  label: string;
  emptyLabel: string;
};

function BlogGrid({ posts, label, emptyLabel }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <main className="grid-area">
        <p className="px-6 py-16 text-center text-sm tracking-[0.3em] text-muted-foreground uppercase">
          {emptyLabel}
        </p>
      </main>
    );
  }

  return (
    <main className="grid-area">
      <section className="blog-grid" aria-label={label}>
        {posts.map((post, index) => (
          <BlogTile key={post.slug} post={post} priority={index < 5} />
        ))}
      </section>
    </main>
  );
}

export { BlogGrid };
