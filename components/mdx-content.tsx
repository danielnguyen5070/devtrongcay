import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";

const prettyCodeOptions = {
  theme: "github-dark",
  keepBackground: false,
};

const components: MDXComponents = {
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

function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
        },
      }}
    />
  );
}

export { MdxContent };
