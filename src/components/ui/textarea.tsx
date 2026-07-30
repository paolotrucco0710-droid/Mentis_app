import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function TextArea({
  className,
  label,
  hint,
  id,
  ...props
}: TextAreaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-28 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary",
          className
        )}
        {...props}
      />
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
