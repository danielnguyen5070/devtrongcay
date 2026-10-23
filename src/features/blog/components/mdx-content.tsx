import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";

const prettyCodeOptions = {
  theme: "github-dark",
  keepBackground: false,
};

function safeHref(href: string | undefined) {
  if (!href) return undefined;
  const scheme = href.trim().match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  return !scheme || ["http", "https", "mailto"].includes(scheme) ? href : undefined;
}

const components: MDXComponents = {
  a: ({ href, ...props }) => <a href={safeHref(href)} {...props} />,
  img: (props) => {
    const { src, alt = "" } = props;
    if (!src || typeof src !== "string") return null;

    return (
      <span className="relative my-8 block aspect-[16/10] overflow-hidden border border-white/10">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 672px"
        />
      </span>
    );
  },
};

/**
 * Renders stored post bodies as plain Markdown (GFM). `format: "md"` disables
 * JSX and expressions, and raw HTML is stripped.
 */
function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        blockJS: true,
        mdxOptions: {
          format: "md",
          remarkPlugins: [remarkGfm],
          rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
        },
      }}
    />
  );
}

export { MdxContent };
