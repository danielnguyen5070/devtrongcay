import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.5 8.5V6.8c0-.9.2-1.3 1.4-1.3H17V3h-2.5C11.7 3 10 4.6 10 7.4v1.1H8v2.7h2V21h3.2v-9.8h2.5l.4-2.7h-2.9Z" />
    </svg>
  );
}

function TwitterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.88-2.36 8.54 8.54 0 0 1-2.7 1.03 4.26 4.26 0 0 0-7.26 3.88A12.1 12.1 0 0 1 3.15 4.9a4.25 4.25 0 0 0 1.32 5.68 4.22 4.22 0 0 1-1.93-.53v.05a4.26 4.26 0 0 0 3.42 4.18 4.3 4.3 0 0 1-1.92.07 4.27 4.27 0 0 0 3.98 2.96A8.55 8.55 0 0 1 2 18.58 12.07 12.07 0 0 0 8.56 20.5c7.88 0 12.2-6.53 12.2-12.2v-.56A8.7 8.7 0 0 0 22.46 6Z" />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.35" cy="6.65" r="1.15" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.34 9.2H3.56V20.5h2.78V9.2ZM4.95 3.5a1.72 1.72 0 1 0 0 3.44 1.72 1.72 0 0 0 0-3.44ZM20.44 20.5h-2.77v-5.5c0-1.31-.02-2.99-1.82-2.99-1.83 0-2.11 1.42-2.11 2.9v5.59H10.97V9.2h2.66v1.54h.04c.37-.7 1.27-1.44 2.62-1.44 2.8 0 3.32 1.84 3.32 4.24V20.5Z" />
    </svg>
  );
}

function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2.2c-5.46 0-9.9 4.44-9.9 9.9 0 4.37 2.84 8.08 6.78 9.39.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.76.6-3.34-1.33-3.34-1.33-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.52 1.02 1.52 1.02.89 1.52 2.33 1.08 2.9.83.09-.65.35-1.08.63-1.33-2.2-.25-4.52-1.1-4.52-4.9 0-1.08.39-1.97 1.02-2.66-.1-.25-.44-1.27.1-2.65 0 0 .83-.27 2.73 1.01a9.5 9.5 0 0 1 4.97 0c1.9-1.28 2.73-1.01 2.73-1.01.54 1.38.2 2.4.1 2.65.64.69 1.02 1.58 1.02 2.66 0 3.81-2.32 4.65-4.53 4.9.36.31.67.92.67 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A9.92 9.92 0 0 0 21.9 12.1c0-5.46-4.44-9.9-9.9-9.9Z"
      />
    </svg>
  );
}

function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.91C18.05 4.9 12 4.9 12 4.9s-6.05 0-7.7.39A2.7 2.7 0 0 0 2.4 7.2 28.2 28.2 0 0 0 2 12a28.2 28.2 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.91c1.65.39 7.7.39 7.7.39s6.05 0 7.7-.39a2.7 2.7 0 0 0 1.9-1.91A28.2 28.2 0 0 0 22 12a28.2 28.2 0 0 0-.4-4.8ZM10.2 15.05V8.95L15.5 12l-5.3 3.05Z" />
    </svg>
  );
}

export type SocialLink = {
  name: string;
  href: string;
  color: string;
  icon: ComponentType<IconProps>;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "Facebook",
    href: "https://facebook.com/devtrongcay",
    color: "#3b5998",
    icon: FacebookIcon,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/devtrongcay",
    color: "#1da1f2",
    icon: TwitterIcon,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/devtrongcay",
    color: "#e1306c",
    icon: InstagramIcon,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/devtrongcay",
    color: "#0077b5",
    icon: LinkedInIcon,
  },
  {
    name: "GitHub",
    href: "https://github.com/devtrongcay",
    color: "#333333",
    icon: GitHubIcon,
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@devtrongcay",
    color: "#ff0000",
    icon: YouTubeIcon,
  },
];

type FloatingSocialBarProps = {
  links?: SocialLink[];
  className?: string;
  label?: string;
};

function FloatingSocialBar({
  links = SOCIAL_LINKS,
  className,
  label = "Social media",
}: FloatingSocialBarProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "pointer-events-none fixed top-1/2 left-0 z-40 hidden -translate-y-1/2 md:block",
        className,
      )}
    >
      <ul className="group/social pointer-events-auto m-0 flex list-none flex-col p-0 shadow-[2px_3px_10px_rgba(0,0,0,0.28)]">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <li key={link.name} className="m-0 p-0">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className="grid h-12 grid-cols-[3rem_0fr] text-white transition-[grid-template-columns] duration-300 ease-out group-hover/social:grid-cols-[3rem_1fr] focus-visible:grid-cols-[3rem_1fr] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                style={{ backgroundColor: link.color }}
              >
                <span className="flex size-12 shrink-0 items-center justify-center">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 overflow-hidden">
                  <span className="flex h-full items-center pr-4 text-[0.7rem] font-bold tracking-[0.14em] whitespace-nowrap uppercase">
                    {link.name}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { FloatingSocialBar };
