import Image from "next/image";
import { cn } from "@/lib/utils";

type BlogImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

function BlogImage({
  src,
  alt,
  className,
  sizes = "(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw",
  priority = false,
}: BlogImageProps) {
  const isSvg = src.endsWith(".svg");

  return (
    <div className={cn("blog-image", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={isSvg}
        className="object-contain"
        sizes={sizes}
      />
    </div>
  );
}

export { BlogImage };
