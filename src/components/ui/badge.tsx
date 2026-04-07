import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-[1.375rem] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700 [a]:hover:bg-slate-200/90",
        success:
          "border-emerald-200/90 bg-emerald-50 text-emerald-900 [a]:hover:bg-emerald-100/90",
        warning:
          "border-amber-200/90 bg-amber-50 text-amber-950 [a]:hover:bg-amber-100/90",
        info:
          "border-blue-200/90 bg-blue-50 text-blue-950 [a]:hover:bg-blue-100/90",
        destructive:
          "border-red-200/90 bg-red-50 text-red-900 focus-visible:ring-red-200/50 [a]:hover:bg-red-100/90",
        overdue:
          "border-red-300/90 bg-red-100 text-red-900 font-semibold focus-visible:ring-red-200/50 [a]:hover:bg-red-200/90",
        outline:
          "border-border bg-card text-foreground [a]:hover:bg-muted",
        ghost:
          "border-transparent hover:bg-muted hover:text-foreground",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
