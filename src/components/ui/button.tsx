import { forwardRef } from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "ghost" | "outline";
type Size = "default" | "icon" | "sm";

const variants: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
