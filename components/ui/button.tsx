import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        primary: "bg-ink text-surface hover:bg-ink/85",
        outline: "border border-line bg-surface text-ink hover:bg-panel",
        ghost: "bg-transparent hover:bg-surface/10",
      },
      size: { sm: "h-9 px-3 text-xs", md: "h-12 px-4 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({className,variant,size,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&VariantProps<typeof buttonVariants>){
  return <button className={cn(buttonVariants({variant,size}),className)} {...props}/>;
}
