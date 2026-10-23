import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function strokeProps(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

function BagIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CloseIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function MinusIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M6 12h12" />
    </svg>
  );
}

function PlusIcon(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export { BagIcon, CloseIcon, MinusIcon, PlusIcon };
