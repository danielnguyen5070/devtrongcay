import Link from "next/link";

type Option = { value: string; label: string };

type Props = {
  hrefFor: (value: string) => string;
  current: string;
  options: Option[];
};

export function StatusFilter({ hrefFor, current, options }: Props) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {options.map((option) => {
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={hrefFor(option.value)}
            className={
              active
                ? "border border-foreground px-2 py-1"
                : "border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
            }
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
