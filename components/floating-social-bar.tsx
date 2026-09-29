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

function TikTokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.6 7.8a6.5 6.5 0 0 1-3.7-1.2v7.3a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 1 0 2 2.7V2.5h2.8a3.7 3.7 0 0 0 3.7 3.7v1.6Z" />
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

function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.6 3.5h2.7l-5.9 6.75L21.7 20.5h-5.2l-4.07-5.32L7.8 20.5H5.1l6.32-7.22L2.4 3.5h5.33l3.68 4.87L17.6 3.5Zm-.95 15.27h1.5L7.5 5.13H5.9l10.75 13.64Z" />
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
    href: "https://www.facebook.com/viet.nguyen.555528",
    color: "#3b5998",
    icon: FacebookIcon,
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@viet.nguyen.hoang49",
    color: "#010101",
    icon: TikTokIcon,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@vietcode98",
    color: "#ff0000",
    icon: YouTubeIcon,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/nguyenviet4711/",
    color: "#e1306c",
    icon: InstagramIcon,
  },
  {
    name: "X",
    href: "https://x.com/VietNguyenwzaa",
    color: "#000000",
    icon: XIcon,
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
      <div className="pointer-events-auto flex flex-col">
        <ul className="group/social m-0 flex list-none flex-col p-0 shadow-[2px_3px_10px_rgba(0,0,0,0.28)]">
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
      </div>
    </nav>
  );
}

export { FloatingSocialBar };
