"use client";

import { useTranslations } from "next-intl";
import { MAX_ITEM_QUANTITY } from "@/lib/cart/types";
import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "./icons";

type QuantityStepperProps = {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Upper bound for the + button. Never forces the value down. */
  max?: number;
  disabled?: boolean;
  className?: string;
};

function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  max = MAX_ITEM_QUANTITY,
  disabled = false,
  className,
}: QuantityStepperProps) {
  const t = useTranslations("cart");
  const upper = Math.min(max, MAX_ITEM_QUANTITY);
  const buttonClass =
    "grid size-8 place-items-center text-[#9da39a] transition-colors hover:text-[#e7e9e3] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-[#9da39a]";

  return (
    <div
      role="group"
      aria-label={t("quantity")}
      className={cn("inline-flex items-center border border-white/14", className)}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={onDecrement}
        disabled={disabled || value <= 1}
        aria-label={t("decrease")}
      >
        <MinusIcon className="size-3.5" />
      </button>
      <output
        aria-live="polite"
        className="min-w-8 text-center text-sm tabular-nums text-[#e7e9e3]"
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={onIncrement}
        disabled={disabled || value >= upper}
        aria-label={t("increase")}
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}

export { QuantityStepper };
