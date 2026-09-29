export type BlogPostMeta = {
  title: string;
  description: string;
  slug: string;
  date: string;
  coverImage: string;
  category: string;
};

export type BlogMedia = {
  src: string;
  alt: string;
};

export type BlogProduct = {
  id: string;
  priceVnd: number | null;
  stock: number;
  productStatus: "draft" | "active" | "archived";
};

export type BlogPost = BlogPostMeta & {
  content: string;
  gallery: BlogMedia[];
  product: BlogProduct;
};
