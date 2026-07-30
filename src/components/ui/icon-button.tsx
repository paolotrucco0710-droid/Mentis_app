import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
}

export function IconButton({
  className,
  label,
  size = "md",
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent",
        size === "sm" ? "h-9 w-9" : "h-11 w-11",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
