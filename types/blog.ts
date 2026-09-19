export type BlogPostMeta = {
  title: string;
  description: string;
  slug: string;
  date: string;
  coverImage: string;
  category: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};
