import { cn } from "@/lib/utils";

const STAR_PATH =
  "M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z";

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(
        className ?? "size-4",
        filled ? "fill-[#c8d4c0] text-[#c8d4c0]" : "fill-transparent text-white/30",
      )}
    >
      <path d={STAR_PATH} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/** Read-only row of five stars; `value` is rounded to the nearest whole star. */
function StarRating({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const filled = Math.round(value);

  return (
    <span role="img" aria-label={label} className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} filled={star <= filled} />
      ))}
    </span>
  );
}

export { Star, StarRating };
