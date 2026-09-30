export type BlogPostMeta = {
  title: string;
  description: string;
  slug: string;
  date: string;
  coverImage: string;
  category: string;
  /** Genus-abbreviated botanical name, e.g. "P. ridleyi"; empty for care articles. */
  scientificNameShort: string;
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
  updatedAt?: string;
  content: string;
  gallery: BlogMedia[];
  product: BlogProduct;
};
